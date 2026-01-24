# GoDaddy Domain Setup Guide

This is a quick reference guide for connecting your GoDaddy domain to Vercel.

## Quick Steps

### 1. Get DNS Records from Vercel

1. In Vercel dashboard, go to **Settings** → **Domains**
2. Click **"Add Domain"** and enter your domain
3. Vercel will show you the DNS records needed

### 2. Configure DNS in GoDaddy

#### Method 1: A Records (For root domain)

1. Log in to GoDaddy
2. Go to **My Products** → **Domains**
3. Click **DNS** next to your domain
4. Find existing **A records** and delete them
5. Add new A records:

```
Type: A
Name: @
Value: 76.76.21.21 (or IP from Vercel)
TTL: 600 seconds
```

```
Type: A
Name: @
Value: 76.76.21.22 (or IP from Vercel)
TTL: 600 seconds
```

#### Method 2: CNAME (For www subdomain)

```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: 600 seconds
```

### 3. Alternative: Use Vercel Nameservers

1. In Vercel, get your nameservers (shown in domain settings)
2. In GoDaddy:
   - Go to **DNS** settings
   - Scroll to **Nameservers**
   - Click **"Change"**
   - Select **"Custom"**
   - Enter Vercel nameservers:
     - `ns1.vercel-dns.com`
     - `ns2.vercel-dns.com`
   - Save

### 4. Wait for Propagation

- Usually takes 1-2 hours
- Can take up to 48 hours
- Check status: [whatsmydns.net](https://www.whatsmydns.net)

### 5. Verify in Vercel

- Go to **Settings** → **Domains** in Vercel
- Status should show "Valid Configuration"
- SSL certificate will be issued automatically

## Common Issues

### Issue: Domain not resolving

**Solution:**
- Wait longer (up to 48 hours)
- Verify DNS records are correct
- Clear browser cache
- Try incognito mode

### Issue: SSL certificate not issued

**Solution:**
- Ensure DNS is fully propagated
- Wait 10-15 minutes after DNS propagation
- Check domain status in Vercel dashboard

### Issue: www subdomain not working

**Solution:**
- Add CNAME record for www
- Or configure redirect in Vercel settings

## GoDaddy DNS Record Examples

### For Root Domain (yourdomain.com)

```
A Record:
Name: @
Value: 76.76.21.21
TTL: 600

A Record:
Name: @
Value: 76.76.21.22
TTL: 600
```

### For www Subdomain (www.yourdomain.com)

```
CNAME Record:
Name: www
Value: cname.vercel-dns.com
TTL: 600
```

## Verification Commands

Check DNS propagation:
```bash
# Check A record
dig yourdomain.com A

# Check CNAME
dig www.yourdomain.com CNAME

# Check nameservers
dig yourdomain.com NS
```

## Need Help?

- [Vercel Domain Documentation](https://vercel.com/docs/concepts/projects/domains)
- [GoDaddy DNS Help](https://www.godaddy.com/help/manage-dns-records-680)
- Check Vercel dashboard for specific IP addresses
