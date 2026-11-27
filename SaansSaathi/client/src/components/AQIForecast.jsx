
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';

const formatTime = (time) => {
  if (!time) return '';

  return time.split('T')[1];
};

const getAqiCategory = (aqi) => {
  if (aqi === null || aqi === undefined) {
    return 'Unavailable';
  }

  if (aqi <= 50) return 'Good';
  if (aqi <= 100) return 'Moderate';
  if (aqi <= 150) return 'Unhealthy for Sensitive Groups';
  if (aqi <= 200) return 'Unhealthy';
  if (aqi <= 300) return 'Very Unhealthy';

  return 'Hazardous';
};

const AQIForecast = ({
  forecast,
  loading = false,
  error = '',
}) => {
  if (loading) {
    return (
      <section className="forecast-card">
        <h2>24-Hour AQI Forecast</h2>
        <p>Loading air-quality forecast...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="forecast-card">
        <h2>24-Hour AQI Forecast</h2>
        <p>{error}</p>
      </section>
    );
  }

  const readings = forecast?.forecast || [];

  if (readings.length === 0) {
    return (
      <section className="forecast-card">
        <h2>24-Hour AQI Forecast</h2>
        <p>Forecast data is currently unavailable.</p>
      </section>
    );
  }

  const chartData = readings.map((reading) => ({
    ...reading,
    displayTime: formatTime(reading.time),
  }));

  const validAqi = readings
    .map((reading) => reading.us_aqi)
    .filter(Number.isFinite);

  const currentForecastAqi = validAqi[0];

  const minimumAqi = validAqi.length
    ? Math.min(...validAqi)
    : 0;

  const maximumAqi = validAqi.length
    ? Math.max(...validAqi)
    : 100;

  return (
    <section className="forecast-card">
      <div className="forecast-header">
        <div>
          <h2>24-Hour AQI Forecast</h2>
          <p>Expected air-quality changes throughout the day</p>
        </div>
      </div>

      <div className="forecast-summary">
        <div>
          <span>Starting forecast AQI</span>
          <h3>
            {Number.isFinite(currentForecastAqi)
              ? Math.round(currentForecastAqi)
              : 'N/A'}
          </h3>
          <p>{getAqiCategory(currentForecastAqi)}</p>
        </div>

        <div>
          <span>Forecast range</span>
          <h3>
            {validAqi.length
              ? `${Math.round(minimumAqi)} - ${Math.round(maximumAqi)}`
              : 'N/A'}
          </h3>
          <p>US AQI</p>
        </div>
      </div>

      <div className="forecast-chart">
        <ResponsiveContainer width="100%" height={280}>
          <LineChart
            data={chartData}
            margin={{
              top: 15,
              right: 20,
              left: 0,
              bottom: 5,
            }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
            />

            <XAxis
              dataKey="displayTime"
              tick={{ fontSize: 11 }}
              interval="preserveStartEnd"
              minTickGap={25}
            />

            <YAxis
              domain={[
                (dataMin) => Math.max(0, Math.floor(dataMin - 10)),
                (dataMax) => Math.ceil(dataMax + 10),
              ]}
              tick={{ fontSize: 11 }}
              width={40}
              label={{
                value: 'US AQI',
                angle: -90,
                position: 'insideLeft',
                style: { fontSize: 11 },
              }}
            />

            <Tooltip
              labelFormatter={(label) => `Time: ${label}`}
              formatter={(value) => [
                value === null ? 'Unavailable' : `${value} US AQI`,
                'Forecast AQI',
              ]}
            />

            <ReferenceLine
              y={50}
              stroke="#d6a33b"
              strokeDasharray="5 5"
              label={{
                value: 'Good limit',
                position: 'insideTopRight',
                fontSize: 10,
              }}
            />

            <Line
              type="monotone"
              dataKey="us_aqi"
              name="US AQI"
              stroke="#39785d"
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 5 }}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <p className="forecast-disclaimer">
        Forecasts are model-based estimates and may differ
        from actual air-quality conditions.
      </p>
    </section>
  );
};

export default AQIForecast;
