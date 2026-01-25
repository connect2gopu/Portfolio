import { ContactForm } from "@/components/forms/ContactForm";
import { generateSEO } from "@/lib/seo";
import { Metadata } from "next";

export const metadata: Metadata = generateSEO({
  title: "Contact | Portfolio",
  description: "Get in touch with me. I&apos;d love to hear from you!",
  url: "/contact",
});

export default function ContactPage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Get In Touch</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Have a question or want to work together? Feel free to reach out using the form below, or connect with me on social media.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Contact Form */}
        <div className="lg:col-span-2">
          <ContactForm />
        </div>

        {/* Contact Info */}
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Contact Information</h2>
            <div className="space-y-4 text-muted-foreground">
              <div>
                <p className="font-medium text-foreground mb-1">Email</p>
                <a
                  href="mailto:connect2gopu@gmail.com"
                  className="hover:text-primary transition-colors"
                >
                  connect2gopu@gmail.com
                </a>
              </div>
              <div>
                <p className="font-medium text-foreground mb-1">Social Media</p>
                <div className="flex gap-4">
                  <a
                    href="https://github.com/whogopu"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary transition-colors"
                    aria-label="GitHub"
                  >
                    GitHub
                  </a>
                  <a
                    href="https://linkedin.com/in/whogopu"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary transition-colors"
                    aria-label="LinkedIn"
                  >
                    LinkedIn
                  </a>
                  <a
                    href="https://leetcode.com/whogopu"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary transition-colors"
                    aria-label="LeetCode"
                  >
                    LeetCode
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t">
            <h3 className="text-lg font-semibold mb-2">Response Time</h3>
            <p className="text-sm text-muted-foreground">
              I typically respond within 24-48 hours. For urgent matters, please reach out via social media.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

