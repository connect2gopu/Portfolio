import Link from "next/link";

interface SocialLink {
  name: string;
  href: string;
  icon: React.ReactNode;
}

const socialLinks: SocialLink[] = [
  {
    name: "GitHub",
    href: "https://github.com/whogopu",
    icon: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    name: "LinkedIn",
    href: "https://linkedin.com/in/whogopu",
    icon: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    name: "LeetCode",
    href: "https://leetcode.com/u/whogopu/",
    icon: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M16.102 17.93l-2.697 2.607c-.466.467-1.111.662-1.823.662s-1.357-.195-1.824-.662L2.571 9.149c-.467-.467-.702-1.15-.702-1.863s.235-1.357.702-1.824l4.082-4.089c.467-.467 1.125-.645 1.837-.645s1.357.195 1.823.662l2.697 2.606c.514.515 1.365.497 1.9-.038.535-.536.553-1.387.039-1.901L9.505 1.198C8.531.225 7.235-.029 5.97.029S3.408.225 2.435 1.198L-1.645 5.312c-.973.973-1.219 2.269-1.219 3.534s.246 2.561 1.219 3.534l6.221 6.221c.973.973 2.269 1.219 3.534 1.219s2.561-.246 3.534-1.219l2.697-2.607c.514-.514 1.365-.497 1.9.038.535.536.553 1.387.039 1.901zm-1.833-3.306l2.697 2.607c.466.467 1.111.662 1.824.662s1.357-.195 1.823-.662l5.521-5.388c.467-.467.702-1.15.702-1.863s-.235-1.357-.702-1.824l-4.082-4.089c-.467-.467-1.111-.702-1.824-.702s-1.357.235-1.823.702l-2.697 2.607c-.514.515-1.365.497-1.9-.038-.535-.536-.553-1.387-.039-1.901l2.722-2.636c.973-.973 2.269-1.219 3.534-1.219s2.561.246 3.534 1.219l4.08 4.089c.973.973 1.219 2.269 1.219 3.534s-.246 2.561-1.219 3.534l-6.221 6.221c-.973.973-2.269 1.219-3.534 1.219s-2.561-.246-3.534-1.219l-2.697-2.607c-.514-.514-1.365-.497-1.9.038-.535.536-.553 1.387-.039 1.901z"/>
      </svg>
    ),
  },
];

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-background mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">Gopal sharma</h3>
            <p className="text-sm text-muted-foreground">
              Team Lead (Software Engineering) & Full-Stack Developer with 7+ years of experience
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/about" className="text-muted-foreground hover:text-primary transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link href="/projects" className="text-muted-foreground hover:text-primary transition-colors">
                  Projects
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-muted-foreground hover:text-primary transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-muted-foreground hover:text-primary transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Connect</h3>
            <div className="flex gap-4">
              {socialLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                  aria-label={link.name}
                >
                  {link.icon}
                </a>
              ))}
            </div>
          </div>
        </div>
        
        <div className="border-t pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {currentYear} All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <a
              href="/api/rss"
              className="hover:text-primary transition-colors flex items-center gap-1"
              aria-label="RSS Feed"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6.503 20.752c0 1.794-1.456 3.248-3.251 3.248-1.796 0-3.252-1.454-3.252-3.248 0-1.794 1.456-3.248 3.252-3.248 1.795.001 3.251 1.454 3.251 3.248zm-6.503-12.572v4.811c6.05.062 10.96 4.966 11.022 11.009h4.817c-.062-8.937-7.32-16.196-16.24-16.24zm0-3.368c10.58.046 19.152 8.594 19.183 19.188h4.817c-.03-13.231-10.755-23.954-24-24v4.812z" />
              </svg>
              RSS Feed
            </a>
            <p className="text-sm text-muted-foreground">
              Built with Next.js, Tina CMS & Vercel
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
