import { createClient } from 'redis';
import { WeatherJobPayload } from '../../shared/types';
import { STANDARD_CITIES } from '../../shared/constants';

class WeatherProducer {
  private redis: any;
  private intervalId: NodeJS.Timeout | null = null;

  constructor() {
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

      console.log('Weather producer started - scheduling jobs every 60 seconds');

      this.intervalId = setInterval(() => {
        this.scheduleWeatherJob();
      }, 60000);

      await this.scheduleWeatherJob();

    } catch (error) {
      console.error('Failed to start producer:', error);
      process.exit(1);
    }
  }

  private async scheduleWeatherJob() {
    try {
      const payload: WeatherJobPayload = {
        cities: STANDARD_CITIES,
        source: 'scheduled',
      };

      await this.redis.lPush('weather-jobs', JSON.stringify(payload));
      console.log(`Scheduled weather job at ${new Date().toISOString()}`);
    } catch (error) {
      console.error('Failed to schedule weather job:', error);
    }
  }

  async stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    await this.redis.disconnect();
    console.log('Weather producer stopped');
  }
}

process.on('SIGINT', async () => {
  console.log('Received SIGINT, shutting down gracefully...');
  await producer.stop();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  await producer.stop();
  process.exit(0);
});

const producer = new WeatherProducer();
producer.start().catch((error) => {
  console.error('Producer failed to start:', error);
  process.exit(1);
});
