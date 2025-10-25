import { useState, useEffect } from 'react';
import Link from 'next/link';

interface WeatherData {
  city: string;
  temperature: number;
  wind_speed: number;
  last_updated: string;
}

interface WeatherResponse {
  weatherData: WeatherData[];
  lastSyncTime: string | null;
}

export default function WeatherPage() {
  const [weatherData, setWeatherData] = useState<WeatherData[]>([]);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchWeatherData();
    const interval = setInterval(fetchWeatherData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchWeatherData = async () => {
    try {
      const response = await fetch('/api/weather');
      const data: WeatherResponse = await response.json();
      
      if (response.ok) {
        setWeatherData(data.weatherData);
        setLastSyncTime(data.lastSyncTime);
        setError(null);
      } else {
        setError('Failed to fetch weather data');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="text-xl">Loading weather data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Weather Data</h1>
        <Link 
          href="/"
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Back to Dashboard
        </Link>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="mb-6">
        <button
          onClick={fetchWeatherData}
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
        >
          Refresh Data
        </button>
      </div>

      <div className="overflow-x-auto mb-8">
        <table className="min-w-full bg-white border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-4 py-2 text-left">City</th>
              <th className="px-4 py-2 text-left">Temperature (°C)</th>
              <th className="px-4 py-2 text-left">Wind Speed (km/h)</th>
              <th className="px-4 py-2 text-left">Last Updated</th>
            </tr>
          </thead>
          <tbody>
            {weatherData.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                  No weather data available. Try fetching weather from the dashboard.
                </td>
              </tr>
            ) : (
              weatherData.map((weather, index) => (
                <tr key={`${weather.city}-${weather.last_updated}`} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium">{weather.city}</td>
                  <td className="px-4 py-2">{weather.temperature}</td>
                  <td className="px-4 py-2">{weather.wind_speed}</td>
                  <td className="px-4 py-2">
                    {new Date(weather.last_updated).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {lastSyncTime && (
        <div className="text-sm text-gray-600">
          Last sync at: {new Date(lastSyncTime).toLocaleString()}
        </div>
      )}
    </div>
  );
}
