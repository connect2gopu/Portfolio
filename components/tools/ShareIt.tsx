"use client";

import { useEffect, useRef, useState } from "react";
import { ShareItInvite } from "./ShareItInvite";
import { ManualShareIt } from "./ManualShareIt";
import { createDeviceId } from "@/lib/shareit/device-id";

type Peer = { id: string; name: string };
type FileInfo = { name: string; size: number; type: string };
type Signal = { type: "offer" | "answer" | "candidate" | "reject" | "cancel"; description?: RTCSessionDescriptionInit; candidate?: RTCIceCandidateInit; files?: FileInfo[] };
type Incoming = { from: string; files: FileInfo[] };
type Download = { name: string; url: string; size: number };
const LIMIT = 200 * 1024 * 1024;
const size = (bytes: number) => bytes < 1024 ? `${bytes} B` : bytes < 1048576 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1048576).toFixed(1)} MB`;
const button = "rounded-xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground disabled:opacity-40 hover:opacity-90 transition";
const secondary = "rounded-xl border px-4 py-2 text-sm hover:bg-secondary disabled:opacity-40";

export function ShareIt({ initialRoom = "", initialMode = "code" }: { initialRoom?: string; initialMode?: "manual" | "automatic" | "code" }) {
  const [mode, setMode] = useState(initialMode);
  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("mode", mode);
    if (mode !== "automatic") url.searchParams.delete("room");
    window.history.replaceState(window.history.state, "", url.toString());
  }, [mode]);
  return <>
    <div className="container mx-auto max-w-5xl px-4 pt-10 pb-6"><div className="flex flex-wrap gap-3" aria-label="Pairing method"><button aria-pressed={mode === "code"} className={mode === "code" ? button : secondary} onClick={() => setMode("code")}>Four-digit pairing</button><button aria-pressed={mode === "manual"} className={mode === "manual" ? button : secondary} onClick={() => setMode("manual")}>Manual QR pairing</button><button aria-pressed={mode === "automatic"} className={mode === "automatic" ? button : secondary} onClick={() => setMode("automatic")}>Automatic discovery</button></div></div>
    {mode === "automatic" ? <AutomaticShareIt initialRoom={initialRoom} /> : <ManualShareIt key={mode} pairingMode={mode} />}
  </>;
}

function AutomaticShareIt({ initialRoom = "" }: { initialRoom?: string }) {
  const [name, setName] = useState("My device");
  const nameRef = useRef(name);
  nameRef.current = name;
  const [roomInput, setRoomInput] = useState(initialRoom);
  const [room, setRoom] = useState(initialRoom);
  const [generation, setGeneration] = useState(0);
  const [peers, setPeers] = useState<Peer[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [online, setOnline] = useState(false);
  const [busy, setBusy] = useState(false);
  const [incoming, setIncoming] = useState<Incoming | null>(null);
  const [status, setStatus] = useState("Joining discovery…");
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  const [downloads, setDownloads] = useState<Download[]>([]);
  const urls = useRef<string[]>([]);
  const actions = useRef<{ send: (peer: Peer, files: File[]) => Promise<void>; accept: () => Promise<void>; cancel: () => void } | null>(null);

  useEffect(() => () => { urls.current.forEach(url => URL.revokeObjectURL(url)); }, []);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (room) url.searchParams.set("room", room);
    else url.searchParams.delete("room");
    window.history.replaceState(window.history.state, "", url.toString());
  }, [room]);

  const createRoom = () => {
    try {
      const code = createDeviceId();
      setRoomInput(code);
      setRoom(code);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not create a room.");
    }
  };

  useEffect(() => {
    if (typeof window.RTCPeerConnection !== "function") {
      setStatus("File sharing is unavailable in this browser");
      setError("This browser does not support WebRTC file sharing. Open the same link in a current Chrome, Safari, Firefox, or Edge browser instead of an in-app browser.");
      return;
    }
    let id: string;
    let token: string;
    try {
      id = createDeviceId();
      token = createDeviceId();
    } catch (cause) {
      setStatus("File sharing is unavailable in this browser");
      setError(cause instanceof Error ? cause.message : "Could not create a device session.");
      return;
    }
    if (nameRef.current === "My device") {
      const platform = /Android/i.test(navigator.userAgent) ? "Android" : /iPhone|iPad/i.test(navigator.userAgent) ? "iPhone / iPad" : /Mac/i.test(navigator.userAgent) ? "Mac" : /Windows/i.test(navigator.userAgent) ? "Windows" : "Device";
      setName(`${platform} ${id.slice(0, 4)}`);
      nameRef.current = `${platform} ${id.slice(0, 4)}`;
    }
    let disposed = false;
    let joined = false;
    let pc: RTCPeerConnection | null = null;
    let channel: RTCDataChannel | null = null;
    let remote: string | null = null;
    let pending: Incoming | null = null;
    let candidates: RTCIceCandidateInit[] = [];
    let localCandidates: RTCIceCandidateInit[] = [];
    let offerSent = false;
    let outgoing: File[] = [];
    let manifest: FileInfo[] = [];
    let index = 0;
    let parts: ArrayBuffer[] = [];
    let fileBytes = 0;
    let totalBytes = 0;
    let expectedTotal = 0;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    let lastActivity = Date.now();
    const api = async (action: string, extra = {}) => {
      const response = await fetch("/api/shareit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, id, token, room, name: nameRef.current, ...extra }), signal: AbortSignal.timeout(12000) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Discovery failed.");
      return data;
    };
    const signal = async (to: string, payload: Signal) => { await api("signal", { to, signal: payload }); };
    const reset = (message: string) => {
      if (timeout) clearTimeout(timeout);
      timeout = undefined;
      remote = null;
      pending = null;
      candidates = [];
      localCandidates = [];
      offerSent = false;
      outgoing = [];
      manifest = [];
      parts = [];
      channel?.close();
      channel = null;
      pc?.close();
      pc = null;
      if (!disposed) { setBusy(false); setIncoming(null); setStatus(message); }
    };
    const fail = (cause: unknown) => {
      const target = remote;
      if (target) void signal(target, { type: "cancel" }).catch(() => {});
      reset("Ready to share");
      if (!disposed) setError(cause instanceof Error ? cause.message : "Transfer failed.");
    };
    const armTimeout = () => {
      lastActivity = Date.now();
      timeout = setTimeout(() => fail(new Error("Connection timed out. Keep both devices on the same Wi-Fi and check that the router allows devices to communicate.")), 60000);
    };
    const attach = (dc: RTCDataChannel) => {
      channel = dc;
      dc.binaryType = "arraybuffer";
      dc.onclose = () => { if (channel === dc && remote) fail(new Error("The connection closed before the transfer finished.")); };
      dc.onerror = () => { if (channel === dc) fail(new Error("The file connection failed.")); };
      dc.onmessage = (event: MessageEvent) => {
        try {
          lastActivity = Date.now();
          if (typeof event.data === "string") {
            const message = JSON.parse(event.data);
            if (message.type === "complete" && outgoing.length) {
              setProgress(100);
              reset("Files delivered successfully");
              return;
            }
            if (message.type !== "end" || outgoing.length || index >= manifest.length) throw new Error("Invalid transfer message.");
            const info = manifest[index];
            if (fileBytes !== info.size) throw new Error("The received file is incomplete.");
            const url = URL.createObjectURL(new Blob(parts, { type: "application/octet-stream" }));
            urls.current.push(url);
            setDownloads(previous => [...previous, { name: info.name, size: info.size, url }]);
            parts = []; fileBytes = 0; index++;
            if (index === manifest.length) {
              dc.send(JSON.stringify({ type: "complete" }));
              remote = null; // The sender closes after receiving this acknowledgement.
              if (timeout) clearTimeout(timeout);
              setProgress(100); setBusy(false); setStatus("Files received — save them below");
            }
          } else {
            if (outgoing.length || index >= manifest.length || !(event.data instanceof ArrayBuffer)) throw new Error("Unexpected file data.");
            fileBytes += event.data.byteLength;
            totalBytes += event.data.byteLength;
            if (fileBytes > manifest[index].size || totalBytes > LIMIT) throw new Error("File exceeds its advertised size.");
            parts.push(event.data);
            setProgress(expectedTotal ? Math.round(totalBytes / expectedTotal * 100) : 100);
          }
        } catch (cause) { fail(cause); }
      };
      dc.onopen = () => {
        if (timeout) clearTimeout(timeout);
        timeout = undefined;
        lastActivity = Date.now();
        if (!outgoing.length) { setStatus("Receiving files…"); return; }
        setStatus("Sending files…");
        void (async () => {
          let sent = 0;
          for (const file of outgoing) {
            for (let offset = 0; offset < file.size; offset += 16384) {
              while (dc.bufferedAmount > 262144) {
                if (disposed || channel !== dc || dc.readyState !== "open") throw new Error("Transfer cancelled.");
                await new Promise(resolve => setTimeout(resolve, 20));
              }
              const chunk = await file.slice(offset, offset + 16384).arrayBuffer();
              if (disposed || channel !== dc || dc.readyState !== "open") throw new Error("Transfer cancelled.");
              dc.send(chunk); sent += chunk.byteLength; lastActivity = Date.now();
              setProgress(expectedTotal ? Math.round(sent / expectedTotal * 100) : 100);
            }
            dc.send(JSON.stringify({ type: "end" }));
          }
          setStatus("Waiting for delivery confirmation…");
        })().catch(cause => { if (channel === dc) fail(cause); });
      };
    };
    const createConnection = (to: string) => {
      // No STUN/TURN: collect local candidates and never relay file bytes.
      const connection = new RTCPeerConnection({ iceServers: [] });
      pc = connection;
      connection.onicecandidate = event => {
        if (!event.candidate || pc !== connection) return;
        const candidate = event.candidate.toJSON();
        // Publish the offer first so a receiver never drops early ICE candidates.
        if (outgoing.length && !offerSent) localCandidates.push(candidate);
        else void signal(to, { type: "candidate", candidate }).catch(fail);
      };
      connection.onconnectionstatechange = () => { if (pc === connection && connection.connectionState === "failed") fail(new Error("Could not connect directly. Check Wi-Fi client isolation or try another browser.")); };
      connection.ondatachannel = event => attach(event.channel);
      return connection;
    };
    const flushCandidates = async (connection: RTCPeerConnection) => {
      for (const candidate of candidates) await connection.addIceCandidate(candidate);
      candidates = [];
    };
    const handle = async ({ from, signal: payload }: { from: string; signal: Signal }) => {
      if (payload.type === "offer") {
        if (remote) { await signal(from, { type: "reject" }); return; }
        if (!payload.description || payload.description.type !== "offer" || !Array.isArray(payload.files) || !payload.files.length || payload.files.length > 100) return;
        if (payload.files.some(file => typeof file.name !== "string" || file.name.length > 255 || typeof file.type !== "string" || !Number.isSafeInteger(file.size) || file.size < 0)) return;
        const total = payload.files.reduce((sum, file) => sum + file.size, 0);
        if (total > LIMIT) { await signal(from, { type: "reject" }); return; }
        remote = from; manifest = payload.files; expectedTotal = total; index = 0; totalBytes = 0; fileBytes = 0; parts = [];
        pending = { from, files: manifest };
        setError(""); setBusy(true); setIncoming(pending); setProgress(0); setStatus("Incoming files — waiting for your approval");
        armTimeout();
        await createConnection(from).setRemoteDescription(payload.description);
        return;
      }
      if (from !== remote || !pc) return;
      if (payload.type === "candidate" && payload.candidate) {
        if (pc.remoteDescription) await pc.addIceCandidate(payload.candidate);
        else candidates.push(payload.candidate);
      } else if (payload.type === "answer" && payload.description && outgoing.length) {
        await pc.setRemoteDescription(payload.description); await flushCandidates(pc);
        setStatus("Connecting directly…");
      } else if (payload.type === "reject" || payload.type === "cancel") reset(payload.type === "reject" ? "Receiver declined or is busy" : "Transfer cancelled by the other device");
    };
    actions.current = {
      send: async (peer, selected) => {
        if (remote || !joined || !selected.length) return;
        try {
          reset("Connecting…"); remote = peer.id; outgoing = selected; expectedTotal = selected.reduce((sum, file) => sum + file.size, 0);
          setBusy(true); setProgress(0); setError(""); setStatus(`Waiting for ${peer.name} to accept…`);
          armTimeout();
          const connection = createConnection(peer.id);
          attach(connection.createDataChannel("files", { ordered: true }));
          await connection.setLocalDescription(await connection.createOffer());
          await signal(peer.id, { type: "offer", description: connection.localDescription!.toJSON(), files: selected.map(file => ({ name: file.name, size: file.size, type: file.type })) });
          offerSent = true;
          for (const candidate of localCandidates) await signal(peer.id, { type: "candidate", candidate });
          localCandidates = [];
        } catch (cause) { fail(cause); }
      },
      accept: async () => {
        if (!pc || !pending || !remote) return;
        try {
          setIncoming(null); pending = null; setStatus("Connecting directly…");
          await pc.setLocalDescription(await pc.createAnswer());
          await signal(remote, { type: "answer", description: pc.localDescription!.toJSON() });
        } catch (cause) { fail(cause); }
      },
      cancel: () => {
        const to = remote;
        if (to) void signal(to, { type: pending ? "reject" : "cancel" }).catch(() => {});
        reset("Transfer cancelled");
      },
    };
    setOnline(false); setPeers([]); setError(""); setStatus("Joining discovery…");
    let timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      try {
        const data = await api(joined ? "poll" : "join");
        if (disposed) { await api("leave").catch(() => {}); return; }
        if (!joined) setError("");
        joined = true; setOnline(true); setPeers(data.peers);
        if (!remote) setStatus(previous => previous === "Joining discovery…" ? "Ready to share" : previous);
        for (const message of data.messages) {
          if (!disposed) { try { await handle(message); } catch (cause) { fail(cause); } }
        }
        if (remote && channel?.readyState === "open" && Date.now() - lastActivity > 60000) fail(new Error("Transfer stalled. Please try again."));
      } catch (cause) {
        if (!disposed) { joined = false; setOnline(false); setPeers([]); setError(cause instanceof Error ? cause.message : "Discovery disconnected."); }
      } finally { if (!disposed) timer = setTimeout(poll, 2500); }
    };
    void poll();
    return () => {
      disposed = true; clearTimeout(timer); reset(""); actions.current = null;
      void fetch("/api/shareit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "leave", id, token, room }), keepalive: true }).catch(() => {});
    };
  }, [room, generation]);

  const total = files.reduce((sum, file) => sum + file.size, 0);
  return (
    <div className="container mx-auto max-w-5xl px-4 py-12 sm:py-20">
      <div className="mb-10">
        <span className="text-sm font-semibold uppercase tracking-widest text-primary">Device to device</span>
        <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">ShareIt</h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">Open this page on both devices, choose your files, and pick a receiver. Keep both tabs open and connected to the same Wi-Fi.</p>
      </div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card p-5">
        <div className="flex items-center gap-3"><span className={`h-3 w-3 rounded-full ${online ? "bg-green-500" : "bg-amber-500"}`} /><p role="status" aria-live="polite" className="text-sm">{status}</p></div>
        <span className="text-xs text-muted-foreground">{room ? `Room: ${room}` : "Automatic network discovery"}</span>
      </div>
      {error && <p role="alert" className="mb-6 rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm">{error}</p>}
      <ShareItInvite room={room} busy={busy} onCreateRoom={createRoom} />
      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-2xl border bg-card p-6">
          <h2 className="text-lg font-semibold">Your device</h2>
          <label htmlFor="device-name" className="mb-2 mt-5 block text-sm">Name visible to other devices</label>
          <input id="device-name" maxLength={40} value={name} onChange={event => setName(event.target.value)} className="w-full rounded-xl border bg-background px-4 py-3" />
          <label htmlFor="share-files" className="mb-2 mt-6 block text-sm">Files to share</label>
          <input id="share-files" type="file" multiple disabled={busy} onChange={event => {
            const selected = Array.from(event.target.files ?? []);
            if (selected.length > 100 || selected.reduce((sum, file) => sum + file.size, 0) > LIMIT) { setError("Select up to 100 files, with a combined size of 200 MB or less."); event.target.value = ""; setFiles([]); }
            else { setFiles(selected); setError(""); }
          }} className="w-full rounded-xl border border-dashed p-5 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-secondary file:px-3 file:py-2 file:text-foreground" />
          <p className="mt-2 text-xs text-muted-foreground">Up to 200 MB per transfer. Received files use browser memory.</p>
          {!!files.length && <ul className="mt-4 max-h-40 space-y-2 overflow-auto">{files.map((file, i) => <li key={i} className="flex justify-between gap-3 text-sm"><span className="truncate">{file.name}</span><span className="shrink-0 text-muted-foreground">{size(file.size)}</span></li>)}</ul>}
          {!!files.length && <p className="mt-4 text-sm font-medium">{files.length} file{files.length !== 1 ? "s" : ""} · {size(total)}</p>}
        </section>
        <section className="rounded-2xl border bg-card p-6">
          <h2 className="text-lg font-semibold">Available devices <span className="text-muted-foreground">({peers.length})</span></h2>
          <p className="mt-2 text-sm text-muted-foreground">Choose a device to send your selected files. It can send files back from this same page.</p>
          {!peers.length && <div className="my-8 rounded-xl bg-secondary p-6 text-center text-sm text-muted-foreground">Waiting for another device…<br /><span className="mt-2 block">Open /tools/shareit on your other device.</span></div>}
          <ul className="mt-5 space-y-3">{peers.map(peer => <li key={peer.id} className="flex items-center justify-between gap-3 rounded-xl border p-4"><div className="min-w-0"><p className="truncate font-medium">{peer.name}</p><p className="text-xs text-muted-foreground">Device {peer.id.slice(0, 8)}</p></div><button className={button} disabled={!online || busy || !files.length} onClick={() => void actions.current?.send(peer, files)}>Send</button></li>)}</ul>
          {busy && <div className="mt-6"><progress aria-label="File transfer progress" value={progress} max={100} className="h-3 w-full accent-primary" /><div className="mt-2 flex items-center justify-between"><span className="text-sm">{progress}%</span><button className={secondary} onClick={() => actions.current?.cancel()}>Cancel transfer</button></div></div>}
        </section>
      </div>
      {incoming && <section role="dialog" aria-modal="false" aria-labelledby="incoming-title" className="mt-6 rounded-2xl border border-primary bg-primary/5 p-6"><h2 id="incoming-title" className="text-lg font-semibold">{peers.find(peer => peer.id === incoming.from)?.name || "Another device"} wants to send files</h2><ul className="my-4 max-h-40 overflow-auto text-sm">{incoming.files.map((file, i) => <li key={i}>{file.name} · {size(file.size)}</li>)}</ul><div className="flex gap-3"><button className={button} onClick={() => void actions.current?.accept()}>Accept files</button><button className={secondary} onClick={() => actions.current?.cancel()}>Decline</button></div></section>}
      {!!downloads.length && <section className="mt-6 rounded-2xl border bg-card p-6"><h2 className="text-lg font-semibold">Received files</h2><p className="mt-2 text-sm text-muted-foreground">Save these files before leaving or refreshing this page.</p><ul className="mt-4 space-y-3">{downloads.map((file, i) => <li key={file.url} className="flex items-center justify-between gap-4"><span className="min-w-0 truncate text-sm">{file.name} <span className="text-muted-foreground">· {size(file.size)}</span></span><a className={secondary} href={file.url} download={file.name}>Save file {i + 1}</a></li>)}</ul></section>}
      <details className="mt-6 rounded-2xl border p-6"><summary className="cursor-pointer font-medium">Can’t see your other device? Use a private room</summary><p className="my-4 text-sm text-muted-foreground">Automatic discovery groups visitors by their shared public IP; VPNs, IPv6, and some networks can separate devices. Enter the same private room code on both devices. A room helps you find each other; a direct network connection is still required.</p><form onSubmit={event => { event.preventDefault(); setRoom(roomInput.trim().toLowerCase()); setGeneration(value => value + 1); }} className="flex flex-wrap gap-3"><input aria-label="Private room code" value={roomInput} onChange={event => setRoomInput(event.target.value)} pattern="[a-zA-Z0-9\-]{8,64}" minLength={8} maxLength={64} placeholder="e.g. a random private code" disabled={busy} className="min-w-0 flex-1 rounded-xl border bg-background px-4 py-3" /><button className={button} disabled={busy}>Join room</button><button className={secondary} type="button" disabled={busy} onClick={createRoom}>Create room</button><button className={secondary} type="button" disabled={busy} onClick={() => { setRoomInput(""); setRoom(""); setGeneration(value => value + 1); }}>Automatic discovery</button></form></details>
      <p className="mt-6 text-sm text-muted-foreground">Files travel through an encrypted direct connection and are never uploaded to this site’s server. Discovery requires access to the site. Guest Wi-Fi or router isolation may block transfers. Only accept files from a device you recognize.</p>
    </div>
  );
}
