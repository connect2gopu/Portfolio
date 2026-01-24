# Deployment Guide - Vercel + GoDaddy Domain

This guide will walk you through deploying your portfolio website to Vercel and connecting your GoDaddy domain.

## Prerequisites

- GitHub account
- Vercel account (sign up at [vercel.com](https://vercel.com))
- GoDaddy domain
- Tina CMS account (optional, for content management)

---

## Step 1: Prepare Your Repository

### 1.1 Initialize Git (if not already done)

```bash
git init
git add .
git commit -m "Initial commit: Portfolio website"
```

### 1.2 Push to GitHub

1. Create a new repository on GitHub
2. Push your code:

```bash
git remote add origin https://github.com/yourusername/connect2gopu.git
git branch -M main
git push -u origin main
```

---

## Step 2: Deploy to Vercel

### 2.1 Import Project

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"Add New Project"**
3. Import your GitHub repository (`connect2gopu`)
4. Vercel will auto-detect Next.js settings

### 2.2 Configure Build Settings

Vercel should auto-detect:
- **Framework Preset**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

### 2.3 Set Environment Variables

Before deploying, add these environment variables in Vercel:

1. Go to **Settings** → **Environment Variables**
2. Add the following:

```
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

**For Tina CMS** (if using):
```
NEXT_PUBLIC_TINA_CLIENT_ID=your_tina_client_id
TINA_TOKEN=your_tina_token
```

**For Contact Form** (optional - if you set up email service):
```
RESEND_API_KEY=your_resend_api_key
CONTACT_EMAIL=your-email@example.com
```

### 2.4 Deploy

1. Click **"Deploy"**
2. Wait for the build to complete (usually 2-3 minutes)
3. Your site will be live at `https://your-project.vercel.app`

---

## Step 3: Connect GoDaddy Domain

### 3.1 Add Domain in Vercel

1. Go to your project in Vercel
2. Navigate to **Settings** → **Domains**
3. Click **"Add Domain"**
4. Enter your domain (e.g., `yourdomain.com`)
5. Vercel will show you DNS records to configure

### 3.2 Configure DNS in GoDaddy

1. Log in to your **GoDaddy account**
2. Go to **My Products** → **Domains**
3. Click **DNS** next to your domain
4. You'll need to add/update these records:

#### Option A: Using A Record (Recommended)

Delete existing A records and add:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | 76.76.21.21 | 600 |
| A | @ | 76.76.21.22 | 600 |

**Note**: Vercel will provide the exact IP addresses. Use the ones shown in your Vercel dashboard.

#### Option B: Using CNAME (For subdomains like www)

| Type | Name | Value | TTL |
|------|------|-------|-----|
| CNAME | www | cname.vercel-dns.com | 600 |

### 3.3 Update Nameservers (Alternative Method)

If you prefer to use Vercel's nameservers:

1. In Vercel, go to **Settings** → **Domains**
2. Click on your domain
3. Select **"Use Vercel DNS"**
4. Copy the nameservers shown
5. In GoDaddy:
   - Go to **DNS** settings
   - Scroll to **Nameservers**
   - Click **"Change"**
   - Select **"Custom"**
   - Enter the Vercel nameservers
   - Save

### 3.4 Wait for DNS Propagation

- DNS changes can take **24-48 hours** to propagate
- Usually works within **1-2 hours**
- Check status in Vercel dashboard

### 3.5 Verify SSL Certificate

Vercel automatically provisions SSL certificates via Let's Encrypt. Once DNS propagates:
1. Go to **Settings** → **Domains** in Vercel
2. Wait for the SSL certificate to be issued (usually automatic)
3. Your site will be accessible at `https://yourdomain.com`

---

## Step 4: Configure Tina CMS (Optional)

If you're using Tina CMS:

### 4.1 Set up Tina Cloud

1. Go to [tina.io](https://tina.io)
2. Create a new project
3. Get your `NEXT_PUBLIC_TINA_CLIENT_ID` and `TINA_TOKEN`
4. Add them to Vercel environment variables

### 4.2 Update Environment Variables

In Vercel, add:
```
NEXT_PUBLIC_TINA_CLIENT_ID=your_client_id
TINA_TOKEN=your_token
```

### 4.3 Redeploy

After adding environment variables, trigger a new deployment.

---

## Step 5: Set Up Contact Form Email (Optional)

### 5.1 Using Resend (Recommended)

1. Sign up at [resend.com](https://resend.com)
2. Create an API key
3. Add to Vercel environment variables:
   ```
   RESEND_API_KEY=re_your_api_key
   CONTACT_EMAIL=your-email@example.com
   ```

### 5.2 Update Contact API Route

Update `/app/api/contact/route.ts` to use Resend:

```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// In the POST function:
await resend.emails.send({
  from: 'onboarding@resend.dev',
  to: process.env.CONTACT_EMAIL!,
  subject: `Contact Form: ${subject}`,
  html: `<p>From: ${name} (${email})</p><p>${message}</p>`,
});
```

---

## Step 6: Final Configuration

### 6.1 Update Site URL

Make sure `NEXT_PUBLIC_SITE_URL` in Vercel matches your actual domain:
```
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

### 6.2 Create OG Image

1. Create an Open Graph image (1200x630px)
2. Save as `/public/og-image.jpg`
3. Commit and push to trigger redeploy

### 6.3 Test Your Site

- ✅ Home page loads
- ✅ All navigation links work
- ✅ Projects display correctly
- ✅ Blog posts render
- ✅ Contact form works
- ✅ RSS feed accessible at `/api/rss`
- ✅ SSL certificate is active (HTTPS)

---

## Troubleshooting

### DNS Not Working

1. **Check DNS propagation**: [whatsmydns.net](https://www.whatsmydns.net)
2. Verify records in GoDaddy match Vercel's requirements
3. Wait up to 48 hours for full propagation
4. Clear your browser cache

### SSL Certificate Issues

1. Ensure DNS is fully propagated
2. Check domain is correctly added in Vercel
3. Wait 10-15 minutes after DNS propagation
4. Contact Vercel support if issues persist

### Build Errors

1. Check build logs in Vercel dashboard
2. Ensure all environment variables are set
3. Verify `package.json` dependencies
4. Test build locally: `npm run build`

### Contact Form Not Working

1. Verify API route is deployed
2. Check browser console for errors
3. Ensure email service is configured (if using)
4. Check Vercel function logs

---

## Post-Deployment Checklist

- [ ] Domain connected and SSL active
- [ ] All pages load correctly
- [ ] Navigation works
- [ ] Images display properly
- [ ] Contact form submits successfully
- [ ] RSS feed accessible
- [ ] SEO metadata correct
- [ ] Dark/light mode works
- [ ] Mobile responsive
- [ ] Analytics tracking (if configured)

---

## Useful Links

- [Vercel Documentation](https://vercel.com/docs)
- [GoDaddy DNS Help](https://www.godaddy.com/help)
- [Tina CMS Setup](https://tina.io/docs/tina-cloud/)
- [Resend Documentation](https://resend.com/docs)

---

## Support

If you encounter issues:
1. Check Vercel deployment logs
2. Review GoDaddy DNS settings
3. Consult Vercel and GoDaddy documentation
4. Contact support if needed

---

**Congratulations!** Your portfolio website is now live! 🎉
