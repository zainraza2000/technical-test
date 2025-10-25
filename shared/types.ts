export interface City {
  name: string;
  latitude: number;
  longitude: number;
}

export interface WeatherJobPayload {
  cities: City[];
  source: 'manual' | 'scheduled';
  jobHistoryId?: number;
}

export interface WeatherData {
  city: string;
  temperature: number;
  windSpeed: number;
  lastUpdated: Date;
}

export interface OpenMeteoResponse {
  current_weather: {
    temperature: number;
    windspeed: number;
    time: string;
  };
}

export interface DatabaseWeatherRecord {
  id?: number;
  city: string;
  temperature: number;
  wind_speed: number;
  last_updated: Date;
}

export interface JobHistoryRecord {
  id: number;
  timestamp: Date;
  source: 'manual' | 'scheduled';
  status: 'successful' | 'failed' | 'in-progress';
}