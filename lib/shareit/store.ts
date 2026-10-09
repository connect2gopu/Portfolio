// Redis REST keeps signaling shared between serverless instances. The memory
// fallback is deliberately restricted to a single local development process.
type Entry = { value: unknown; expires: number };
const globalStore = globalThis as typeof globalThis & { shareitStore?: Map<string, Entry> };
const memory = globalStore.shareitStore ??= new Map<string, Entry>();

export async function command(args: (string | number)[]): Promise<any> {
  // Use complete pairs so tokens from different databases are never mixed.
  const custom = process.env.SHAREIT_REDIS_REST_URL || process.env.SHAREIT_REDIS_REST_TOKEN;
  const url = custom ? process.env.SHAREIT_REDIS_REST_URL : process.env.UPSTASH_REDIS_REST_URL;
  const token = custom ? process.env.SHAREIT_REDIS_REST_TOKEN : process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) {
    const response = await fetch(url, {
      method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(args), cache: "no-store", signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error("Discovery service unavailable.");
    const result = await response.json();
    if (result.error) throw new Error("Discovery service unavailable.");
    return result.result;
  }
  if (process.env.NODE_ENV === "production" || process.env.VERCEL) {
    throw new Error("Device discovery is not configured. Add SHAREIT_REDIS_REST_URL and SHAREIT_REDIS_REST_TOKEN (or UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN) in your hosting project's environment variables, then redeploy.");
  }
  const now = Date.now();
  for (const [key, entry] of memory) if (entry.expires < now) memory.delete(key);
  const [operation, rawKey, ...rest] = args;
  const key = String(rawKey);
  const entry = memory.get(key);
  switch (operation) {
    case "INCR": {
      const value = Number(entry?.value ?? 0) + 1;
      memory.set(key, { value, expires: entry?.expires ?? now + 180000 });
      return value;
    }
    case "GET": return entry?.value ?? null;
    case "SET": {
      if (rest.includes("NX") && entry) return null;
      const ex = rest.indexOf("EX");
      memory.set(key, { value: rest[0], expires: now + (ex >= 0 ? Number(rest[ex + 1]) * 1000 : 90000) });
      return "OK";
    }
    case "HSET": {
      const values = (entry?.value ?? {}) as Record<string, string>;
      values[String(rest[0])] = String(rest[1]);
      memory.set(key, { value: values, expires: now + 90000 });
      return 1;
    }
    case "HGETALL": return Object.entries((entry?.value ?? {}) as object).flat();
    case "HDEL": if (entry) delete (entry.value as Record<string, string>)[String(rest[0])]; return 1;
    case "EXPIRE": if (entry) entry.expires = now + Number(rest[0]) * 1000; return 1;
    case "RPUSH": {
      const values = (entry?.value ?? []) as string[];
      values.push(String(rest[0]));
      memory.set(key, { value: values, expires: now + 90000 }); return values.length;
    }
    case "LLEN": return (entry?.value as string[] | undefined)?.length ?? 0;
    case "LPOP": return (entry?.value as string[] | undefined)?.splice(0, Number(rest[0])) ?? [];
    case "DEL": return memory.delete(key) ? 1 : 0;
    default: throw new Error("Unsupported store operation.");
  }
}
