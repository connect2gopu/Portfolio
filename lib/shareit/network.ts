import { BlockList, isIP } from "node:net";

// Public addresses are a discovery hint, not proof of sharing a Wi-Fi network.
// IPv6 hosts on a standard home subnet share /64, including privacy addresses.
export function discoveryNetwork(address: string): string | null {
  const ip = address.trim().toLowerCase();
  const family = isIP(ip);
  if (family === 4) return `ipv4:${ip}`;
  if (family !== 6 || ip.includes("%")) return null;

  // Convert dotted IPv4 tails before expanding compressed IPv6 notation.
  const expandedTail = ip.replace(/(\d+\.\d+\.\d+\.\d+)$/, value => {
    const bytes = value.split(".").map(Number);
    return `${((bytes[0] << 8) | bytes[1]).toString(16)}:${((bytes[2] << 8) | bytes[3]).toString(16)}`;
  });
  const halves = expandedTail.split("::");
  const left = halves[0] ? halves[0].split(":") : [];
  const right = halves[1] ? halves[1].split(":") : [];
  const words = (halves.length === 2
    ? [...left, ...Array(8 - left.length - right.length).fill("0"), ...right]
    : left).map(value => parseInt(value, 16));

  // IPv4-mapped IPv6 must match the corresponding plain IPv4 address.
  if (words.slice(0, 5).every(value => value === 0) && words[5] === 0xffff) {
    return `ipv4:${words[6] >> 8}.${words[6] & 255}.${words[7] >> 8}.${words[7] & 255}`;
  }
  return `ipv6:${words.slice(0, 4).map(value => value.toString(16).padStart(4, "0")).join(":")}/64`;
}

// Cloudflare's published origin proxy ranges, checked 2026-10-09:
// https://www.cloudflare.com/ips-v4 and https://www.cloudflare.com/ips-v6
const cloudflareProxies = new BlockList();
for (const cidr of [
  "173.245.48.0/20", "103.21.244.0/22", "103.22.200.0/22", "103.31.4.0/22",
  "141.101.64.0/18", "108.162.192.0/18", "190.93.240.0/20", "188.114.96.0/20",
  "197.234.240.0/22", "198.41.128.0/17", "162.158.0.0/15", "104.16.0.0/13",
  "104.24.0.0/14", "172.64.0.0/13", "131.0.72.0/22", "2400:cb00::/32",
  "2606:4700::/32", "2803:f800::/32", "2405:b500::/32", "2405:8100::/32",
  "2a06:98c0::/29", "2c0f:f248::/32",
]) {
  const [address, prefix] = cidr.split("/");
  cloudflareProxies.addSubnet(address, Number(prefix), isIP(address) === 6 ? "ipv6" : "ipv4");
}

export function shareItClientAddress(headers: Headers, vercel = Boolean(process.env.VERCEL)) {
  // On Vercel this is the platform-supplied immediate connecting address.
  const proxyAddress = (vercel ? headers.get("x-vercel-forwarded-for") : null)?.split(",")[0]?.trim()
    || headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
  const family = proxyAddress ? isIP(proxyAddress) : 0;
  const fromCloudflare = vercel && family !== 0 && cloudflareProxies.check(proxyAddress!, family === 6 ? "ipv6" : "ipv4");
  if (fromCloudflare) {
    // Never accept this client-controlled header on direct requests to Vercel.
    const visitor = headers.get("cf-connecting-ip")?.trim() ?? "";
    const address = isIP(visitor) && !visitor.includes("%") ? visitor : null;
    return { address, proxyAddress, ipSource: "cloudflare", warning: address ? null : "Cloudflare did not provide a valid visitor IP. Check its visitor IP header settings." };
  }
  return { address: family ? proxyAddress : null, proxyAddress: null, ipSource: vercel ? "vercel" : "local", warning: null };
}
