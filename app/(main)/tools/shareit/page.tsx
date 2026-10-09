import type { Metadata } from "next";
import { ShareIt } from "@/components/tools/ShareIt";

export const metadata: Metadata = {
  title: "ShareIt | Share files between devices",
  description: "Send files directly between devices on your Wi-Fi using an encrypted peer connection.",
};

export default function ShareItPage({ searchParams }: { searchParams: { room?: string | string[]; mode?: string | string[] } }) {
  const value = typeof searchParams.room === "string" ? searchParams.room.trim().toLowerCase() : "";
  const initialRoom = /^[a-z0-9-]{8,64}$/.test(value) ? value : "";
  const initialMode = searchParams.mode === "code" && !initialRoom ? "code" : "automatic";
  return <ShareIt initialRoom={initialRoom} initialMode={initialMode} />;
}
