# Quick Deployment Checklist

Follow these steps to deploy your portfolio to Vercel and connect your GoDaddy domain.

## ✅ Pre-Deployment Checklist

- [ ] Code is committed to Git
- [ ] Repository is pushed to GitHub
- [ ] You have a Vercel account (sign up at vercel.com)
- [ ] You have your GoDaddy domain ready

---

## 🚀 Step 1: Deploy to Vercel (5 minutes)

1. **Go to Vercel**: [vercel.com](https://vercel.com) → Sign in
2. **Add New Project** → Import your GitHub repository
3. **Configure Project**:
   - Framework: Next.js (auto-detected)
   - Root Directory: `./` (default)
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default)
4. **Add Environment Variable**:
   - Go to **Settings** → **Environment Variables**
   - Add: `NEXT_PUBLIC_SITE_URL` = `https://yourdomain.com`
5. **Click Deploy** → Wait 2-3 minutes
6. ✅ Your site is live at `your-project.vercel.app`

---

## 🌐 Step 2: Connect GoDaddy Domain (10 minutes)

### In Vercel:
1. Go to **Settings** → **Domains**
2. Click **"Add Domain"**
3. Enter your domain: `yourdomain.com`
4. Vercel shows you DNS records to add

### In GoDaddy:
1. Log in → **My Products** → **Domains**
2. Click **DNS** next to your domain
3. **Delete** existing A records
4. **Add** these A records:

```
Type: A
Name: @
Value: [IP from Vercel - usually 76.76.21.21]
TTL: 600

Type: A  
Name: @
Value: [IP from Vercel - usually 76.76.21.22]
TTL: 600
```

5. **For www subdomain**, add CNAME:
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: 600
```

6. **Save** all changes

---

## ⏳ Step 3: Wait for DNS (1-48 hours)

- Usually works in **1-2 hours**
- Can take up to **48 hours**
- Check status: [whatsmydns.net](https://www.whatsmydns.net)

---

## ✅ Step 4: Verify (5 minutes)

1. **Check Vercel dashboard**:**
   - Domain shows "Valid Configuration"
   - SSL certificate is issued (automatic)

2. **Test your site**:
   - Visit `https://yourdomain.com`
   - All pages load correctly
   - Navigation works
   - Contact form works

---

## 🔧 Optional: Set Up Tina CMS

1. Go to [tina.io](https://tina.io) → Create project
2. Get `NEXT_PUBLIC_TINA_CLIENT_ID` and `TINA_TOKEN`
3. Add to Vercel environment variables
4. Redeploy

---

## 🔧 Optional: Set Up Contact Form Email

1. Sign up at [resend.com](https://resend.com)
2. Get API key
3. Add to Vercel:
   - `RESEND_API_KEY` = your key
   - `CONTACT_EMAIL` = your email
4. Update `/app/api/contact/route.ts` to use Resend
5. Redeploy

---

## 📚 Detailed Guides

- **Full Deployment Guide**: See [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Domain Setup Details**: See [DOMAIN_SETUP.md](./DOMAIN_SETUP.md)

---

## 🆘 Troubleshooting

**Domain not working?**
- Wait longer (up to 48 hours)
- Verify DNS records match Vercel's requirements
- Clear browser cache

**SSL not working?**
- Wait 10-15 minutes after DNS propagates
- Check domain status in Vercel

**Build failing?**
- Check build logs in Vercel
- Ensure all environment variables are set
- Test locally: `npm run build`

---

**That's it!** Your portfolio is now live! 🎉
