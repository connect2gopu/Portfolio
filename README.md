# Portfolio Website

A modern portfolio website with integrated blog functionality built with Next.js, Tina CMS, and deployed on Vercel.

## 🚀 Features

- **Portfolio Showcase**: Display your projects with filtering and search
- **Blog**: Full-featured blog with categories, tags, and search
- **About Page**: Experience timeline, skills, and social links
- **Contact Form**: Functional contact form with validation
- **Dark/Light Mode**: Toggle between themes
- **Responsive Design**: Works on all devices
- **SEO Optimized**: Full meta tags and Open Graph support
- **RSS Feed**: Blog RSS feed at `/api/rss`
- **Tina CMS**: Content management for projects and blog posts

## ShareIt file sharing

Open `/tools/shareit` on two devices connected to the same Wi-Fi. Give each device a name, select files on either device, and click **Send** beside the receiver. The receiver accepts the request and saves the received files. Keep both pages open throughout the transfer. Up to 100 files and 200 MB combined are supported per transfer; received files are held in memory until the page closes.

The **Connect your other device** panel displays a QR code that can be scanned with the phone's camera or QR scanner, plus a copyable link. In local development it detects the server's private IPv4 addresses and preserves the current protocol and port. Pick the Wi-Fi adapter's address if multiple adapters are listed. **Create private invite** generates a room and includes `?room=...` in the QR/link so the second device automatically joins it. Room changes update both the invite and the browser URL. On hosted deployments the public website URL is used instead of the cloud server's internal IP.

For local Wi-Fi access, run `npm run dev:lan` (or `npm run dev:lan -- --port 3100` for a different port). This starts Next.js on all interfaces over HTTP, without Tina CMS. Open `/tools/shareit`, then scan its QR code or copy the internal-IP link to the other device. Both devices should use a current browser that supports WebRTC data channels. ShareIt generates cryptographically random device IDs on HTTP LAN pages using `crypto.getRandomValues` when the HTTPS-only `crypto.randomUUID` API is unavailable. Allow the server port through the computer's firewall. For self-hosted production, `SHAREIT_ALLOW_LAN_LINKS=true` enables server LAN-address suggestions; it is disabled by default and always disabled on Vercel.

For optional local HTTPS, run `npm run dev:lan:https`. The certificate must cover the selected LAN IP and be trusted on both devices. You can supply your own LAN certificate with `--experimental-https-key /path/to/key.pem --experimental-https-cert /path/to/cert.pem`. Public deployments should use HTTPS to protect the site and signaling traffic.

File bytes use an encrypted, direct WebRTC data channel with no TURN relay or server upload. The site only handles presence and WebRTC signaling. Automatic discovery on Vercel groups devices by public IP; this is an approximation of network membership, not Wi-Fi scanning. Shared carrier IPs may show unrelated devices, while VPNs and IPv6 can hide devices on the same Wi-Fi. Use a random private room code on both devices when needed. Room codes do not bypass router isolation or firewalls. Discovery and loading the site require connectivity to the hosting server.

For Vercel or any production deployment, configure a Redis service with a REST API compatible with Upstash:

```env
SHAREIT_REDIS_REST_URL=https://your-redis-rest-endpoint
SHAREIT_REDIS_REST_TOKEN=your-server-only-token
```

These credentials must remain server-only. Presence, credentials, and signaling expire automatically. Production intentionally refuses an in-memory fallback because serverless instances do not share memory. Non-Vercel hosting must use private rooms (automatic discovery relies on Vercel's trusted client-IP header).

Local development uses an in-memory store in one Next.js process. The LAN HTTP link is supported for file transfers without requesting camera or microphone access. Browser features such as the modern Clipboard API still require a secure context; ShareIt includes a copy fallback and selectable link for local HTTP. Guest Wi-Fi/client isolation and some browser/network combinations can prevent a direct connection.

## 🛠️ Tech Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Tina CMS** - Headless CMS
- **MDX** - Content format
- **Vercel Analytics** - Analytics
- **Vercel** - Hosting

## 📦 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Git

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/connect2gopu.git
cd connect2gopu
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file:
```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_TINA_CLIENT_ID=your_tina_client_id
TINA_TOKEN=your_tina_token
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Tina CMS Admin

To access the Tina CMS admin panel:
```bash
npm run dev:tina
```

Then navigate to [http://localhost:3000/admin](http://localhost:3000/admin)

## 📁 Project Structure

```
connect2gopu/
├── app/                    # Next.js App Router
│   ├── (main)/            # Main routes
│   ├── api/               # API routes
│   └── admin/             # Tina CMS admin
├── components/             # React components
│   ├── about/             # About page components
│   ├── blog/              # Blog components
│   ├── forms/             # Form components
│   ├── home/              # Home page components
│   ├── layout/             # Layout components
│   ├── portfolio/         # Project components
│   └── ui/                # UI components
├── content/               # MDX content files
│   ├── blog/              # Blog posts
│   └── projects/          # Projects
├── lib/                   # Utility functions
├── public/                # Static assets
└── types/                 # TypeScript types
```

## 🚢 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy!

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

### Connect GoDaddy Domain

See [DOMAIN_SETUP.md](./DOMAIN_SETUP.md) for GoDaddy DNS configuration.

## 📝 Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run dev:tina` - Start with Tina CMS

## 🎨 Customization

### Colors

Edit `app/globals.css` to change the color scheme.

### Content

- Projects: Add MDX files in `content/projects/`
- Blog Posts: Add MDX files in `content/blog/`
- Or use Tina CMS at `/admin`

### Skills

Edit `components/home/SkillsShowcase.tsx` to update skills.

### Experience

Edit `components/about/ExperienceTimeline.tsx` to update work experience.

## 📄 License

MIT

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Content managed with [Tina CMS](https://tina.io/)
- Deployed on [Vercel](https://vercel.com/)
