import { deflateSync, inflateSync, strFromU8, strToU8 } from "fflate";
import { createDeviceId } from "./device-id";

export type PairingCode = { v: 1; session: string; type: "offer" | "answer"; sdp: string; name: string };
export type FileInfo = { name: string; size: number };
export const TRANSFER_LIMIT = 200 * 1024 * 1024;
export function encodePairing(code: PairingCode): string {
  const bytes = deflateSync(strToU8(JSON.stringify(code)));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
export function decodePairing(input: string): PairingCode {
  try {
    let encoded = input.trim();
    if (/^https?:\/\//i.test(encoded)) encoded = new URLSearchParams(new URL(encoded).hash.slice(1)).get("pair") ?? "";
    if (!/^[a-zA-Z0-9_-]{1,12000}$/.test(encoded)) throw new Error();
    const bytes = Uint8Array.from(atob(encoded.replace(/-/g, "+").replace(/_/g, "/")), char => char.charCodeAt(0));
    const value = JSON.parse(strFromU8(inflateSync(bytes, { out: new Uint8Array(32768) })));
    if (value.v !== 1 || !/^[a-f0-9-]{36}$/.test(value.session) || !["offer", "answer"].includes(value.type) || typeof value.sdp !== "string" || !value.sdp.startsWith("v=0") || value.sdp.length > 24000 || typeof value.name !== "string" || value.name.length > 40) throw new Error();
    return value;
  } catch { throw new Error("Invalid pairing code. Scan a ShareIt pairing QR or paste its complete code or link."); }
}

async function gather(connection: RTCPeerConnection): Promise<void> {
  if (connection.iceGatheringState === "complete") return;
  await new Promise<void>((resolve, reject) => {
    const finish = (error?: Error) => {
      clearTimeout(timer);
      connection.removeEventListener("icegatheringstatechange", check);
      connection.removeEventListener("connectionstatechange", check);
      error ? reject(error) : resolve();
    };
    const check = () => {
      if (connection.connectionState === "closed") finish(new Error("Pairing cancelled."));
      else if (connection.iceGatheringState === "complete") finish();
    };
    const timer = setTimeout(() => finish(new Error("Could not gather connection details. Try creating a new pairing QR.")), 15000);
    connection.addEventListener("icegatheringstatechange", check);
    connection.addEventListener("connectionstatechange", check);
    check();
  });
}

type Callbacks = {
  status: (status: string) => void;
  connected: (connected: boolean) => void;
  incoming: (files: FileInfo[] | null) => void;
  busy: (busy: boolean) => void;
  progress: (progress: number) => void;
  file: (name: string, blob: Blob) => void;
  error: (message: string) => void;
};
type Receive = { id: string; files: FileInfo[]; accepted: boolean; index: number; parts: ArrayBuffer[]; fileBytes: number; totalBytes: number; total: number };
export class ManualPeer {
  private pc: RTCPeerConnection | null = null;
  private channel: RTCDataChannel | null = null;
  private session = "";
  private sendId = "";
  private outgoing: File[] = [];
  private receiving: Receive | null = null;
  private timer?: ReturnType<typeof setTimeout>;
  private pairingTimer?: ReturnType<typeof setTimeout>;
  constructor(private callbacks: Callbacks) {}
  private touch() {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.cancel("Transfer timed out. Please try again."), 60000);
  }
  private sendMessage(value: object) {
    if (this.channel?.readyState !== "open") throw new Error("Pair the devices before sending files.");
    this.channel.send(JSON.stringify(value));
  }
  private finish(message: string) {
    clearTimeout(this.timer); this.sendId = ""; this.outgoing = []; this.receiving = null;
    this.callbacks.busy(false); this.callbacks.incoming(null); this.callbacks.status(message);
  }
  cancel(message = "Transfer cancelled") {
    const id = this.sendId || this.receiving?.id;
    if (id && this.channel?.readyState === "open") this.sendMessage({ type: "cancel", id });
    this.finish(message);
  }
  close() {
    clearTimeout(this.pairingTimer); clearTimeout(this.timer);
    const channel = this.channel; this.channel = null;
    const pc = this.pc; this.pc = null;
    channel?.close(); pc?.close(); this.session = "";
    this.finish("Ready to pair"); this.callbacks.connected(false);
  }
  private connection() {
    if (typeof RTCPeerConnection !== "function") throw new Error("This browser does not support WebRTC. Open ShareIt in Chrome, Safari, Firefox, or Edge.");
    const pc = new RTCPeerConnection({ iceServers: [] });
    this.pc = pc;
    pc.ondatachannel = event => { if (this.pc === pc) this.attach(event.channel); };
    pc.onconnectionstatechange = () => {
      if (this.pc !== pc) return;
      if (pc.connectionState === "failed") { this.close(); this.callbacks.error("Could not connect directly. Keep both devices on the same Wi-Fi and check router client isolation."); }
    };
    this.pairingTimer = setTimeout(() => { if (this.pc === pc && this.channel?.readyState !== "open") { this.close(); this.callbacks.error("Pairing expired. Start a new pairing and try again."); } }, 180000);
    return pc;
  }
  async offer(name: string): Promise<PairingCode> {
    this.close(); this.session = createDeviceId();
    const pc = this.connection();
    this.callbacks.status("Creating pairing QR…");
    this.attach(pc.createDataChannel("shareit-manual", { ordered: true }));
    await pc.setLocalDescription(await pc.createOffer()); await gather(pc);
    if (this.pc !== pc) throw new Error("Pairing cancelled.");
    this.callbacks.status("Waiting for the receiver’s response QR");
    return { v: 1, session: this.session, type: "offer", sdp: pc.localDescription!.sdp, name: name.slice(0, 40) };
  }
  async import(code: PairingCode, name: string): Promise<PairingCode | null> {
    if (code.type === "answer") {
      if (!this.pc || this.session !== code.session || this.pc.localDescription?.type !== "offer" || this.pc.remoteDescription) throw new Error("This response belongs to a different or expired pairing. Create a new pairing QR and scan its matching response.");
      await this.pc.setRemoteDescription({ type: "answer", sdp: code.sdp });
      this.callbacks.status("Connecting directly…"); return null;
    }
    this.close(); this.session = code.session;
    const pc = this.connection(); this.callbacks.status("Creating response QR…");
    await pc.setRemoteDescription({ type: "offer", sdp: code.sdp });
    await pc.setLocalDescription(await pc.createAnswer()); await gather(pc);
    if (this.pc !== pc) throw new Error("Pairing cancelled.");
    this.callbacks.status("Show the response QR to the sender");
    return { v: 1, session: this.session, type: "answer", sdp: pc.localDescription!.sdp, name: name.slice(0, 40) };
  }
  send(files: File[]) {
    if (this.sendId || this.receiving) throw new Error("Finish the current transfer first.");
    if (!files.length || files.length > 100 || files.reduce((sum, file) => sum + file.size, 0) > TRANSFER_LIMIT) throw new Error("Choose up to 100 files and 200 MB per transfer.");
    const id = createDeviceId();
    this.sendMessage({ type: "files", id, files: files.map(file => ({ name: file.name, size: file.size })) });
    this.sendId = id; this.outgoing = files; this.touch();
    this.callbacks.busy(true); this.callbacks.progress(0); this.callbacks.status("Waiting for the other device to accept…");
  }
  accept() {
    if (!this.receiving) return;
    this.receiving.accepted = true; this.sendMessage({ type: "accept", id: this.receiving.id });
    this.callbacks.incoming(null); this.callbacks.status("Receiving files…"); this.touch();
  }
  private async sendBytes(dc: RTCDataChannel, id: string) {
    const files = this.outgoing; const total = files.reduce((sum, file) => sum + file.size, 0); let sent = 0;
    this.callbacks.status("Sending files…");
    for (const file of files) {
      for (let offset = 0; offset < file.size; offset += 16384) {
        while (dc.bufferedAmount > 262144) {
          if (this.sendId !== id || dc.readyState !== "open") return;
          await new Promise(resolve => setTimeout(resolve, 20));
        }
        const bytes = await file.slice(offset, offset + 16384).arrayBuffer();
        if (this.sendId !== id || dc.readyState !== "open") return;
        dc.send(bytes); sent += bytes.byteLength; this.touch(); this.callbacks.progress(total ? Math.round(sent / total * 100) : 100);
      }
      if (this.sendId !== id) return;
      this.sendMessage({ type: "end", id });
    }
    this.callbacks.status("Waiting for delivery confirmation…");
  }
  private attach(dc: RTCDataChannel) {
    this.channel = dc; dc.binaryType = "arraybuffer";
    dc.onopen = () => { if (this.channel === dc) { clearTimeout(this.pairingTimer); this.callbacks.connected(true); this.callbacks.status("Connected — either device can send files"); } };
    dc.onclose = () => { if (this.channel === dc) { this.close(); this.callbacks.error("The connection ended. Pair again to continue."); } };
    dc.onerror = () => { if (this.channel === dc) { this.close(); this.callbacks.error("The connection ended. Pair again to continue."); } };
    dc.onmessage = event => {
      if (this.channel !== dc) return;
      try {
        if (typeof event.data !== "string") {
          const receive = this.receiving;
          if (!receive) return; // Discard in-flight chunks after cancellation.
          if (!receive.accepted || !(event.data instanceof ArrayBuffer) || receive.index >= receive.files.length) throw new Error("Unexpected file data.");
          receive.fileBytes += event.data.byteLength; receive.totalBytes += event.data.byteLength;
          if (receive.fileBytes > receive.files[receive.index].size || receive.totalBytes > TRANSFER_LIMIT) throw new Error("The file exceeds its advertised size.");
          receive.parts.push(event.data); this.touch(); this.callbacks.progress(receive.total ? Math.round(receive.totalBytes / receive.total * 100) : 100); return;
        }
        if (event.data.length > 40000) throw new Error("Invalid transfer message.");
        const message = JSON.parse(event.data);
        if (typeof message.id !== "string" || message.id.length > 40) throw new Error("Invalid transfer ID.");
        if (message.type === "files") {
          if (this.sendId || this.receiving) { this.sendMessage({ type: "cancel", id: message.id }); return; }
          const files: FileInfo[] = message.files;
          if (!Array.isArray(files) || !files.length || files.length > 100 || files.some(file => typeof file.name !== "string" || file.name.length > 255 || !Number.isSafeInteger(file.size) || file.size < 0)) throw new Error("Invalid file list.");
          const total = files.reduce((sum, file) => sum + file.size, 0);
          if (total > TRANSFER_LIMIT) throw new Error("Incoming files exceed 200 MB.");
          this.receiving = { id: message.id, files, total, totalBytes: 0, fileBytes: 0, index: 0, parts: [], accepted: false };
          this.callbacks.incoming(files); this.callbacks.busy(true); this.callbacks.progress(0); this.callbacks.status("Incoming files — waiting for your approval"); this.touch();
        } else if (message.type === "accept" && message.id === this.sendId) {
          // A duplicate acceptance cannot start a second file stream.
          if (this.outgoing.length) { const sending = this.sendBytes(dc, message.id); this.outgoing = []; void sending.catch(error => { if (this.sendId === message.id) { this.cancel(); this.callbacks.error(error.message); } }); }
        } else if (message.type === "end" && message.id === this.receiving?.id) {
          const receive = this.receiving;
          if (!receive) return;
          const file = receive.files[receive.index];
          if (!receive.accepted || !file || receive.fileBytes !== file.size) throw new Error("The received file is incomplete.");
          this.callbacks.file(file.name, new Blob(receive.parts, { type: "application/octet-stream" }));
          receive.parts = []; receive.fileBytes = 0; receive.index++;
          if (receive.index === receive.files.length) { this.sendMessage({ type: "complete", id: receive.id }); this.callbacks.progress(100); this.finish("Files received — save them below"); }
        } else if (message.type === "complete" && message.id === this.sendId) { this.callbacks.progress(100); this.finish("Files delivered successfully"); }
        else if (message.type === "cancel" && (message.id === this.sendId || message.id === this.receiving?.id)) this.finish("Transfer declined or cancelled by the other device");
      } catch (error) { this.cancel(); this.callbacks.error(error instanceof Error ? error.message : "Transfer failed."); }
    };
  }
}
