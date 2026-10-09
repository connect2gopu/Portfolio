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

Open `/tools/shareit` on two devices connected to the same Wi-Fi. **Four-digit pairing** is the default: A clicks **Create four-digit code**, B enters those four digits and clicks **Connect with code**, and connection details are exchanged automatically. No return code or physical access to the other device is required. The code expires after three minutes, is restricted to one receiver, and is removed once connected or cancelled. Pairing attempts are rate limited. Files still transfer directly between devices.

Four-digit pairing uses the shared signaling store configured below on Vercel; local development uses memory. The four digits are a lookup key, not the complete connection details. Without a configured store in production, select **Manual QR pairing**, which requires no Redis account, signaling service, or additional backend credentials. Its flow is:

1. On device A, enter its name and click **Create pairing QR**.
2. On device B, scan A's QR with the phone camera to open the page and import the connection details. Alternatively, use **Scan QR**, upload a QR image, or paste the pairing link in ShareIt.
3. B generates a **response QR**. On A, use **Scan QR** in the original tab to scan B's response. Alternatively, upload its image or paste its response code. A's original tab must stay open because it holds the pending connection.
4. Once connected, either device can select files and click **Send files**. The receiver accepts or declines. The connection stays open for subsequent transfers in either direction.

Both the offer and response must be exchanged: one scan alone cannot establish a serverless WebRTC connection. All local ICE candidates are collected before generating the compressed pairing QR. The offer link carries its payload in the URL fragment, which is not sent to the hosting server. The response is a code to import into A's existing tab, not a link that opens a new tab. Pairing expires after three minutes. Files travel through an encrypted direct WebRTC data channel, with no TURN relay or server upload.

Keep both pages open. Up to 100 files and 200 MB combined are supported per transfer. Received files are held in browser memory, so save them before refreshing or closing the page. Guest Wi-Fi/client isolation and firewalls can prevent direct connections.

For local Wi-Fi access, run `npm run dev:lan` (or `npm run dev:lan -- --port 3100`). The server listens on all interfaces over HTTP without Tina CMS. Pairing links use the server's private IPv4 address and current port; choose the Wi-Fi address if multiple adapters are listed. HTTP LAN pages support file transfers, QR-image upload, and pasted codes. **Live camera scanning requires HTTPS or localhost**, because browsers restrict camera access. For optional HTTPS, use `npm run dev:lan:https` with a certificate covering the LAN IP and trusted on both devices. Allow the port through the computer's firewall.

**Automatic discovery** remains optional. Locally it uses memory in one server process. On Vercel it groups visitors by their shared public IP; VPNs, IPv6, and shared carrier IPs can affect visibility. Private rooms provide a fallback. Four-digit pairing and automatic discovery in production require an Upstash-compatible Redis REST database:

```env
SHAREIT_REDIS_REST_URL=https://your-redis-rest-endpoint
SHAREIT_REDIS_REST_TOKEN=your-server-only-token
```

The standard `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` pair is also supported. Use a read/write token and keep credentials server-only. Set the pair in Vercel's environment variables for Production and Preview as needed, then redeploy. The automatic-discovery store expires presence and signaling data. Without Redis, use manual QR mode; code pairing and automatic production discovery intentionally refuse an in-memory fallback across serverless instances. For self-hosted production, `SHAREIT_ALLOW_LAN_LINKS=true` enables server LAN-address suggestions; it is disabled by default and always disabled on Vercel.

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
