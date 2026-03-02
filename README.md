# Mindset Unblocker — Deployment Guide

A 5-minute AI-powered reflection tool by Lähtijät.  
Helps people identify and reframe limiting beliefs.

---

## Quick Deploy to Vercel (15 minutes)

### Step 1: Get your Anthropic API key

1. Go to **https://console.anthropic.com**
2. Create an account (or sign in)
3. Add a payment method
4. Go to **API Keys** → Create a new key
5. Copy the key (starts with `sk-ant-...`)

**Set a spending limit:**
- Go to Settings → Limits
- Set monthly limit to e.g. **$10** (≈ 300-500 sessions)
- Set an alert at **$5** so you get notified

### Step 2: Deploy to Vercel

**Option A — Via GitHub (recommended for updates):**

1. Create a GitHub account if you don't have one (github.com)
2. Create a new repository and upload this entire folder
3. Go to **https://vercel.com** → Sign up with GitHub
4. Click **"New Project"** → Import your repository
5. In the settings before deploy, add an **Environment Variable**:
   - Name: `ANTHROPIC_API_KEY`  
   - Value: your API key from Step 1
6. Click **Deploy**

**Option B — Direct upload (quickest):**

1. Go to **https://vercel.com** → Sign up (Google or email)
2. Install Vercel CLI: open Terminal and run `npm i -g vercel`
3. Navigate to this folder in Terminal
4. Run `vercel` and follow the prompts
5. When asked about environment variables, or afterwards in the Vercel dashboard:
   - Go to your project → Settings → Environment Variables
   - Add `ANTHROPIC_API_KEY` with your key
6. Run `vercel --prod` to deploy

### Step 3: You're live!

Vercel gives you a URL like: `mindset-unblocker-xyz.vercel.app`

Share this link with anyone.

---

## Optional: Custom Domain

1. In Vercel dashboard → Your project → Settings → Domains
2. Add your domain (e.g. `unblocker.lahtijat.fi`)
3. Vercel shows you DNS records to add at your domain registrar
4. Add the records, wait a few minutes, done

---

## Project Structure

```
mindset-unblocker/
├── api/
│   └── chat.js          ← Serverless function (keeps API key secure)
├── public/
│   └── index.html       ← The full app (single file)
├── package.json
├── vercel.json          ← Routing config
└── README.md            ← This file
```

---

## Cost Monitoring

- **Anthropic console** (console.anthropic.com): See real-time usage, set limits
- **Vercel dashboard**: See traffic/visits (free tier = plenty)
- Each user session ≈ $0.01–0.03
- $10/month limit handles ~300-500 sessions easily

To shut it down: either disable the API key in Anthropic console, or pause the Vercel deployment.

---

## Customization

To change the coaching flow or prompts, edit the `SYSTEM_EN` and `SYSTEM_FI` 
variables in `public/index.html`. Redeploy with `vercel --prod`.
