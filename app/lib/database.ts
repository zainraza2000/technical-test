import { Pool } from 'pg';
import { DatabaseWeatherRecord, JobHistoryRecord } from '@/shared/types';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function initDatabase() {
  const client = await pool.connect();
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
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  } finally {
    client.release();
  }
}

export async function upsertWeatherData(data: DatabaseWeatherRecord): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(`
      INSERT INTO weather_data (city, temperature, wind_speed, last_updated)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (city)
      DO UPDATE SET
        temperature = EXCLUDED.temperature,
        wind_speed = EXCLUDED.wind_speed,
        last_updated = EXCLUDED.last_updated
    `, [data.city, data.temperature, data.wind_speed, data.last_updated]);
  } catch (error) {
    console.error('Error upserting weather data:', error);
    throw error;
  } finally {
    client.release();
  }
}

export async function getAllWeatherData(): Promise<DatabaseWeatherRecord[]> {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT city, temperature, wind_speed, last_updated
      FROM weather_data
      ORDER BY last_updated DESC
    `);
    return result.rows;
  } catch (error) {
    console.error('Error fetching weather data:', error);
    throw error;
  } finally {
    client.release();
  }
}

export async function getLastSyncTime(): Promise<Date | null> {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT MAX(last_updated) as last_sync
      FROM weather_data
    `);
    return result.rows[0]?.last_sync || null;
  } catch (error) {
    console.error('Error fetching last sync time:', error);
    throw error;
  } finally {
    client.release();
  }
}

export async function insertJobHistory(source: 'manual' | 'scheduled', status: 'successful' | 'failed' | 'in-progress' = 'in-progress'): Promise<JobHistoryRecord> {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      INSERT INTO job_history (source, status)
      VALUES ($1, $2)
      RETURNING id, timestamp, source, status
    `, [source, status]);
    return result.rows[0];
  } catch (error) {
    console.error('Error inserting job history:', error);
    throw error;
  } finally {
    client.release();
  }
}

export async function getJobHistory(limit: number = 100): Promise<JobHistoryRecord[]> {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT id, timestamp, source, status
      FROM job_history
      ORDER BY timestamp DESC
      LIMIT $1
    `, [limit]);
    return result.rows;
  } catch (error) {
    console.error('Error fetching job history:', error);
    throw error;
  } finally {
    client.release();
  }
}
