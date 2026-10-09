// Redis REST keeps signaling shared between serverless instances. The memory
// fallback is deliberately restricted to a single local development process.
type Entry = { value: unknown; expires: number };
const globalStore = globalThis as typeof globalThis & { shareitStore?: Map<string, Entry> };
const memory = globalStore.shareitStore ??= new Map<string, Entry>();

export async function command(args: (string | number)[]): Promise<any> {
  // Use complete pairs so tokens from different databases are never mixed.
  const standardUrl = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const standardToken = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  const standard = standardUrl || standardToken;
  const url = standard ? standardUrl : process.env.SHAREIT_REDIS_REST_URL?.trim();
  const token = standard ? standardToken : process.env.SHAREIT_REDIS_REST_TOKEN?.trim();
  if ((url || token) && !(url && token)) {
    throw new Error("Upstash configuration is incomplete. Set both UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN from the same database, then redeploy.");
  }
  if (url && token) {
    try { if (new URL(url).protocol !== "https:") throw new Error(); }
    catch { throw new Error("UPSTASH_REDIS_REST_URL must be the HTTPS REST endpoint from Upstash, not a redis:// connection string."); }
    const response = await fetch(url, {
      method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(args), cache: "no-store", signal: AbortSignal.timeout(8000),
    });
    if (response.status === 401 || response.status === 403) throw new Error("Upstash authentication failed. Check the REST token and use a read/write token from the same database as the REST URL.");
    if (!response.ok) throw new Error("Upstash pairing service is temporarily unavailable. Please try again.");
    const result = await response.json();
    if (result.error) throw new Error("Upstash could not complete the pairing request. Check that the REST token allows both reads and writes.");
    return result.result;
  }
  if (process.env.NODE_ENV === "production" || process.env.VERCEL) {
    throw new Error("Pairing is not configured. Add UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in Vercel → Settings → Environment Variables, then redeploy.");
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
