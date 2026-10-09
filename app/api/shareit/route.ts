import { createHash, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { command } from "@/lib/shareit/store";
import { discoveryNetwork, shareItClientAddress } from "@/lib/shareit/network";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const hash = (value: string) => createHash("sha256").update(value).digest("hex");
const validId = (value: unknown): value is string => typeof value === "string" && /^[a-f0-9-]{36}$/.test(value);

export async function POST(request: NextRequest) {
  try {
    const origin = request.headers.get("origin");
    if (origin && new URL(origin).host !== request.headers.get("host")) return NextResponse.json({ error: "Invalid origin." }, { status: 403 });
    const raw = await request.text();
    if (raw.length > 24000) return NextResponse.json({ error: "Request too large." }, { status: 413 });
    const body = JSON.parse(raw);
    if (!validId(body.id) || !validId(body.token)) return NextResponse.json({ error: "Invalid device credentials." }, { status: 400 });
    const room = typeof body.room === "string" ? body.room.trim().toLowerCase() : "";
    if (room && !/^[a-z0-9-]{8,64}$/.test(room)) return NextResponse.json({ error: "Room codes need 8–64 letters, numbers or hyphens." }, { status: 400 });
    const ip = process.env.VERCEL ? shareItClientAddress(request.headers).address : process.env.NODE_ENV === "development" ? "local-development" : undefined;
    const network = ip === "local-development" ? ip : ip ? discoveryNetwork(ip) : null;
    if (!room && !network) return NextResponse.json({ error: "Automatic discovery is unavailable here. Use a private room code." }, { status: 400 });
    const scope = hash(room ? `room:${room}` : `network:${network}`);
    const key = `shareit:device:${body.id}`;
    const credentials = JSON.stringify({ token: hash(body.token), scope });
    let existing = await command(["GET", key]);
    if (!existing && body.action === "join") {
      const created = await command(["SET", key, credentials, "EX", 600, "NX"]);
      existing = created ? credentials : await command(["GET", key]);
    }
    if (typeof existing !== "string" || existing.length !== credentials.length || !timingSafeEqual(Buffer.from(existing), Buffer.from(credentials))) {
      return NextResponse.json({ error: "Session expired. Rejoin discovery." }, { status: 403 });
    }
    const peersKey = `shareit:peers:${scope}`;
    const queueKey = `shareit:queue:${body.id}`;
    if (body.action === "leave") {
      await command(["HDEL", peersKey, body.id]);
      await command(["DEL", key, queueKey]);
      return NextResponse.json({ ok: true });
    }
    if (body.action === "signal") {
      if (!validId(body.to) || body.to === body.id || !["offer", "answer", "candidate", "reject", "cancel"].includes(body.signal?.type)) {
        return NextResponse.json({ error: "Invalid signal." }, { status: 400 });
      }
      const targetRaw = await command(["GET", `shareit:device:${body.to}`]);
      if (!targetRaw || JSON.parse(targetRaw).scope !== scope) return NextResponse.json({ error: "Device is no longer available." }, { status: 404 });
      const targetQueue = `shareit:queue:${body.to}`;
      if (await command(["LLEN", targetQueue]) >= 100) return NextResponse.json({ error: "Receiver is busy." }, { status: 429 });
      await command(["RPUSH", targetQueue, JSON.stringify({ from: body.id, signal: body.signal })]);
      await command(["EXPIRE", targetQueue, 90]);
      return NextResponse.json({ ok: true });
    }
    if (!["join", "poll"].includes(body.action)) return NextResponse.json({ error: "Invalid action." }, { status: 400 });
    const name = typeof body.name === "string" ? body.name.trim().slice(0, 40) : "Device";
    const heartbeat = body.action === "join" || body.heartbeat === true;
    if (heartbeat) {
      await command(["EXPIRE", key, 600]);
      await command(["HSET", peersKey, body.id, JSON.stringify({ id: body.id, name: name || "Device", seen: Date.now() })]);
      await command(["EXPIRE", peersKey, 660]);
    }
    const entries: string[] = await command(["HGETALL", peersKey]);
    const peers = [];
    for (let i = 0; i < entries.length; i += 2) {
      const peer = JSON.parse(entries[i + 1]);
      if (Date.now() - peer.seen > 600000) {
        if (heartbeat) await command(["HDEL", peersKey, entries[i]]);
      }
      else if (peer.id !== body.id) peers.push({ id: peer.id, name: peer.name });
    }
    const messages: string[] = await command(["LPOP", queueKey, 50]) ?? [];
    return NextResponse.json({ peers, messages: messages.map(value => JSON.parse(value)) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof SyntaxError ? "Invalid request." : error instanceof Error ? error.message : "Discovery unavailable." }, { status: error instanceof SyntaxError ? 400 : 503 });
  }
}
