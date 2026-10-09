import { networkInterfaces } from "node:os";
import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { discoveryNetwork, shareItClientAddress } from "@/lib/shareit/network";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const development = !process.env.VERCEL && process.env.NODE_ENV === "development";
  const client = shareItClientAddress(request.headers);
  const address = process.env.VERCEL || development ? client.address ?? (development ? request.ip ?? null : null) : null;
  const network = development ? "local-development" : address ? discoveryNetwork(address) : null;
  const group = network ? createHash("sha256").update(`network:${network}`).digest("hex").slice(0, 12) : null;
  // A cloud server's network interfaces are not the visitor's LAN addresses.
  const local = !process.env.VERCEL && (process.env.NODE_ENV === "development" || process.env.SHAREIT_ALLOW_LAN_LINKS === "true");
  const addresses = local ? Array.from(new Set(Object.values(networkInterfaces()).flatMap(entries =>
    (entries ?? []).filter(entry => !entry.internal && entry.family === "IPv4" &&
      /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(entry.address)).map(entry => entry.address)
  ))) : [];
  return NextResponse.json({ local, addresses, discovery: { address, network, group, source: development ? "local" : "vercel", ipSource: client.ipSource, proxyAddress: client.proxyAddress, warning: client.warning } }, { headers: { "Cache-Control": "no-store" } });
}
