import { Pool } from 'pg';
import { createClient } from 'redis';
import axios from 'axios';
import { WeatherJobPayload, City, OpenMeteoResponse } from '../../shared/types';

class WeatherWorker {
  private db: Pool;
  private redis: any;
  private isRunning = false;

  constructor() {
    this.db = new Pool({
      connectionString: process.env.DATABASE_URL,
    });

    this.redis = createClient({
      url: process.env.REDIS_URL,
    });

    this.redis.on('error', (err: Error) => {
      console.error('Redis Client Error:', err);
    });
  }

  async start() {
    try {
      await this.redis.connect();
      console.log('Connected to Redis');

      await this.initDatabase();
      console.log('Database initialized');

      this.isRunning = true;
      console.log('Weather worker started');

      await this.processJobs();
    } catch (error) {
      process.exit(1);
    }
  }

  private async initDatabase() {
    const client = await this.db.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS weather_data (
          id SERIAL PRIMARY KEY,
          city VARCHAR(100) UNIQUE NOT NULL,
          temperature DECIMAL(5,2) NOT NULL,
          wind_speed DECIMAL(5,2) NOT NULL,
          last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);
      await client.query(`
        CREATE TABLE IF NOT EXISTS job_history (
          id SERIAL PRIMARY KEY,
          timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          source VARCHAR(20) NOT NULL CHECK (source IN ('manual', 'scheduled')),
          status VARCHAR(20) NOT NULL CHECK (status IN ('successful', 'failed', 'in-progress')) DEFAULT 'in-progress'
        );
      `);
    } finally {
      client.release();
    }
  }

  private async processJobs() {
    while (this.isRunning) {
      try {
        const jobData = await this.redis.brPop('weather-jobs', 5); // Block for 5 seconds
        
        if (jobData) {
          const payload: WeatherJobPayload = JSON.parse(jobData.element);
          await this.processWeatherJob(payload);
        }
      } catch (error) {
        console.error('Error processing job:', error);
      }
    }
  }

  private async processWeatherJob(payload: WeatherJobPayload) {
    const { cities, source, jobHistoryId } = payload;
    
    console.log(`Processing weather data for ${cities.length} cities (source: ${source})`);

    const cityResults = await Promise.all(
      cities.map(async (city) => {
        try {
          const weatherData = await this.fetchWeatherData(city);
          await this.saveWeatherData(city.name, weatherData);
          console.log(`Successfully processed weather for ${city.name}`);
          return { success: true, cityName: city.name };
        } catch (error) {
          console.error(`Failed to process weather for ${city.name}:`, error);
          return { success: false, cityName: city.name };
        }
      })
    );

    const successCount = cityResults.filter(r => r.success).length;
    const status = successCount > 0 ? 'successful' : 'failed';

    if(jobHistoryId) {
      await this.updateJobHistory(jobHistoryId, status);
    } else {
      await this.saveJobsHistory(payload, status);
    }
  }

  private async fetchWeatherData(city: City): Promise<{ temperature: number; windSpeed: number }> {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${city.latitude}&longitude=${city.longitude}&current_weather=true`;
    
    try {
      const response = await axios.get<OpenMeteoResponse>(url, {
        timeout: 10000
      });

      const { current_weather } = response.data;
      
      return {
        temperature: current_weather.temperature,
        windSpeed: current_weather.windspeed
      };
    } catch (error) {
      console.error(`API request failed for ${city.name}:`, error);
      throw new Error(`Failed to fetch weather data for ${city.name}`);
    }
  }

  private async saveWeatherData(cityName: string, weatherData: { temperature: number; windSpeed: number }) {
    const client = await this.db.connect();
    try {
      await client.query(`
        INSERT INTO weather_data (city, temperature, wind_speed, last_updated)
        VALUES ($1, $2, $3, NOW())
        ON CONFLICT (city)
        DO UPDATE SET
          temperature = EXCLUDED.temperature,
          wind_speed = EXCLUDED.wind_speed,
          last_updated = EXCLUDED.last_updated
      `, [cityName, weatherData.temperature, weatherData.windSpeed]);
    } finally {
      client.release();
    }
  }

  private async saveJobsHistory(payload: WeatherJobPayload, status: 'successful' | 'failed' | 'in-progress') {
    const client = await this.db.connect();
    try {
      await client.query(`
        INSERT INTO job_history (source, status)
        VALUES ($1, $2)
      `, [payload.source, status]);
    } finally {
      client.release();
    }
  }

  private async updateJobHistory(jobHistoryId: number, status: 'successful' | 'failed' | 'in-progress') {
    const client = await this.db.connect();
    try {
      await client.query(`
        UPDATE job_history SET status = $1 WHERE id = $2
      `, [status, jobHistoryId]);
    } finally {
      client.release();
    }
  }

  async stop() {
    this.isRunning = false;
    await this.redis.disconnect();
    await this.db.end();
    console.log('Weather worker stopped');
  }
}

process.on('SIGINT', async () => {
  await worker.stop();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await worker.stop();
  process.exit(0);
});

const worker = new WeatherWorker();
worker.start().catch((error) => {
  process.exit(1);
});
