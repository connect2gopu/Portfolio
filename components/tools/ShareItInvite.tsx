"use client";

import { useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";

type Props = { room: string; busy: boolean; onCreateRoom: () => void };

export function ShareItInvite({ room, busy, onCreateRoom }: Props) {
  const [origins, setOrigins] = useState<string[]>([]);
  const [selected, setSelected] = useState("");
  const [local, setLocal] = useState(false);
  const [notice, setNotice] = useState("");
  const [copied, setCopied] = useState(false);
  const linkInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let disposed = false;
    const current = window.location.origin;
    setOrigins([current]);
    setSelected(current);
    void fetch("/api/shareit/network", { cache: "no-store" }).then(async response => {
      if (!response.ok) throw new Error("Network lookup failed");
      const data: { local: boolean; addresses: string[] } = await response.json();
      if (disposed) return;
      setLocal(data.local);
      if (!data.local) return;
      const lanOrigins = data.addresses.map(address => {
        const url = new URL(current);
        url.hostname = address;
        return url.origin;
      });
      const loopback = ["localhost", "127.0.0.1", "[::1]", "0.0.0.0"].includes(window.location.hostname);
      const choices = Array.from(new Set(loopback ? lanOrigins : [current, ...lanOrigins]));
      if (choices.length) { setOrigins(choices); setSelected(choices[0]); }
      else setNotice("No LAN address was found. Connect this computer to Wi-Fi and reload. A localhost link only works on this computer.");
    }).catch(() => {
      if (!disposed) setNotice("Could not detect a LAN address. The current website link is shown below.");
    });
    return () => { disposed = true; };
  }, []);

  const link = selected ? `${selected}/tools/shareit${room ? `?room=${encodeURIComponent(room)}` : ""}` : "";
  useEffect(() => { setCopied(false); }, [link]);

  const copy = async () => {
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(link);
      else {
        linkInput.current?.focus();
        linkInput.current?.select();
        if (!document.execCommand("copy")) throw new Error("Copy unavailable");
      }
      setCopied(true);
      setNotice("");
    }
    catch { setNotice("Copy isn’t available in this browser. Select and copy the link below."); }
  };

  return (
    <section aria-labelledby="invite-title" className="mb-6 rounded-2xl border bg-card p-6">
      <h2 id="invite-title" className="text-lg font-semibold">Connect your other device</h2>
      <p className="mt-2 text-sm text-muted-foreground">Scan this QR code with your phone’s camera or QR scanner, or open the link on your other device.</p>
      <div className="mt-5 flex flex-col items-start gap-6 sm:flex-row">
        {link && <div className="shrink-0 rounded-xl border bg-white p-3"><QRCodeSVG value={link} size={180} level="M" marginSize={4} title="Scan to open ShareIt on your other device" /></div>}
        <div className="w-full min-w-0 flex-1">
          <label htmlFor="invite-address" className="mb-2 block text-sm font-medium">{local ? "Internal IP and port" : "Website address"}</label>
          {origins.length > 1 && <select id="invite-address" value={selected} onChange={event => setSelected(event.target.value)} className="mb-3 w-full rounded-xl border bg-background px-3 py-2">{origins.map(origin => <option key={origin} value={origin}>{origin}</option>)}</select>}
          {origins.length <= 1 && <p id="invite-address" className="mb-3 break-all text-sm text-muted-foreground">{selected || "Finding the website address…"}</p>}
          <label htmlFor="invite-link" className="sr-only">Link to open on the other device</label>
          <input ref={linkInput} id="invite-link" readOnly value={link} onFocus={event => event.target.select()} className="w-full min-w-0 rounded-xl border bg-background px-3 py-3 text-sm" />
          <div className="mt-3 flex flex-wrap gap-3">
            <button disabled={!link} onClick={() => void copy()} className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-40">{copied ? "Copied!" : "Copy link"}</button>
            <a href={link || undefined} target="_blank" rel="noopener noreferrer" className="rounded-xl border px-4 py-2 text-sm hover:bg-secondary">Open link</a>
            {!room && <button disabled={busy} onClick={onCreateRoom} className="rounded-xl border px-4 py-2 text-sm hover:bg-secondary disabled:opacity-40">Create private invite</button>}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">{room ? "This QR code and link join your current private room automatically." : "Create a private invite to put both devices in the same room automatically."}</p>
          {local && <p className="mt-3 text-xs text-muted-foreground">Choose the address of this computer’s Wi-Fi adapter. Keep both devices on the same Wi-Fi and allow this port through the computer’s firewall. Open the link in your device’s browser.</p>}
          {notice && <p role="status" className="mt-3 text-sm text-muted-foreground">{notice}</p>}
        </div>
      </div>
    </section>
  );
}
