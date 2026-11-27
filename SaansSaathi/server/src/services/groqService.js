
import Groq from 'groq-sdk';

import { getWeatherByCity } from './weatherService.js';
import { findNearbyHospitals } from './nearbyPlacesService.js';
import { getHistoricalAirQuality } from './historicalAirQualityService.js';

const apiKey = process.env.GROQ_API_KEY;

if (!apiKey) {
  throw new Error('GROQ_API_KEY is missing from environment variables.');
}

const groq = new Groq({ apiKey });

const MODEL_NAME = 'openai/gpt-oss-120b';
const MAX_TOOL_ROUNDS = 3;
const HOSPITAL_SEARCH_RADIUS = 5000;

// ==========================================
// 1. SYSTEM INSTRUCTION
// ==========================================

const SYSTEM_INSTRUCTION = `
You are SaansSaathi AI, a friendly and intelligent
personal environmental assistant.

YOUR ROLE:
- Answer general questions across a wide range of topics.
- Help users understand their surrounding environment.
- Explain air quality and pollution in simple language.
- Provide practical environmental and lifestyle suggestions.
- Maintain context throughout conversations.
- Provide expertise in sustainability and environmental science.

COMMUNICATION STYLE:
- Use simple, everyday English.
- Speak naturally and helpfully.
- Keep answers concise and easy to understand.
- Prefer short paragraphs and simple bullet points.
- Avoid unnecessary technical terminology and statistics.

ENVIRONMENTAL RESPONSES:
- Use dashboard readings when environmental context is provided.
- Explain what readings mean for everyday life.
- Highlight relevant pollutants.
- Never invent missing environmental readings.
- Mention timestamps when relevant.
- Never claim one reading guarantees completely safe air.

HISTORICAL AQI RESPONSES:
- Use only the historical readings supplied by the backend.
- Never invent or estimate missing historical AQI values.
- Clearly distinguish US AQI from European AQI.
- Mention the requested date and local time.
- Historical air-quality values are model-based estimates,
  not necessarily direct ground-station measurements.
- If an exact hourly reading is unavailable, say so.
- Never present forecast values as historical observations.

WEATHER RESPONSES:
- For weather questions about the dashboard location,
  use the supplied dashboard weather data.
- For weather questions about another city,
  call the get_city_weather tool.
- Never invent weather measurements.
- Use the actual location and timestamp returned by the tool.
- Report temperature in Celsius, humidity in percentage,
  wind speed in km/h and precipitation in mm when available.
- If the weather tool fails, explain that the information
  is temporarily unavailable.
- Never confuse weather conditions with air-quality measurements.

HOSPITAL AND NEARBY FACILITY RESPONSES:
- Use only the hospital results supplied by the backend.
- Never invent hospital names, addresses, phone numbers or distances.
- Results are based on OpenStreetMap data and may be incomplete.
- Clearly state when no facilities are found.
- Do not claim that a facility provides emergency services
  unless the supplied data verifies it.
- Present the nearest facilities first.
- Distances are approximate straight-line distances,
  not road or travel distances.
- If location coordinates are unavailable, ask the user
  to enable location access.

GENERAL:
- Answer general questions without unnecessarily calling tools.
- Do not call the weather tool for unrelated questions.
- Do not claim to have fetched data unless the tool succeeded.
- Do not invent forecasts when only current weather is provided.

SAFETY:
- Provide general environmental and health information.
- Never diagnose medical conditions.
- Avoid unsupported health claims.
- Encourage professional medical advice for concerning symptoms.

RESPONSE LENGTH:
- Simple questions: 2-4 sentences.
- Environmental questions: a short summary and 2-4 suggestions.
- Detailed explanations: provide more depth when requested.

PERSONALITY:
- Friendly, approachable and supportive.
- Use emojis sparingly.

Your goal is to make environmental information
understandable and useful to everyone.
`;

// ==========================================
// 2. WEATHER FUNCTION TOOL
// ==========================================

const WEATHER_TOOL = [
  {
    type: 'function',
    function: {
      name: 'get_city_weather',
      description:
        'Fetch current weather conditions for a city anywhere in the world. Use this when the user asks about weather in a city other than the dashboard location.',
      parameters: {
        type: 'object',
        properties: {
          city: {
            type: 'string',
            description: 'The requested city name.',
          },
        },
        required: ['city'],
        additionalProperties: false,
      },
    },
  },
];

// ==========================================
// 3. HOSPITAL REQUEST DETECTION
// ==========================================

const isNearbyHospitalRequest = (message) => {
  return /\b(hospitals?|clinics?|medical facilities|healthcare facilities)\b/i.test(
    message
  ) && /\b(near me|nearby|nearest|closest|around me|near my location)\b/i.test(
    message
  );
};

// ==========================================
// 4. DISTANCE CALCULATION
// ==========================================

const calculateDistance = (
  latitude1,
  longitude1,
  latitude2,
  longitude2
) => {
  const toRadians = (degrees) => (degrees * Math.PI) / 180;

  const earthRadiusKm = 6371;

  const dLatitude = toRadians(latitude2 - latitude1);
  const dLongitude = toRadians(longitude2 - longitude1);

  const a =
    Math.sin(dLatitude / 2) ** 2 +
    Math.cos(toRadians(latitude1)) *
      Math.cos(toRadians(latitude2)) *
      Math.sin(dLongitude / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusKm * c;
};

// ==========================================
// 5. NEARBY HOSPITAL CONTEXT
// ==========================================

const getNearbyHospitalContext = async (environmentalContext) => {
  const latitude = environmentalContext?.latitude;
  const longitude = environmentalContext?.longitude;

  if (
    !Number.isFinite(latitude) ||
    latitude < -90 ||
    latitude > 90 ||
    !Number.isFinite(longitude) ||
    longitude < -180 ||
    longitude > 180
  ) {
    return {
      success: false,
      message: 'Current location coordinates are unavailable.',
    };
  }

  const hospitals = await findNearbyHospitals(
    latitude,
    longitude,
    HOSPITAL_SEARCH_RADIUS
  );

  const results = hospitals
    .map((hospital) => ({
      ...hospital,
      distanceKm: calculateDistance(
        latitude,
        longitude,
        hospital.latitude,
        hospital.longitude
      ),
    }))
    .filter(
      (hospital) =>
        hospital.distanceKm <= HOSPITAL_SEARCH_RADIUS / 1000
    )
    .sort((a, b) => a.distanceKm - b.distanceKm);

  return {
    success: true,
    searchRadiusKm: HOSPITAL_SEARCH_RADIUS / 1000,
    location: environmentalContext.location,
    resultCount: results.length,
    hospitals: results.map((hospital) => ({
      name: hospital.name,
      type: hospital.type,
      address: hospital.address,
      distanceKm: Number(hospital.distanceKm.toFixed(2)),
      phone: hospital.phone,
      website: hospital.website,
      osmUrl: hospital.osmUrl,
    })),
    source: 'OpenStreetMap',
  };
};

// ==========================================
// 6. WEATHER TOOL EXECUTION
// ==========================================

const executeWeatherTool = async (toolCall) => {
  const { arguments: rawArguments } = toolCall.function;

  let args;

  try {
    args = JSON.parse(rawArguments);
  } catch {
    throw new Error('Invalid weather tool arguments.');
  }

  if (
    typeof args.city !== 'string' ||
    !args.city.trim() ||
    args.city.trim().length > 100
  ) {
    throw new Error('Invalid city name.');
  }

  return getWeatherByCity(args.city.trim());
};

// ==========================================
// 7. HISTORICAL AQI REQUEST DETECTION
// ==========================================

const isHistoricalAqiRequest = (message) => {
  const asksAboutAqi =
    /\b(aqi|air quality|pollution|pm2\.?5|pm10)\b/i.test(message);

  const asksAboutPast =
    /\b(what was|how was|historical|history|yesterday|last night|last week|previous|past|earlier|at)\b/i.test(
      message
    );

  return asksAboutAqi && asksAboutPast;
};

// ==========================================
// 8. LOCAL DATE UTILITIES
// ==========================================

const getLocalDate = (timezone = 'UTC') => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());

  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value])
  );

  return `${values.year}-${values.month}-${values.day}`;
};

const addDaysToDate = (date, days) => {
  const result = new Date(`${date}T00:00:00Z`);

  result.setUTCDate(result.getUTCDate() + days);

  return result.toISOString().slice(0, 10);
};

// ==========================================
// 9. EXTRACT REQUESTED HISTORICAL DATE
// ==========================================

const extractHistoricalDate = (message, timezone) => {
  // Explicit ISO date: 2026-11-27
  const explicitDate = message.match(
    /\b(20\d{2}-\d{2}-\d{2})\b/
  );

  if (explicitDate) {
    return explicitDate[1];
  }

  const today = getLocalDate(timezone);

  if (/\byesterday\b|\blast night\b/i.test(message)) {
    return addDaysToDate(today, -1);
  }

  if (/\bday before yesterday\b/i.test(message)) {
    return addDaysToDate(today, -2);
  }

  if (/\btoday\b/i.test(message)) {
    return today;
  }

  // Default: today's local date
  return today;
};

// ==========================================
// 10. EXTRACT REQUESTED HOUR
// ==========================================

const extractRequestedHour = (message) => {
  // Matches 4 PM, 4:30 PM, 16:00, etc.
  const twelveHourMatch = message.match(
    /\b(1[0-2]|0?[1-9])(?::([0-5]\d))?\s*(am|pm)\b/i
  );

  if (twelveHourMatch) {
    const hour = Number(twelveHourMatch[1]);
    const minutes = Number(twelveHourMatch[2] || 0);
    const period = twelveHourMatch[3].toLowerCase();

    let normalizedHour = hour % 12;

    if (period === 'pm') {
      normalizedHour += 12;
    }

    return {
      hour: normalizedHour,
      minutes,
      requestedTime: `${String(normalizedHour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`,
    };
  }

  const twentyFourHourMatch = message.match(
    /\b([01]\d|2[0-3]):([0-5]\d)\b/
  );

  if (twentyFourHourMatch) {
    const hour = Number(twentyFourHourMatch[1]);
    const minutes = Number(twentyFourHourMatch[2]);

    return {
      hour,
      minutes,
      requestedTime: `${String(hour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`,
    };
  }

  return null;
};

// ==========================================
// 11. FETCH HISTORICAL AQI CONTEXT
// ==========================================

const getHistoricalAqiContext = async (
  message,
  environmentalContext
) => {
  const latitude = environmentalContext?.latitude;
  const longitude = environmentalContext?.longitude;

  if (
    !Number.isFinite(latitude) ||
    latitude < -90 ||
    latitude > 90 ||
    !Number.isFinite(longitude) ||
    longitude < -180 ||
    longitude > 180
  ) {
    return {
      success: false,
      message: 'Dashboard location coordinates are unavailable.',
    };
  }

  const timezone =
    environmentalContext?.airQuality?.timezone ||
    'Asia/Kolkata';

  const date = extractHistoricalDate(message, timezone);
  const requestedTime = extractRequestedHour(message);

  // Retrieve the requested day's hourly data
  const historicalData = await getHistoricalAirQuality(
    latitude,
    longitude,
    date
  );

  // If the user asks for a particular hour,
  // return only that hourly reading.
  if (requestedTime) {
    if (requestedTime.minutes !== 0) {
      return {
        success: false,
        requestedDate: date,
        requestedTime: requestedTime.requestedTime,
        message:
          'The API provides hourly readings, not exact minute-level measurements. No exact reading is available for the requested minute.',
        timezone,
        source: historicalData.source,
      };
    }

    const reading = historicalData.readings.find(
      (item) =>
        Number(item.time.slice(11, 13)) === requestedTime.hour
    );

    if (!reading) {
      return {
        success: false,
        requestedDate: date,
        requestedTime: requestedTime.requestedTime,
        message: 'No hourly reading is available for this time.',
        timezone,
        source: historicalData.source,
      };
    }

    return {
      success: true,
      location: historicalData.location,
      requestedDate: date,
      requestedTime: requestedTime.requestedTime,
      timezone,
      reading,
      source: historicalData.source,
      disclaimer: historicalData.disclaimer,
    };
  }

  // If no specific time was requested,
  // provide the full day's hourly readings.
  return {
    success: true,
    location: historicalData.location,
    requestedDate: date,
    timezone,
    totalReadings: historicalData.totalReadings,
    readings: historicalData.readings,
    source: historicalData.source,
    disclaimer: historicalData.disclaimer,
  };
};

// ==========================================
// 12. MAIN GROQ RESPONSE GENERATOR
// ==========================================

export const generateGroqResponse = async (
  messages,
  environmentalContext = null
) => {
  const contextMessage = environmentalContext
    ? {
        role: 'system',
        content: `
CURRENT DASHBOARD ENVIRONMENTAL CONTEXT

LOCATION:
${environmentalContext.location}

AIR-QUALITY READINGS:
${JSON.stringify(environmentalContext.airQuality, null, 2)}

WEATHER READINGS:
${
  environmentalContext.weather
    ? JSON.stringify(environmentalContext.weather, null, 2)
    : 'Weather data is currently unavailable.'
}

READING TIMESTAMP:
${environmentalContext.readingTime || 'Unavailable'}

INSTRUCTIONS:
- These readings belong only to the dashboard location.
- Use them for questions about the user's local environment.
- For another city's weather, use get_city_weather.
- Never present dashboard readings as readings for another city.
- Never invent missing measurements.
- Mention timestamps and locations when relevant.
- Keep explanations understandable and concise.
        `,
      }
    : null;

  const conversationMessages = [
    {
      role: 'system',
      content: SYSTEM_INSTRUCTION,
    },
    ...(contextMessage ? [contextMessage] : []),
    ...messages,
  ];

  // ==========================================
  // 13. IDENTIFY LATEST USER MESSAGE
  // ==========================================

  const latestUserMessage = [...messages]
    .reverse()
    .find((item) => item.role === 'user')?.content || '';

  // ==========================================
  // 14. HISTORICAL AQI RETRIEVAL
  // ==========================================

  if (isHistoricalAqiRequest(latestUserMessage)) {
    let historicalContext;

    try {
      historicalContext = await getHistoricalAqiContext(
        latestUserMessage,
        environmentalContext
      );
    } catch (error) {
      console.error('[Historical AQI Lookup]', error.message);

      historicalContext = {
        success: false,
        message:
          'Historical air-quality information is temporarily unavailable.',
      };
    }

    conversationMessages.push({
      role: 'system',
      content: `
VERIFIED HISTORICAL AIR QUALITY RESULTS

${JSON.stringify(historicalContext, null, 2)}

STRICT INSTRUCTIONS:
- Use only the historical results above.
- Never invent missing AQI readings.
- If success is false, explain the reason clearly.
- If a specific time was requested, answer using that exact hourly record.
- Clearly identify US AQI and European AQI.
- Include the requested date and local time.
- Mention that the values are model-based estimates.
- Never confuse pollutant concentrations with AQI values.
      `,
    });
  }

  // ==========================================
  // 15. NEARBY HOSPITAL RETRIEVAL
  // ==========================================

  if (isNearbyHospitalRequest(latestUserMessage)) {
    let hospitalContext;

    try {
      hospitalContext = await getNearbyHospitalContext(
        environmentalContext
      );
    } catch (error) {
      console.error('[Hospital Lookup]', error.message);

      hospitalContext = {
        success: false,
        message:
          'Nearby hospital information is temporarily unavailable.',
      };
    }

    conversationMessages.push({
      role: 'system',
      content: `
VERIFIED NEARBY HOSPITAL SEARCH RESULTS

${JSON.stringify(hospitalContext, null, 2)}

STRICT INSTRUCTIONS:
- Answer using only the hospital search results above.
- Never invent additional facilities.
- Never invent missing distances or contact details.
- If success is false, explain that the lookup failed.
- If resultCount is zero, explain that no mapped facilities
  were found within the search radius.
- Distances are straight-line estimates, not road distances.
      `,
    });
  }

  // ==========================================
  // 16. GROQ TOOL-CALLING LOOP
  // ==========================================

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const completion = await groq.chat.completions.create({
      model: MODEL_NAME,
      messages: conversationMessages,
      tools: WEATHER_TOOL,
      tool_choice: 'auto',
      parallel_tool_calls: false,
      temperature: 0.5,
      max_tokens: 1024,
    });

    const assistantMessage = completion.choices[0]?.message;

    if (!assistantMessage) {
      throw new Error('Groq returned an empty response.');
    }

    const toolCalls = assistantMessage.tool_calls || [];

    if (toolCalls.length === 0) {
      const reply = assistantMessage.content;

      if (!reply) {
        throw new Error('Groq returned an empty response.');
      }

      return reply;
    }

    conversationMessages.push({
      role: 'assistant',
      content: assistantMessage.content ?? null,
      tool_calls: toolCalls,
    });

    for (const toolCall of toolCalls) {
      let result;

      try {
        if (toolCall.function.name === 'get_city_weather') {
          result = await executeWeatherTool(toolCall);
        } else {
          throw new Error(
            `Unsupported tool: ${toolCall.function.name}`
          );
        }
      } catch (error) {
        console.error('[Weather Tool]', error.message);

        result = {
          success: false,
          message: 'Weather information could not be retrieved.',
        };
      }

      conversationMessages.push({
        role: 'tool',
        tool_call_id: toolCall.id,
        name: toolCall.function.name,
        content: JSON.stringify(result),
      });
    }
  }

  throw new Error('Maximum weather tool calls reached.');
};
