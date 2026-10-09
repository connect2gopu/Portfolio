// STUN discovers reachable addresses; it does not relay file contents.
export function shareItRtcConfiguration(): RTCConfiguration {
  const urls = (process.env.NEXT_PUBLIC_SHAREIT_STUN_URLS ?? "stun:stun.l.google.com:19302")
    .split(",").map(url => url.trim()).filter(Boolean);
  return { iceServers: urls.length ? [{ urls }] : [] };
}
