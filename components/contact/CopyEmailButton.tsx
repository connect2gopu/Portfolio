"use client";

import { useState } from "react";

interface CopyEmailButtonProps {
  email: string;
}

export function CopyEmailButton({ email }: CopyEmailButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(email);
    } catch {
      const el = document.createElement("textarea");
      el.value = email;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <span className="relative inline-flex">
      {/* Floating "Copied!" tooltip */}
      <span
        aria-live="polite"
        className={`absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded text-xs font-medium
                    bg-foreground text-background whitespace-nowrap pointer-events-none
                    transition-all duration-200
                    ${copied ? "opacity-100 -translate-y-0" : "opacity-0 translate-y-1"}`}
      >
        Copied!
        <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-foreground" />
      </span>

      <button
        onClick={handleCopy}
        className="inline-flex items-center gap-1 ml-1.5 px-2 py-0.5 rounded-md text-xs font-medium
                   text-muted-foreground hover:text-primary hover:bg-primary/10
                   border border-transparent hover:border-primary/20
                   transition-all duration-200"
        aria-label="Copy email address to clipboard"
      >
        {copied ? (
          <>
            <svg className="h-3.5 w-3.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-green-500">Copied</span>
          </>
        ) : (
          <>
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Copy
          </>
        )}
      </button>
    </span>
  );
}
