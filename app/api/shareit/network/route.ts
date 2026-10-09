import { networkInterfaces } from "node:os";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  // A cloud server's network interfaces are not the visitor's LAN addresses.
  const local = !process.env.VERCEL && (process.env.NODE_ENV === "development" || process.env.SHAREIT_ALLOW_LAN_LINKS === "true");
  const addresses = local ? Array.from(new Set(Object.values(networkInterfaces()).flatMap(entries =>
    (entries ?? []).filter(entry => !entry.internal && entry.family === "IPv4" &&
      /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(entry.address)).map(entry => entry.address)
  ))) : [];
  return NextResponse.json({ local, addresses }, { headers: { "Cache-Control": "no-store" } });
}
