import { createClient } from 'redis';
import { WeatherJobPayload } from '@/shared/types';

let redis: any = null;
let isConnected = false;

async function getRedisClient() {
  if (!redis) {
    redis = createClient({
      url: process.env.REDIS_URL,
    });

    redis.on('error', (err: Error) => console.error('Redis Error', err));
  }

  if (!isConnected) {
    await redis.connect();
    isConnected = true;
    console.log('Connected to Redis');
  }

  return redis;
}

export async function enqueueWeatherJob(payload: WeatherJobPayload): Promise<void> {
  const client = await getRedisClient();
  await client.lPush('weather-jobs', JSON.stringify(payload));
  console.log('Weather job enqueued:', payload);
}
