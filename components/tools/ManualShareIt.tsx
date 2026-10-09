"use client";

import { useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { ManualPeer, decodePairing, encodePairing, TRANSFER_LIMIT, type FileInfo, type PairingCode } from "@/lib/shareit/manual-pairing";
import { createDeviceId } from "@/lib/shareit/device-id";
import { PairingScanner } from "./PairingScanner";

const button = "rounded-xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground disabled:opacity-40";
const secondary = "rounded-xl border px-4 py-2 text-sm hover:bg-secondary disabled:opacity-40";
const size = (bytes: number) => bytes < 1024 ? `${bytes} B` : bytes < 1048576 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1048576).toFixed(1)} MB`;
type Download = { name: string; url: string; size: number };

type CodeSession = { code: string; token: string };
async function codeApi(action: string, token: string, extra: object = {}) {
  const response = await fetch("/api/shareit/pair", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, token, ...extra }), signal: AbortSignal.timeout(12000) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Pairing failed.");
  return data;
}
function releaseCode(session: CodeSession) { void codeApi("close", session.token, { code: session.code }).catch(() => {}); }

export function ManualShareIt({ pairingMode = "manual" }: { pairingMode?: "manual" | "code" }) {
  const codeMode = pairingMode === "code";
  const codeSession = useRef<CodeSession | null>(null);
  const pollTimer = useRef<ReturnType<typeof setTimeout>>();
  const operation = useRef(0);
  const [pairingCode, setPairingCode] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [expiresAt, setExpiresAt] = useState(0);
  const [now, setNow] = useState(0);
  const peer = useRef<ManualPeer | null>(null);
  const [name, setName] = useState("My device");
  const nameRef = useRef(name); nameRef.current = name;
  const [peerName, setPeerName] = useState("Other device");
  const [status, setStatus] = useState("Ready to pair");
  const [error, setError] = useState("");
  const [connected, setConnected] = useState(false);
  const [busy, setBusy] = useState(false);
  const [pairBusy, setPairBusy] = useState(false);
  const [output, setOutput] = useState<PairingCode | null>(null);
  const [input, setInput] = useState("");
  const [origins, setOrigins] = useState<string[]>([]);
  const [origin, setOrigin] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [incoming, setIncoming] = useState<FileInfo[] | null>(null);
  const [progress, setProgress] = useState(0);
  const [downloads, setDownloads] = useState<Download[]>([]);
  const urls = useRef<string[]>([]);
  const [copied, setCopied] = useState(false);
  const codeInput = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    let live = true;
    const operations = operation;
    const client = new ManualPeer({
      status: value => { if (live) {
        setStatus(codeMode ? value.replace("Creating pairing QR…", "Creating pairing code…").replace("Waiting for the receiver’s response QR", "Waiting for the other device to enter your code…").replace("Creating response QR…", "Preparing connection…").replace("Show the response QR to the sender", "Connecting directly…") : value);
        if (value === "Ready to pair") { setOutput(null); setPairingCode(""); setExpiresAt(0); clearTimeout(pollTimer.current); if (codeSession.current) releaseCode(codeSession.current); codeSession.current = null; }
      } },
      connected: value => { if (live) { setConnected(value); if (value) { setOutput(null); setError(""); setPairingCode(""); setExpiresAt(0); clearTimeout(pollTimer.current); if (codeSession.current) releaseCode(codeSession.current); codeSession.current = null; } } },
      busy: value => { if (live) setBusy(value); }, incoming: value => { if (live) setIncoming(value); },
      progress: value => { if (live) setProgress(value); }, error: value => { if (live) setError(value); },
      file: (fileName, blob) => { if (live) { const url = URL.createObjectURL(blob); urls.current.push(url); setDownloads(previous => [...previous, { name: fileName, size: blob.size, url }]); } },
    });
    peer.current = client;
    const consumeHash = async () => {
      const encoded = new URLSearchParams(window.location.hash.slice(1)).get("pair");
      if (!encoded) return;
      try {
        const code = decodePairing(encoded);
        // Answers must be imported in the original tab which holds the offer.
        setPairBusy(true);
        const response = await client.import(code, nameRef.current);
        if (live) { setOutput(response); setPeerName(code.name || "Other device"); setError(""); window.history.replaceState(window.history.state, "", window.location.pathname + window.location.search); }
      } catch (cause) { if (live) setError(cause instanceof Error ? cause.message : "Pairing failed."); }
      finally { if (live) setPairBusy(false); }
    };
    if (!codeMode) { void consumeHash(); window.addEventListener("hashchange", consumeHash); }
    return () => { live = false; operations.current++; clearTimeout(pollTimer.current); if (codeSession.current) releaseCode(codeSession.current); codeSession.current = null; window.removeEventListener("hashchange", consumeHash); client.close(); if (peer.current === client) peer.current = null; };
  }, [codeMode]);
  useEffect(() => () => { urls.current.forEach(url => URL.revokeObjectURL(url)); }, []);
  useEffect(() => {
    let live = true;
    const current = window.location.origin; setOrigin(current); setOrigins([current]);
    void fetch("/api/shareit/network", { cache: "no-store" }).then(response => response.json()).then((data: { local: boolean; addresses: string[] }) => {
      if (!live || !data.local) return;
      const choices = data.addresses.map(address => { const url = new URL(current); url.hostname = address; return url.origin; });
      const loopback = ["localhost", "127.0.0.1", "[::1]", "0.0.0.0"].includes(window.location.hostname);
      const values = Array.from(new Set(loopback ? choices : [current, ...choices]));
      if (values.length) { setOrigins(values); setOrigin(values[0]); }
    }).catch(() => {});
    return () => { live = false; };
  }, []);

  useEffect(() => {
    if (!expiresAt) return;
    const tick = () => {
      setNow(Date.now());
      if (Date.now() >= expiresAt) { operation.current++; peer.current?.close(); setPairBusy(false); setError("Pairing code expired. Create a new code and try again."); }
    };
    tick(); const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [expiresAt]);
  const createPairingCode = async () => {
    const client = peer.current; if (!client) return;
    const current = ++operation.current;
    setPairBusy(true); setError("");
    try {
      const offer = await client.offer(nameRef.current);
      const token = createDeviceId();
      const result = await codeApi("create", token, { offer });
      const session = { code: result.code as string, token };
      if (operation.current !== current || peer.current !== client) { releaseCode(session); return; }
      codeSession.current = session; setPairingCode(session.code); setExpiresAt(result.expiresAt); setNow(Date.now());
      const poll = async () => {
        if (operation.current !== current || codeSession.current !== session) return;
        try {
          const data = await codeApi("poll", token, { code: session.code });
          if (operation.current !== current || codeSession.current !== session) return;
          if (data.answer) { await client.import(data.answer, nameRef.current); setPeerName(data.answer.name || "Other device"); return; }
          pollTimer.current = setTimeout(poll, document.hidden ? 10000 : 4000);
        } catch (cause) { if (operation.current === current) { client.close(); setError(cause instanceof Error ? cause.message : "Pairing failed."); } }
      };
      void poll();
    } catch (cause) { if (operation.current === current && peer.current === client) { client.close(); setError(cause instanceof Error ? cause.message : "Pairing failed."); } }
    finally { if (operation.current === current && peer.current === client) setPairBusy(false); }
  };
  const joinPairingCode = async () => {
    const client = peer.current; if (!client || !/^\d{4}$/.test(joinCode)) return;
    const current = ++operation.current;
    client.close(); setPairBusy(true); setError("");
    let claimed: CodeSession | null = null;
    try {
      const token = createDeviceId();
      const result = await codeApi("join", token, { code: joinCode });
      const session = { code: joinCode, token }; claimed = session;
      if (operation.current !== current || peer.current !== client) { releaseCode(session); return; }
      const answer = await client.import(result.offer, nameRef.current);
      if (operation.current !== current || peer.current !== client) { releaseCode(session); return; }
      codeSession.current = session; setExpiresAt(result.expiresAt); setNow(Date.now()); setPeerName(result.offer.name || "Other device");
      await codeApi("answer", token, { code: session.code, answer });
      if (operation.current === current && codeSession.current === session) setStatus("Connecting directly…");
    } catch (cause) { if (claimed) releaseCode(claimed); if (operation.current === current && peer.current === client) { client.close(); setError(cause instanceof Error ? cause.message : "Pairing failed."); } }
    finally { if (operation.current === current && peer.current === client) setPairBusy(false); }
  };

  const pairingValue = output ? encodePairing(output) : "";
  // The offer link opens B's page and imports the offer. The response is scanned
  // within A's original tab, so it is a raw code instead of a new-tab URL.
  const qrValue = output?.type === "offer" && origin ? `${origin}/tools/shareit?mode=manual#pair=${pairingValue}` : pairingValue;
  useEffect(() => setCopied(false), [qrValue]);
  const importCode = async (value: string) => {
    if (pairBusy || busy || connected || !peer.current) return;
    const client = peer.current; setPairBusy(true); setError("");
    try {
      const code = decodePairing(value); const response = await client.import(code, nameRef.current);
      if (peer.current === client) { setOutput(response); setPeerName(code.name || "Other device"); setInput(""); }
    } catch (cause) { if (peer.current === client) setError(cause instanceof Error ? cause.message : "Pairing failed."); }
    finally { if (peer.current === client) setPairBusy(false); }
  };
  const create = async () => {
    const client = peer.current; if (!client) return;
    setPairBusy(true); setError(""); setOutput(null);
    try { const code = await client.offer(nameRef.current); if (peer.current === client) setOutput(code); }
    catch (cause) { if (peer.current === client) setError(cause instanceof Error ? cause.message : "Could not create a QR."); }
    finally { if (peer.current === client) setPairBusy(false); }
  };
  const copy = async () => {
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(qrValue);
      else { codeInput.current?.focus(); codeInput.current?.select(); if (!document.execCommand("copy")) throw new Error(); }
      setCopied(true);
    } catch { codeInput.current?.focus(); codeInput.current?.select(); setError("Copy the selected pairing code manually."); }
  };
  return <div className="container mx-auto max-w-5xl px-4 pb-16">
    <h1 className="text-4xl font-bold tracking-tight">ShareIt</h1>
    <p className="mt-4 max-w-3xl text-muted-foreground">{codeMode ? "Create a four-digit code on one device and enter it on the other. Keep both pages open on the same Wi-Fi." : "Pair two devices on the same Wi-Fi using QR codes. No Redis account or discovery service is needed. Keep both pages open."}</p>
    {codeMode ? <ol className="my-6 grid gap-3 text-sm sm:grid-cols-3"><li className="rounded-xl bg-secondary p-4"><strong>1.</strong> Create a pairing code.</li><li className="rounded-xl bg-secondary p-4"><strong>2.</strong> Enter the four digits on the other device.</li><li className="rounded-xl bg-secondary p-4"><strong>3.</strong> Connect and send files in either direction.</li></ol> : <ol className="my-6 grid gap-3 text-sm sm:grid-cols-3">
      <li className="rounded-xl bg-secondary p-4"><strong>1. Device A:</strong> Create a pairing QR.</li>
      <li className="rounded-xl bg-secondary p-4"><strong>2. Device B:</strong> Scan A’s QR. B generates a response QR.</li>
      <li className="rounded-xl bg-secondary p-4"><strong>3. Device A:</strong> Scan B’s response in this original tab. Both devices can then send files.</li>
    </ol>}
    <p role="status" aria-live="polite" className="mb-5 rounded-xl border p-4 text-sm">{status}</p>
    {error && <p role="alert" className="mb-5 rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm">{error}</p>}
    <div className="grid gap-6 md:grid-cols-2">
      <section className="min-w-0 rounded-2xl border bg-card p-6">
        <h2 className="text-lg font-semibold">{connected ? `Paired with ${peerName}` : "Pair your devices"}</h2>
        <label htmlFor="manual-name" className="mb-2 mt-4 block text-sm">Your device name</label>
        <input id="manual-name" value={name} maxLength={40} disabled={pairBusy || connected || !!output || !!pairingCode} onChange={event => setName(event.target.value)} className="w-full rounded-xl border bg-background px-3 py-2" />
        {!connected && (codeMode ? <>
          <button className={`${button} mt-4`} disabled={pairBusy || busy} onClick={() => void createPairingCode()}>Create four-digit code</button>
          <form className="mt-6" onSubmit={event => { event.preventDefault(); void joinPairingCode(); }}>
            <label htmlFor="four-digit-input" className="mb-2 block text-sm">Code from the other device</label>
            <input id="four-digit-input" inputMode="numeric" autoComplete="off" maxLength={4} pattern="[0-9]{4}" value={joinCode} onChange={event => setJoinCode(event.target.value.replace(/\D/g, "").slice(0, 4))} className="w-full rounded-xl border bg-background px-4 py-3 text-xl tracking-widest" placeholder="0000" />
            <button className={`${secondary} mt-3`} disabled={pairBusy || busy || joinCode.length !== 4}>Connect with code</button>
          </form>
        </> : <>
          <button className={`${button} mt-4`} disabled={pairBusy || busy} onClick={() => void create()}>Create pairing QR</button>
          <PairingScanner disabled={pairBusy || busy} onScan={value => void importCode(value)} />
          <form onSubmit={event => { event.preventDefault(); void importCode(input); }} className="mt-5">
            <label htmlFor="manual-input" className="mb-2 block text-sm">Paste a pairing link or response code</label>
            <textarea id="manual-input" value={input} onChange={event => setInput(event.target.value)} maxLength={16000} rows={3} className="w-full rounded-xl border bg-background p-3 text-xs" />
            <button disabled={pairBusy || busy || !input.trim()} className={`${secondary} mt-3`}>Use pairing code</button>
          </form>
        </>)}
        {(connected || output || pairingCode || expiresAt) && <button disabled={pairBusy} className={`${secondary} mt-4`} onClick={() => { operation.current++; peer.current?.close(); setOutput(null); setError(""); setProgress(0); }}>Disconnect / start over</button>}
      </section>
      <section className="min-w-0 rounded-2xl border bg-card p-6">
        {!connected ? codeMode ? <>
          <h2 className="text-lg font-semibold">Your pairing code</h2>
          {pairingCode ? <><p aria-label="Four-digit pairing code" className="my-6 break-all text-center font-mono text-4xl font-bold tracking-[0.2em]">{pairingCode}</p><p className="text-sm text-muted-foreground">Enter these four digits on the other device. This code works once and expires in {Math.max(0, Math.ceil((expiresAt - now) / 1000))} seconds.</p></> : <p className="mt-5 text-sm text-muted-foreground">Create a code here, or enter the code shown on the other device. Connection details are exchanged automatically—no response code is needed.</p>}
        </> : <>
          <h2 className="text-lg font-semibold">{output?.type === "answer" ? "Response QR for device A" : "Pairing QR for device B"}</h2>
          {!output && <p className="mt-5 text-sm text-muted-foreground">Create a QR on A, or scan it on B. A response scan back to A is required because there is no server exchanging connection details.</p>}
          {output && <>
            <p className="mt-3 text-sm text-muted-foreground">{output.type === "offer" ? "B can scan this with its phone camera to open ShareIt, or use Scan QR on this page." : "On A, use Scan QR in the original tab to scan this response, or paste the response code. Keep B’s page open."}</p>
            {output.type === "offer" && origins.length > 1 && <select aria-label="Pairing website address" value={origin} onChange={event => setOrigin(event.target.value)} className="mt-4 w-full rounded-xl border bg-background p-2 text-sm">{origins.map(value => <option key={value} value={value}>{value}</option>)}</select>}
            {qrValue.length <= 2800 ? <div className="mx-auto my-5 w-fit max-w-full rounded-xl bg-white p-3"><QRCodeSVG value={qrValue} size={360} level="L" boostLevel={false} marginSize={4} title={output.type === "offer" ? "Pairing QR" : "Response QR"} style={{ maxWidth: "100%", height: "auto" }} /></div> : <p className="my-5 text-sm">Connection details are too large for one QR. Copy and paste the code below.</p>}
            <label htmlFor="manual-output" className="mb-2 block text-sm">{output.type === "offer" ? "Pairing link" : "Response code"}</label>
            <textarea ref={codeInput} id="manual-output" readOnly value={qrValue} rows={3} onFocus={event => event.target.select()} className="w-full rounded-xl border bg-background p-3 text-xs" />
            <button className={`${secondary} mt-3`} onClick={() => void copy()}>{copied ? "Copied!" : "Copy pairing code"}</button>
          </>}
        </> : <>
          <h2 className="text-lg font-semibold">Send files</h2>
          <label htmlFor="manual-files" className="mb-3 mt-4 block text-sm">Choose files for {peerName}</label>
          <input id="manual-files" type="file" multiple disabled={busy} onChange={event => {
            const selected = Array.from(event.target.files ?? []);
            if (selected.length > 100 || selected.reduce((sum, file) => sum + file.size, 0) > TRANSFER_LIMIT) { setError("Choose up to 100 files and 200 MB per transfer."); event.target.value = ""; setFiles([]); }
            else { setFiles(selected); setError(""); }
          }} className="w-full min-w-0 rounded-xl border p-3 text-sm" />
          <ul className="mt-4 max-h-40 space-y-2 overflow-auto text-sm">{files.map((file, index) => <li key={index} className="break-words">{file.name} · {size(file.size)}</li>)}</ul>
          <p className="mt-3 text-xs text-muted-foreground">Up to 100 files / 200 MB. Received files are held in browser memory.</p>
          <button disabled={busy || !files.length} className={`${button} mt-4`} onClick={() => { try { setError(""); peer.current?.send(files); } catch (cause) { setError(cause instanceof Error ? cause.message : "Transfer failed."); } }}>Send files</button>
          {busy && <div className="mt-5"><progress aria-label="Transfer progress" value={progress} max={100} className="w-full accent-primary" /><p className="text-sm">{progress}%</p><button className={`${secondary} mt-3`} onClick={() => peer.current?.cancel()}>Cancel transfer</button></div>}
        </>}
      </section>
    </div>
    {incoming && <section aria-labelledby="manual-incoming" className="mt-6 rounded-2xl border border-primary p-6"><h2 id="manual-incoming" className="font-semibold">{peerName} wants to send files</h2><ul className="my-4 max-h-40 overflow-auto text-sm">{incoming.map((file, index) => <li key={index}>{file.name} · {size(file.size)}</li>)}</ul><div className="flex gap-3"><button className={button} onClick={() => peer.current?.accept()}>Accept files</button><button className={secondary} onClick={() => peer.current?.cancel("Transfer declined")}>Decline</button></div></section>}
    {!!downloads.length && <section className="mt-6 rounded-2xl border p-6"><h2 className="font-semibold">Received files</h2><p className="mt-2 text-sm text-muted-foreground">Save before closing or refreshing this page.</p><ul className="mt-4 space-y-3">{downloads.map((file, index) => <li key={file.url} className="flex items-center justify-between gap-3"><span className="min-w-0 break-words text-sm">{file.name} · {size(file.size)}</span><a className={`${secondary} shrink-0`} href={file.url} download={file.name}>Save file {index + 1}</a></li>)}</ul></section>}
    <p className="mt-6 text-sm text-muted-foreground">{codeMode ? "Pairing codes expire after three minutes and connect only two devices. Files use a direct encrypted connection. Guest Wi-Fi or router isolation can block it." : "Pairing QR codes contain the connection details, not your files. Files use a direct encrypted connection. Guest Wi-Fi or router isolation can block it. Live camera scanning requires HTTPS; QR image upload and pasted codes also work on local HTTP."}</p>
  </div>;
}
