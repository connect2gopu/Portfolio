"use client";

import { Button } from "@/components/ui/Button";

export function ResumeDownload() {
  const handleDownload = () => {
    // Create a link element and trigger download
    const link = document.createElement("a");
    link.href = "/resume/Resume_Gopal_7_YOE.pdf";
    link.download = "Resume_Gopal_7_YOE.pdf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-3xl font-bold mb-4">Resume</h2>
      <p className="text-muted-foreground mb-6">
        Download my resume to learn more about my experience and qualifications.
      </p>
      <Button
        onClick={handleDownload}
        size="lg"
        className="w-full sm:w-auto"
      >
        <svg
          className="mr-2 h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        Download Resume
      </Button>
    </div>
  );
}
