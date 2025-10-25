import { NextApiRequest, NextApiResponse } from 'next';
import { getJobHistory } from '@/lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
    const jobHistory = await getJobHistory(limit);
    
    res.status(200).json({ jobHistory });
  } catch (error) {
    console.error('Error fetching job history:', error);
    res.status(500).json({ error: 'Failed to fetch job history' });
  }
}
