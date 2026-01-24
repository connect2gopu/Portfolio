"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/Button";

interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export function ContactForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ContactFormData>();

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    setSubmitStatus({ type: null, message: "" });

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        setSubmitStatus({
          type: "success",
          message: "Thank you! Your message has been sent successfully.",
        });
        reset();
      } else {
        setSubmitStatus({
          type: "error",
          message: result.error || "Something went wrong. Please try again.",
        });
      }
    } catch (error) {
      setSubmitStatus({
        type: "error",
        message: "Failed to send message. Please try again later.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-2">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            id="name"
            type="text"
            {...register("name", { required: "Name is required" })}
            className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Your name"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-2">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            id="email"
            type="email"
            {...register("email", {
              required: "Email is required",
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: "Invalid email address",
              },
            })}
            className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="your.email@example.com"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
          )}
        </div>

        {/* Subject */}
        <div>
          <label htmlFor="subject" className="block text-sm font-medium mb-2">
            Subject <span className="text-red-500">*</span>
          </label>
          <input
            id="subject"
            type="text"
            {...register("subject", { required: "Subject is required" })}
            className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="What's this about?"
          />
          {errors.subject && (
            <p className="mt-1 text-sm text-red-500">{errors.subject.message}</p>
          )}
        </div>

        {/* Message */}
        <div>
          <label htmlFor="message" className="block text-sm font-medium mb-2">
            Message <span className="text-red-500">*</span>
          </label>
          <textarea
            id="message"
            rows={6}
            {...register("message", {
              required: "Message is required",
              minLength: {
                value: 10,
                message: "Message must be at least 10 characters",
              },
            })}
            className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            placeholder="Your message here..."
          />
          {errors.message && (
            <p className="mt-1 text-sm text-red-500">{errors.message.message}</p>
          )}
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          size="lg"
          disabled={isSubmitting}
          className="w-full"
        >
          {isSubmitting ? "Sending..." : "Send Message"}
        </Button>

        {/* Status Message */}
        {submitStatus.type && (
          <div
            className={`p-4 rounded-lg ${
              submitStatus.type === "success"
                ? "bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800"
                : "bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800"
            }`}
          >
            {submitStatus.message}
          </div>
        )}
      </form>
    </div>
  );
}
