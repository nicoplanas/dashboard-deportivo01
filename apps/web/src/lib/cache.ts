// Cache neutra: si no hay REDIS_URL o el paquete 'redis' no está instalado,
// cae a "no cache" y todo compila/funciona.
let client: any = null;

async function getRedisClient() {
  if (client !== null) return client;           // memoize
  const url = process.env.REDIS_URL;
  if (!url) { client = false; return client; }  // sin redis
  try {
    // import dinámico: evita error en build si no está instalado
    const { createClient } = await import('redis');
    const c = createClient({ url });
    await c.connect();
    client = c;
  } catch (_e) {
    client = false; // sin redis
  }
  return client;
}

export async function cache<T>(
  key: string,
  ttlSec: number,
  fetcher: () => Promise<T>
): Promise<T> {
  const redis = await getRedisClient();
  if (redis) {
    const hit = await redis.get(key);
    if (hit) return JSON.parse(hit) as T;
  }
  const data = await fetcher();
  if (redis) await redis.setEx(key, ttlSec, JSON.stringify(data));
  return data;
}
