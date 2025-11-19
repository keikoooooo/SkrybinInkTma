# Telegram Mini App Deployment Guide

## 1. Prepare Infrastructure
- **Database**: Install PostgreSQL ≥ 14 and create a database, e.g. `skryabin_ink`.
  ```bash
  createdb skryabin_ink
  psql -d skryabin_ink -f database/schema.sql
  ```
- **Backend**: Inside `server/`, install dependencies and configure environment variables.
  ```bash   
  cd server
  npm install
  cp .env.example .env   # fill in DATABASE_URL, BOT_TOKEN, CORS_ORIGIN, PORT
  npm run dev            # local development
  npm run build && npm start  # production
  ```
- **Frontend**: Set API base URL for the mini app.
  ```bash
  cd ..
  echo "VITE_API_BASE_URL=https://api.your-domain" > .env
  npm install
  npm run build
  ```

## 2. Configure Telegram Bot
1. Create a bot via [@BotFather](https://t.me/BotFather) and note the token (use it in backend `.env`).
2. In BotFather command `/mybots` → your bot → **Bot Settings** → **Menu Button** → **Web App** → paste the HTTPS URL of the deployed frontend (e.g. `https://ink.example.com`).
3. Optionally add a `start_param` to deep-link specific sections: `https://t.me/your_bot?startapp=profile`.

## 3. Run Locally in Telegram
- Expose both frontend and backend via HTTPS tunnels (e.g. `cloudflared`, `ngrok`).
- Update `.env` files so URLs point to tunnel domains.
- Open bot in Telegram → tap menu button → mini app loads inside webview.

## 4. Validate Telegram Session
- Frontend hook `useTelegram` sends `initData` to `/api/session`.
- Backend verifies signature and upserts user in `users` table.
- Use Postgres logs or pgAdmin to confirm rows appear:
  ```sql
  SELECT id, username, first_name FROM users ORDER BY created_at DESC LIMIT 5;
  ```

## 5. Deploy to Production
- Host backend (e.g. Render, Railway, Fly.io, VPS). Ensure `.env` has production DB URL and `CORS_ORIGIN=https://your-frontend`.
- Host frontend (Vercel, Netlify, S3+CloudFront). Upload `dist/` contents.
- Update BotFather Web App URL to production domain.
- Test on iOS/Android Telegram clients.

## 6. Optional Enhancements
- Implement additional endpoints (orders CRUD, reviews) using the same Express server.
- Secure admin routes (e.g. check `users.role = 'admin'`).
- Integrate Telegram Payments for deposits.
- Log mini app events via `Telegram.WebApp.onEvent` and store analytics in `notifications` table.





