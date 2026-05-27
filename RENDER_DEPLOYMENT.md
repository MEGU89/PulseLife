# Render Deployment Guide

This repo is set up to deploy on Render as two separate services:

- `pulselife-api` for the Express backend
- `pulselife-web` for the Next.js frontend

The Blueprint file is [render.yaml](./render.yaml).

## Before you start

You need:

- a GitHub, GitLab, or Bitbucket repo with this code pushed
- a MongoDB Atlas connection string
- your Render account

## 1. Push this repo

Render deploys from a Git provider, so make sure the latest code is in your remote repository.

## 2. Create services from the Blueprint

1. In Render, click `New` -> `Blueprint`.
2. Connect the repository that contains this project.
3. Render will detect [render.yaml](./render.yaml) and propose two services:
   - `pulselife-api`
   - `pulselife-web`
4. Continue and create them.

## 3. Fill the required environment variables

After Render creates the services, set these values:

### Backend: `pulselife-api`

- `MONGO_URI` = your MongoDB Atlas connection string
- `FRONTEND_URL` = your frontend Render URL, for example `https://pulselife-web.onrender.com`

Optional backend variables:

- `EMAIL_USER`
- `EMAIL_PASS`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_PHONE_NUMBER`

`JWT_SECRET` is generated automatically by the Blueprint.

### Frontend: `pulselife-web`

- `NEXT_PUBLIC_API_URL` = your backend Render URL, for example `https://pulselife-api.onrender.com`

## 4. Redeploy once URLs are set

Because the frontend and backend need each other's public URLs, do one manual redeploy for both services after you save:

- `FRONTEND_URL` on `pulselife-api`
- `NEXT_PUBLIC_API_URL` on `pulselife-web`

## 5. Open the app

Use the frontend service URL from Render. The backend health check is:

```text
https://your-backend-name.onrender.com/health
```

## Service settings used

These settings match Render's current docs for Node web services and monorepos:

- `rootDir` is used so frontend and backend deploy independently
- backend health check path is `/health`
- frontend runs as a Next.js Node web service
- backend runs as an Express Node web service

## Notes

- Free Render services can sleep after inactivity, so the first request may be slow.
- If you later add a custom domain, update `FRONTEND_URL` to that public frontend URL.
- If you want multiple frontend origins allowed, set `FRONTEND_URLS` on the backend as a comma-separated list.
