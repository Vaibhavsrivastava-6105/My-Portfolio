import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Increment the global visitor counter in Redis
    const views = await redis.incr('portfolio_views');
    
    // Return the new view count
    return res.status(200).json({ views });
  } catch (error) {
    console.error('Redis error:', error);
    return res.status(500).json({ error: 'Failed to retrieve visitor count' });
  }
}
