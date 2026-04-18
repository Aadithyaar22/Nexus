# Deployment Guide

Step-by-step guide to deploying Nexus for **$0/month** using free tiers:
Render (backend) + Vercel (frontend) + MongoDB Atlas (database) + Groq (LLM)
+ HuggingFace (embeddings) + browser TTS (or ElevenLabs for premium).

---

## Step 0 — Prerequisites

1. Code pushed to GitHub (public or private, both work).
2. A credit card is NOT required for any of the services below. Everything
   on this stack offers a genuine free tier.

---

## Step 1 — Get your API keys (5 minutes)

### Groq (LLM)
1. Go to https://console.groq.com/keys
2. Sign up (GitHub / Google / email)
3. Click **Create API Key**, name it `nexus`, copy the `gsk_...` value
4. Free tier: 1000 requests/min on Llama 3.3 70B, no credit card needed

### HuggingFace (embeddings)
1. Go to https://huggingface.co/settings/tokens
2. Sign up if you haven't
3. **New token** → name `nexus`, type **Read**, copy the `hf_...` value

### ElevenLabs (optional — premium TTS)
1. Go to https://elevenlabs.io/app/settings/api-keys
2. Sign up, click **Create API Key**, copy the value
3. Free tier: 10,000 characters/month (~10 minutes of audio)
4. **You can skip this entirely** — browser TTS works out of the box for free

---

## Step 2 — MongoDB Atlas (free database, 5 minutes)

1. Go to https://www.mongodb.com/cloud/atlas/register
2. Sign up, create a free **M0 cluster** (shared, 512 MB — plenty)
   - Region: pick the one closest to your Render region
     (AWS Mumbai if you're in India, or AWS Oregon for US-West)
3. **Database Access** → Add New Database User:
   - Username: `nexus`
   - Password: auto-generate and save it somewhere safe
   - Role: **Atlas admin** (fine for a personal project)
4. **Network Access** → Add IP Address → **Allow Access from Anywhere**
   (`0.0.0.0/0`)
   - Render's outbound IPs are dynamic on the free tier, so whitelisting
     everything is the simplest approach. For production, whitelist Render's
     actual egress ranges.
5. **Database** → **Connect** → **Drivers** → Node.js:
   - Copy the connection string, it looks like:
     `mongodb+srv://nexus:<password>@cluster0.xxxxx.mongodb.net/?...`
   - Replace `<password>` with your actual password
   - Add the database name after the `/`:
     `mongodb+srv://nexus:YOUR_PW@cluster0.xxxxx.mongodb.net/ai-notebook?retryWrites=true&w=majority`

Save this full URI — you'll paste it into Render next.

---

## Step 3 — Render (backend, 5 minutes)

1. Go to https://render.com and sign up (GitHub recommended — lets you
   connect repos in one click)
2. Click **New +** → **Web Service**
3. Connect your GitHub repo (install the Render GitHub app if prompted)
4. Configure:
   - **Name**: `nexus-backend` (or whatever you like)
   - **Region**: same as your Atlas region
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: **Free**
5. Click **Advanced** and add environment variables:

| Key                  | Value                                            |
| -------------------- | ------------------------------------------------ |
| `NODE_ENV`           | `production`                                     |
| `PORT`               | `10000` (Render's convention)                    |
| `MONGO_URI`          | (your Atlas URI from Step 2)                     |
| `GROQ_API_KEY`       | `gsk_...`                                        |
| `GROQ_MODEL`         | `llama-3.3-70b-versatile`                        |
| `HF_TOKEN`           | `hf_...`                                         |
| `EMBEDDING_MODEL`    | `BAAI/bge-small-en-v1.5`                         |
| `EMBEDDING_DIM`      | `384`                                            |
| `TOP_K`              | `6`                                              |
| `CHUNK_SIZE`         | `900`                                            |
| `CHUNK_OVERLAP`      | `150`                                            |
| `CLIENT_URL`         | *(leave blank for now — we'll set it in Step 5)* |
| `ELEVENLABS_API_KEY` | *(optional — paste if you got one)*              |

6. Click **Create Web Service**
7. Wait for the first build (~3 minutes). You'll see logs. When you see:
   ```
    MongoDB connected: cluster0.xxxxx.mongodb.net/ai-notebook
    AI Notebook backend running on :10000
   ```
   your backend is live.
8. Copy the public URL — something like
   `https://nexus-backend-xxxx.onrender.com`
9. Test it: visit `https://nexus-backend-xxxx.onrender.com/api/health`.
   You should see `{"status":"ok",...}`.

> **Free tier cold starts**: Render's free web services sleep after 15
> minutes of inactivity. The next request wakes them in ~30 seconds. For a
> personal tool this is fine. To avoid it, upgrade to Starter ($7/month)
> or hit `/api/health` every 10 minutes from an uptime monitor.

---

## Step 4 — Vercel (frontend, 3 minutes)

1. Go to https://vercel.com and sign up (GitHub recommended)
2. Click **Add New...** → **Project**
3. Import your repo
4. Configure:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `frontend` (click **Edit** to change it)
   - **Build Command**, **Output Directory**: leave defaults
5. Expand **Environment Variables** and add:

| Key                   | Value                                            |
| --------------------- | ------------------------------------------------ |
| `NEXT_PUBLIC_API_URL` | `https://nexus-backend-xxxx.onrender.com`        |

   (Use the URL from Step 3, **no trailing slash**.)
6. Click **Deploy**
7. ~2 minutes later you'll get a live URL like
   `https://nexus-abc123.vercel.app`. Open it — the UI should load.

---

## Step 5 — Wire backend CORS to your Vercel URL

Right now the backend doesn't know about your Vercel domain, so the
browser will block requests. Fix it:

1. Go to Render → your backend service → **Environment**
2. Set `CLIENT_URL` to your Vercel URL:
   `https://nexus-abc123.vercel.app`
3. Save. Render will auto-redeploy in ~1 min.

After it redeploys, reload the Vercel site. Everything should work.

---

## Step 6 — Smoke test

1. Open your Vercel URL
2. Sidebar → upload a PDF or text file (sample: any research paper ~5-20
   pages works great)
3. Wait 20-30 seconds for the first upload — HuggingFace is warming up
   the embedding model. Subsequent uploads are fast.
4. Once the document shows **ready** status, click **Chat** in the sidebar
   and ask something about it.
5. Click the speaker icon on the response — browser TTS should play.
6. Top-right gear → Voice settings → if you set `ELEVENLABS_API_KEY`, you
   can switch to **Premium** and hear the difference.

---

## Deployment troubleshooting

**Backend builds but crashes on start**
Check the Render logs for `MONGO_URI` errors. Most common cause: Atlas
password has special characters that weren't URL-encoded. Regenerate the
password with alphanumeric-only and try again.

**Frontend loads but all API calls fail with "Network Error"**
Usually CORS — either `CLIENT_URL` on Render doesn't match your Vercel
URL exactly, or you included a trailing slash. Remove trailing slashes
on both sides.

**First upload takes 30+ seconds**
Normal. HuggingFace's serverless inference API loads the embedding model
on first use. Subsequent requests are fast (100-300ms per batch).

**ElevenLabs returns 401**
Key is wrong or your free quota is exhausted (10k chars/month). Check
https://elevenlabs.io/app/settings/api-keys.

**Free tier feels slow**
Render free instances sleep after 15 min idle. First request after sleep
takes ~30s to wake. Either accept it, or add a free uptime monitor like
uptimerobot.com to ping `/api/health` every 10 minutes.

---

## Custom domains (optional, free)

**Vercel**: project → **Settings** → **Domains** → add your domain. If
you have one on Cloudflare/Namecheap, follow the DNS instructions — free
automatic SSL.

**Render**: service → **Settings** → **Custom Domain**. Same flow, free
SSL via Let's Encrypt.

After adding a custom frontend domain, **update `CLIENT_URL` on Render**
to the new origin.

---

## Total cost

If you stay on free tiers:
- Render free: $0
- Vercel Hobby: $0
- Atlas M0: $0
- Groq free tier: $0
- HuggingFace free tier: $0
- ElevenLabs free tier: $0 (10k chars/mo)

Total: **$0/month**, no credit card required anywhere in this stack.
