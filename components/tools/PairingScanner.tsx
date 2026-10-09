"use client";

import { useEffect, useRef, useState } from "react";
import type QrScanner from "qr-scanner";

type Props = { disabled: boolean; onScan: (value: string) => void };
export function PairingScanner({ disabled, onScan }: Props) {
  const video = useRef<HTMLVideoElement>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState("");
  const onScanRef = useRef(onScan); onScanRef.current = onScan;
  useEffect(() => {
    if (!scanning || disabled) return;
    let stopped = false;
    let scanner: QrScanner | undefined;
    void import("qr-scanner").then(async ({ default: Scanner }) => {
      if (stopped || !video.current) return;
      scanner = new Scanner(video.current, result => {
        if (stopped) return;
        scanner?.stop(); setScanning(false); onScanRef.current(result.data);
      }, { preferredCamera: "environment", highlightScanRegion: true, returnDetailedScanResult: true });
      try { await scanner.start(); }
      catch { if (!stopped) { setScanning(false); setError("Camera access failed. Allow camera permission, or upload a QR image or paste the code."); } }
      if (stopped) scanner.destroy();
    }).catch(() => { if (!stopped) { setScanning(false); setError("Could not start the scanner. Upload a QR image or paste its code instead."); } });
    return () => { stopped = true; scanner?.destroy(); };
  }, [scanning, disabled]);
  const start = () => {
    setError("");
    if (!navigator.mediaDevices?.getUserMedia) { setError("Live camera scanning requires HTTPS or localhost. On an HTTP LAN page, upload a QR photo or paste the code instead."); return; }
    setScanning(true);
  };
  return <div className="mt-4">
    <div className="flex flex-wrap items-center gap-3">
      <button type="button" disabled={disabled} onClick={scanning ? () => setScanning(false) : start} className="rounded-xl border px-4 py-2 text-sm disabled:opacity-40">{scanning ? "Stop scanner" : "Scan QR"}</button>
      <label className="text-sm">Upload QR image<input aria-label="Upload QR image" type="file" accept="image/*" disabled={disabled} className="mt-2 block w-full max-w-60 text-xs" onChange={event => {
        const file = event.target.files?.[0]; event.target.value = "";
        if (!file) return;
        setError(""); setScanning(false);
        void import("qr-scanner").then(({ default: Scanner }) => Scanner.scanImage(file, { returnDetailedScanResult: true, alsoTryWithoutScanRegion: true })).then(result => onScanRef.current(result.data)).catch(() => setError("No readable pairing QR found. Try a sharper image or paste the code."));
      }} /></label>
    </div>
    {scanning && <video ref={video} muted playsInline className="mt-4 max-h-80 w-full rounded-xl bg-black" aria-label="QR camera preview" />}
    {error && <p role="alert" className="mt-3 text-sm text-amber-700 dark:text-amber-400">{error}</p>}
  </div>;
}
