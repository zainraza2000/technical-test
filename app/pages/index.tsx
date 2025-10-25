import { useState, useEffect } from 'react';
import Link from 'next/link';
import { JobHistoryRecord } from '../../shared/types';

export default function Dashboard() {
  const [isLoading, setIsLoading] = useState(false);
  const [jobHistory, setJobHistory] = useState<JobHistoryRecord[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  useEffect(() => {
    fetchJobHistory();
  }, []);

  const fetchJobHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const response = await fetch('/api/job-history');
      const data = await response.json();
      if (response.ok) {
        setJobHistory(data.jobHistory);
      }
    } catch (error) {
      console.error('Error fetching job history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleFetchWeather = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/job', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        await fetchJobHistory();
      }
    } catch (error) {
      console.error('Error enqueuing job:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Weather Dashboard</h1>
      
      <div className="mb-8">
        <button
          onClick={handleFetchWeather}
          disabled={isLoading}
          className="bg-blue-500 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded"
        >
          {isLoading ? 'Fetching...' : 'Fetch Weather Now'}
        </button>
      </div>

      <div className="mb-8">
        <Link 
          href="/weather"
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
        >
          View Weather Data
        </Link>
      </div>

      <div>
        <h2 className="text-2xl font-semibold mb-4">Recent Job History</h2>
        {isLoadingHistory ? (
          <p className="text-gray-500">Loading job history...</p>
        ) : jobHistory.length === 0 ? (
          <p className="text-gray-500">No jobs executed yet. Click "Fetch Weather Now" to start.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-2 text-left">Timestamp</th>
                  <th className="px-4 py-2 text-left">Source</th>
                  <th className="px-4 py-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {jobHistory.map((job) => (
                  <tr key={job.id} className="border-t">
                    <td className="px-4 py-2">
                      {new Date(job.timestamp).toLocaleString()}
                    </td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 rounded text-sm ${
                        job.source === 'manual' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {job.source.charAt(0).toUpperCase() + job.source.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 rounded text-sm ${
                        job.status === 'successful'
                          ? 'bg-green-100 text-green-800'
                          : job.status === 'failed'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {job.status.charAt(0).toUpperCase() + job.status.slice(1).replace('-', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
