import { NextApiRequest, NextApiResponse } from 'next';
import { enqueueWeatherJob } from '../../lib/redis';
import { STANDARD_CITIES } from '../../../shared/constants';
import { insertJobHistory } from 'app/lib/database';
import { JobHistoryRecord } from 'shared/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const jobHistory: JobHistoryRecord = await insertJobHistory('manual', 'in-progress')

  try {
    const payload = {
      cities: STANDARD_CITIES,
      source: 'manual' as const,
      jobHistoryId: jobHistory.id
    };

    await enqueueWeatherJob(payload);
    
    res.status(200).json({ 
      success: true, 
      message: 'Weather job enqueued successfully',
    });
  } catch (error) {
    console.error('Error enqueuing weather job:', error);
    res.status(500).json({ error: 'Failed to enqueue weather job' });
  }
}
