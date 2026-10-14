# Deploy

The site is a static export, so any static host works. Vercel is the simplest.

## Vercel

1. Push the repository to GitHub.
2. In Vercel: **Add New → Project → Import** the repository.
3. Framework preset: **Next.js** (detected automatically). Leave build command (`next build`) and output settings at their defaults.
4. Click **Deploy**. Every push to the production branch redeploys; other branches get preview URLs.
5. Copy the production URL (for example `https://your-project.vercel.app`) into `site.config.ts → url`, commit and push. This makes Open Graph images and the sitemap use absolute URLs on your domain.

## Custom domain

1. Vercel → your project → **Settings → Domains → Add** and enter the domain (e.g. `yourname.com`).
2. At your domain registrar, add the DNS records Vercel shows:
   - apex domain (`yourname.com`): `A` record → `76.76.21.21`
   - `www`: `CNAME` → `cname.vercel-dns.com`
   (Or switch the domain's nameservers to Vercel.)
3. Wait for Vercel to verify the domain and issue the HTTPS certificate.
4. Update `site.config.ts → url` to the custom domain, commit and push.

## Before sharing the link

- Replace the placeholder Upwork and LinkedIn URLs in `site.config.ts`.
- Regenerate assets after changing names, titles or projects: `npm run build && npm run assets`, then commit `public/og` and `public/fallback`.
- Upload `exports/covers/<slug>.png` and paste `exports/upwork/<slug>.txt` into each Upwork portfolio item.
- Optional: check with PageSpeed Insights (mobile) at https://pagespeed.web.dev.
