import { createHmac } from "node:crypto";

// Only issue short-lived credentials after the discovery session is validated.
export function shareItTurnServers(deviceId: string): RTCIceServer[] {
  const urls = (process.env.SHAREIT_TURN_URLS ?? "").split(",").map(url => url.trim()).filter(Boolean);
  const secret = process.env.SHAREIT_TURN_SECRET;
  if (!urls.length && !secret) return [];
  if (!urls.length || !secret || urls.some(url => !/^turns?:[^\s]+$/i.test(url))) {
    throw new Error("TURN configuration is incomplete. Set SHAREIT_TURN_URLS and SHAREIT_TURN_SECRET for a TURN REST-compatible server, then redeploy.");
  }
  const username = `${Math.floor(Date.now() / 1000) + 3600}:${deviceId}`;
  const credential = createHmac("sha1", secret).update(username).digest("base64");
  return [{ urls, username, credential }];
}
