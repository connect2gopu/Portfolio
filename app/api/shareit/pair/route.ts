import { createHash, randomInt } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { command } from "@/lib/shareit/store";
import type { PairingCode } from "@/lib/shareit/manual-pairing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const TTL = 180;
const hash = (value: string) => createHash("sha256").update(value).digest("hex");
const validPair = (value: PairingCode, type: string) => value && value.v === 1 && value.type === type && typeof value.session === "string" && /^[a-f0-9-]{36}$/.test(value.session) && typeof value.sdp === "string" && value.sdp.startsWith("v=0") && value.sdp.length <= 24000 && typeof value.name === "string" && value.name.length <= 40;
const reply = (data: object, status = 200) => NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(request: NextRequest) {
  try {
    const origin = request.headers.get("origin");
    if (origin && new URL(origin).host !== request.headers.get("host")) return reply({ error: "Invalid origin." }, 403);
    const raw = await request.text();
    if (raw.length > 30000) return reply({ error: "Request too large." }, 413);
    const body = JSON.parse(raw);
    if (!body || typeof body !== "object") return reply({ error: "Invalid request." }, 400);
    if (typeof body.token !== "string" || !/^[a-f0-9-]{36}$/.test(body.token)) return reply({ error: "Invalid session credentials." }, 400);
    if (!["create", "join", "answer", "poll", "close"].includes(body.action)) return reply({ error: "Invalid action." }, 400);
    const token = hash(body.token);
    if (body.action === "create" || body.action === "join") {
      const ip = process.env.VERCEL ? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() : request.headers.get("host");
      const rateKey = `shareit:pair-rate:${hash(ip || "unknown")}:${body.action}:${Math.floor(Date.now() / 180000)}`;
      const attempts = await command(["INCR", rateKey]);
      if (attempts === 1) await command(["EXPIRE", rateKey, TTL]);
      if (attempts > (body.action === "create" ? 10 : 20)) return reply({ error: "Too many pairing attempts. Wait three minutes and try again." }, 429);
    }
    if (body.action === "create") {
      if (!validPair(body.offer, "offer")) return reply({ error: "Invalid connection details." }, 400);
      const expiresAt = Date.now() + TTL * 1000;
      for (let attempt = 0; attempt < 8; attempt++) {
        const code = String(randomInt(10000)).padStart(4, "0");
        if (await command(["SET", `shareit:pair:${code}`, JSON.stringify({ token, offer: body.offer, expiresAt }), "EX", TTL, "NX"])) return reply({ code, expiresAt });
      }
      return reply({ error: "Could not reserve a code. Try again." }, 503);
    }
    if (typeof body.code !== "string" || !/^\d{4}$/.test(body.code)) return reply({ error: "Enter a four-digit pairing code." }, 400);
    const key = `shareit:pair:${body.code}`;
    const stored = await command(["GET", key]);
    if (!stored) return reply({ error: "Code not found or expired. Ask the other device to create a new code." }, 404);
    const record = JSON.parse(stored);
    if (record.expiresAt <= Date.now()) return reply({ error: "Pairing code expired. Create a new code." }, 410);
    const claimKey = `${key}:claim`;
    const answerKey = `${key}:answer`;
    if (body.action === "join") {
      if (token === record.token) return reply({ error: "Enter this code on the other device." }, 400);
      const remaining = Math.max(1, Math.ceil((record.expiresAt - Date.now()) / 1000));
      await command(["SET", claimKey, token, "EX", remaining, "NX"]);
      if (await command(["GET", claimKey]) !== token) return reply({ error: "This code is already being used by another device. Create a new code." }, 409);
      return reply({ offer: record.offer, expiresAt: record.expiresAt });
    }
    if (body.action === "answer") {
      if (await command(["GET", claimKey]) !== token) return reply({ error: "Invalid session credentials." }, 403);
      if (!validPair(body.answer, "answer") || body.answer.session !== record.offer.session) return reply({ error: "Invalid response details." }, 400);
      await command(["SET", answerKey, JSON.stringify(body.answer), "EX", Math.max(1, Math.ceil((record.expiresAt - Date.now()) / 1000)), "NX"]);
      return reply({ ok: true });
    }
    if (body.action === "poll") {
      if (token !== record.token) return reply({ error: "Invalid session credentials." }, 403);
      const answer = await command(["GET", answerKey]);
      return reply({ answer: answer ? JSON.parse(answer) : null, expiresAt: record.expiresAt });
    }
    if (token !== record.token && token !== await command(["GET", claimKey])) return reply({ error: "Invalid session credentials." }, 403);
    await command(["DEL", answerKey]); await command(["DEL", claimKey]); await command(["DEL", key]);
    return reply({ ok: true });
  } catch (error) {
    return reply({ error: error instanceof SyntaxError ? "Invalid request." : error instanceof Error ? error.message : "Pairing unavailable." }, error instanceof SyntaxError ? 400 : 503);
  }
}
