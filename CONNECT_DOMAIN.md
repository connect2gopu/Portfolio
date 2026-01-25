# Connect connect2gopu.in to Vercel

Quick guide to connect your GoDaddy domain to your Vercel deployment.

## Step 1: Add Domain in Vercel (2 minutes)

1. Go to your Vercel dashboard: [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click on your **connect2gopu** project
3. Go to **Settings** → **Domains**
4. Click **"Add Domain"**
5. Enter: `connect2gopu.in`
6. Click **"Add"**

Vercel will show you DNS records to configure. **Keep this page open** - you'll need the IP addresses.

---

## Step 2: Configure DNS in GoDaddy (5 minutes)

### Option A: Using A Records (Recommended for root domain)

1. **Log in to GoDaddy**: [godaddy.com](https://godaddy.com)
2. Go to **My Products** → **Domains**
3. Find `connect2gopu.in` and click **"DNS"** (or **"Manage DNS"**)
4. **Delete existing A records** (if any) for the root domain (@)
5. **Add new A records**:

   **Record 1:**
   ```
   Type: A
   Name: @
   Value: 76.76.21.21
   TTL: 600 seconds (or 1 hour)
   ```

   **Record 2:**
   ```
   Type: A
   Name: @
   Value: 76.76.21.22
   TTL: 600 seconds (or 1 hour)
   ```

   **Note**: Use the exact IP addresses shown in your Vercel dashboard (they may differ from the example above).

6. **For www subdomain** (optional but recommended), add a CNAME:
   ```
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   TTL: 600 seconds
   ```

7. **Save** all changes

### Option B: Using Vercel Nameservers (Alternative)

If you prefer to use Vercel's nameservers:

1. In Vercel, when adding the domain, select **"Use Vercel DNS"**
2. Copy the nameservers shown (usually 4 nameservers)
3. In GoDaddy:
   - Go to **DNS** settings
   - Scroll to **Nameservers**
   - Click **"Change"**
   - Select **"Custom"**
   - Enter the Vercel nameservers
   - Save

---

## Step 3: Wait for DNS Propagation (1-48 hours)

- Usually works within **1-2 hours**
- Can take up to **48 hours** in rare cases
- Check status: [whatsmydns.net/#A/connect2gopu.in](https://www.whatsmydns.net/#A/connect2gopu.in)

---

## Step 4: Verify in Vercel (5 minutes)

1. Go back to Vercel dashboard → **Settings** → **Domains**
2. Check the status of `connect2gopu.in`:
   - ✅ **"Valid Configuration"** = DNS is correct
   - ⏳ **"Pending"** = Waiting for DNS propagation
   - ❌ **"Invalid"** = Check DNS records again

3. **SSL Certificate**: Vercel automatically issues SSL certificates via Let's Encrypt
   - Wait 10-15 minutes after DNS propagates
   - Status will show **"Valid"** when ready

---

## Step 5: Update Environment Variable

1. In Vercel dashboard → **Settings** → **Environment Variables**
2. Update `NEXT_PUBLIC_SITE_URL`:
   ```
   NEXT_PUBLIC_SITE_URL=https://connect2gopu.in
   ```
3. **Redeploy** your project (or wait for next deployment)

---

## Step 6: Test Your Site

Once DNS propagates and SSL is issued:

1. Visit `https://connect2gopu.in`
2. Test all pages:
   - Home page
   - About
   - Projects
   - Blog
   - Contact
3. Verify HTTPS is working (green lock in browser)

---

## Troubleshooting

### Domain not resolving?

1. **Check DNS propagation**: [whatsmydns.net](https://www.whatsmydns.net)
2. **Verify A records** in GoDaddy match Vercel's requirements
3. **Wait longer** (up to 48 hours)
4. **Clear browser cache** or try incognito mode

### SSL certificate not issued?

1. Ensure DNS is fully propagated
2. Wait 10-15 minutes after DNS propagation
3. Check domain status in Vercel dashboard
4. Contact Vercel support if issues persist

### www subdomain not working?

1. Add CNAME record for `www` pointing to `cname.vercel-dns.com`
2. Or configure redirect in Vercel settings

---

## Quick Reference

**Vercel Dashboard**: [vercel.com/dashboard](https://vercel.com/dashboard)
**GoDaddy DNS**: [dcc.godaddy.com/manage](https://dcc.godaddy.com/manage)
**DNS Check**: [whatsmydns.net](https://www.whatsmydns.net)

---

## Expected DNS Records in GoDaddy

After setup, your GoDaddy DNS should look like:

```
Type    Name    Value              TTL
A       @       76.76.21.21        600
A       @       76.76.21.22        600
CNAME   www     cname.vercel-dns.com 600
```

**Note**: Use the exact IP addresses from your Vercel dashboard!

---

**That's it!** Your domain should be connected within 1-2 hours. 🎉
