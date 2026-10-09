import { isIP } from "node:net";

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
