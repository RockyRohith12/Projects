
import { generateGroqResponse } from '../services/groqService.js';
import {
  getConversation,
  saveMessage,
} from '../services/conversationService.js';

const ALLOWED_AQI_FIELDS = [
  'us_aqi',
  'european_aqi',
  'pm2_5',
  'pm10',
  'carbon_monoxide',
  'nitrogen_dioxide',
  'sulphur_dioxide',
  'ozone',
];

const ALLOWED_WEATHER_FIELDS = [
  'temperature_2m',
  'relative_humidity_2m',
  'apparent_temperature',
  'precipitation',
  'rain',
  'showers',
  'weather_code',
  'cloud_cover',
  'wind_speed_10m',
  'wind_gusts_10m',
];

const validateEnvironmentalContext = (context) => {
  if (context === undefined || context === null) {
    return null;
  }

  if (
    typeof context !== 'object' ||
    Array.isArray(context)
  ) {
    throw new Error('Invalid environmental context.');
  }

  const {
    location,
    airQuality,
    weather,
    readingTime,
  } = context;

  if (
    typeof location !== 'string' ||
    location.length > 200
  ) {
    throw new Error('Invalid location information.');
  }

  if (
    !airQuality ||
    typeof airQuality !== 'object' ||
    Array.isArray(airQuality)
  ) {
    throw new Error('Invalid air-quality information.');
  }

  // Validate air-quality values
  const safeAirQuality = {};

  for (const field of ALLOWED_AQI_FIELDS) {
    const value = airQuality[field];

    if (value !== undefined) {
      if (
        typeof value !== 'number' ||
        !Number.isFinite(value)
      ) {
        throw new Error(`Invalid air-quality value: ${field}`);
      }

      safeAirQuality[field] = value;
    }
  }

  // Validate weather values
  let safeWeather = null;

  if (weather !== undefined && weather !== null) {
    if (
      typeof weather !== 'object' ||
      Array.isArray(weather)
    ) {
      throw new Error('Invalid weather information.');
    }

    safeWeather = {};

    for (const field of ALLOWED_WEATHER_FIELDS) {
      const value = weather[field];

      if (value !== undefined) {
        if (
          typeof value !== 'number' ||
          !Number.isFinite(value)
        ) {
          throw new Error(`Invalid weather value: ${field}`);
        }

        safeWeather[field] = value;
      }
    }
  }

  return {
    location,
    airQuality: safeAirQuality,
    weather: safeWeather,
    readingTime:
      typeof readingTime === 'string'
        ? readingTime.slice(0, 100)
        : 'Unavailable',
  };
};

export const chatWithAssistant = async (req, res) => {
  console.log('[AI] Request received');

  try {
    const {
      message,
      conversationId,
      environmentalContext,
    } = req.body;

    if (
      typeof message !== 'string' ||
      !message.trim() ||
      message.length > 4000
    ) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid message (maximum 4000 characters).',
      });
    }

    if (
      conversationId !== undefined &&
      (
        typeof conversationId !== 'string' ||
        !conversationId.trim()
      )
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid conversation ID.',
      });
    }

    let safeContext;

    try {
      safeContext =
        validateEnvironmentalContext(environmentalContext);
    } catch (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError.message,
      });
    }

    const conversation = getConversation(conversationId);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found.',
      });
    }

    const messages = [
      ...conversation.messages,
      {
        role: 'user',
        content: message.trim(),
      },
    ];

    console.log(
      '[AI] Sending conversation and environmental context to Groq...'
    );

    const reply = await generateGroqResponse(
      messages,
      safeContext
    );

    saveMessage(
      conversation.conversationId,
      'user',
      message.trim()
    );

    saveMessage(
      conversation.conversationId,
      'assistant',
      reply
    );

    console.log('[AI] Groq response received');

    return res.status(200).json({
      success: true,
      conversationId: conversation.conversationId,
      reply,
    });

  } catch (error) {
    console.error('[AI] Groq request failed:', error.message);

    return res.status(502).json({
      success: false,
      message: 'The AI assistant is temporarily unavailable. Please try again.',
    });
  }
};
