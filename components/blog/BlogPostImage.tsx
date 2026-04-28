"use client";

import { useState } from "react";
import Image from "next/image";

const CATEGORY_GRADIENTS: Record<string, string> = {
  "TypeScript": "from-blue-500/20 via-blue-400/10 to-sky-500/20",
  "React": "from-cyan-500/20 via-cyan-400/10 to-teal-500/20",
  "Next.js": "from-slate-500/20 via-slate-400/10 to-zinc-500/20",
  "JavaScript": "from-yellow-500/20 via-amber-400/10 to-orange-500/20",
  "Web Development": "from-violet-500/20 via-purple-400/10 to-indigo-500/20",
  "Node.js": "from-green-500/20 via-emerald-400/10 to-teal-500/20",
  "CSS": "from-pink-500/20 via-rose-400/10 to-red-500/20",
};

function BlogPlaceholder({ title, categories }: { title: string; categories: string[] }) {
  const category = categories[0] || "General";
  const gradient = CATEGORY_GRADIENTS[category] ?? "from-primary/20 via-primary/10 to-accent/20";
  const initials = title
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className={`w-full h-full flex flex-col items-center justify-center bg-gradient-to-br ${gradient} gap-2.5`}>
      <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/25 shadow-sm">
        <span className="text-xl font-bold text-primary">{initials}</span>
      </div>
      <span className="text-xs font-medium text-primary/70 px-2.5 py-0.5 bg-primary/10 rounded-full border border-primary/15">
        {category}
      </span>
    </div>
  );
}

interface BlogPostImageProps {
  src?: string;
  alt: string;
  title: string;
  categories: string[];
}

export function BlogPostImage({ src, alt, title, categories }: BlogPostImageProps) {
  const [error, setError] = useState(false);

  if (error || !src) {
    return <BlogPlaceholder title={title} categories={categories} />;
  }

  if (src.startsWith("/")) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover"
        onError={() => setError(true)}
      />
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className="w-full h-full object-cover"
      onError={() => setError(true)}
    />
  );
}
