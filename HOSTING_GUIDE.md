# Hosting MonoNote on Render.com

MonoNote is designed as a lightweight Single Page Application (SPA). Since it uses `esm.sh` for dependencies and requires no build step, it is incredibly easy to host as a "Static Site" on Render.com.

## Prerequisites

1. A GitHub or GitLab repository containing this project code.
2. A Render.com account.

## Step-by-Step Guide

1. **Push to GitHub/GitLab**
   - Ensure your project files (`index.html`, `index.tsx`, etc.) are in the root of your repository.

2. **Create New Static Site on Render**
   - Go to your Render Dashboard.
   - Click **New +** and select **Static Site**.
   - Connect your GitHub/GitLab repository.

3. **Configure Settings**
   - **Name**: Choose a name (e.g., `my-mononote`).
   - **Branch**: `main` (or master).
   - **Root Directory**: `.` (Leave as default).
   - **Build Command**: `(empty)` (Clear this field if it has a default, or leave blank).
   - **Publish Directory**: `.` (This is crucial. Since there is no `dist` folder, we serve the root).

4. **Rewrite Rules (Important for SPA)**
   - Scroll down to **Redirects/Rewrites**.
   - Add a Rewrite Rule to ensure refreshing pages works (handling React Router):
     - **Source**: `/*`
     - **Destination**: `/index.html`
     - **Action**: `Rewrite`

5. **Deploy**
   - Click **Create Static Site**.
   - Render will deploy your site in seconds.

## Custom Domain (Optional)

1. In the Render dashboard for your site, go to **Settings**.
2. Scroll to **Custom Domains**.
3. Add your domain (e.g., `mononote.mywebsite.com`) and follow the DNS verification steps.

## Developer Note

To change the branding or domain hint shown in the app:
1. Open `config.ts`.
2. Update `APP_NAME`, `DOMAIN`, and `APP_TAGLINE`.
3. Push changes to your repository. Render will auto-deploy.
