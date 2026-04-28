"use client";

import { useState } from "react";
import Image from "next/image";

function ProjectPlaceholder({ title, category }: { title: string; category?: string }) {
  const initials = title
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-primary/10 via-primary/5 to-accent/10 gap-2">
      <div className="w-16 h-16 rounded-2xl bg-primary/15 flex items-center justify-center border border-primary/20">
        <span className="text-2xl font-bold text-primary">{initials}</span>
      </div>
      {category && (
        <span className="text-xs text-muted-foreground">{category}</span>
      )}
    </div>
  );
}

interface ProjectImageProps {
  src?: string;
  alt: string;
  title: string;
  category?: string;
}

export function ProjectImage({ src, alt, title, category }: ProjectImageProps) {
  const [error, setError] = useState(false);

  if (error || !src) {
    return <ProjectPlaceholder title={title} category={category} />;
  }

  if (src.startsWith("/")) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover transition-transform duration-300 group-hover/img:scale-105"
        onError={() => setError(true)}
      />
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className="w-full h-full object-cover transition-transform duration-300 group-hover/img:scale-105"
      onError={() => setError(true)}
    />
  );
}
