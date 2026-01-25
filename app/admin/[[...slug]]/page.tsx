"use client";

import { TinaAdmin } from "tinacms";
import config from "@/lib/tina-config";

export default function AdminPage() {
  return <TinaAdmin config={config} />;
}
