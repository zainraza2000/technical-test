import { NextApiRequest, NextApiResponse } from 'next';
import { getAllWeatherData, getLastSyncTime } from '@/lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const [weatherData, lastSyncTime] = await Promise.all([
      getAllWeatherData(),
      getLastSyncTime()
    ]);

    res.status(200).json({
      weatherData,
      lastSyncTime
    });
  } catch (error) {
    console.error('Error fetching weather data:', error);
    res.status(500).json({ error: 'Failed to fetch weather data' });
  }
}
