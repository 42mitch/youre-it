# You're It 🏷️

A real-time tag tracking PWA for your friend group. Whoever accumulates the most time as "it" loses.

## Tech Stack

- **Frontend**: React + TypeScript + Tailwind CSS + Vite (PWA)
- **Database**: Firebase Firestore (real-time sync)
- **Notifications**: Firebase Cloud Messaging (FCM)
- **Backend**: .NET 8 Azure Functions (sends push notifications)

---

## Project Structure

```
youre-it/
├── frontend/          # React PWA
└── backend/
    └── YoureItFunctions/   # .NET Azure Function
```

---

## Setup

### 1. Clone & install frontend

```bash
cd frontend
npm install
```

### 2. Add environment variables

Copy `.env.local` — it already has your Firebase config filled in. After deploying the backend, update `VITE_API_URL` with your Azure Function URL.

### 3. Add Firebase service account key

Place your downloaded `tag-game-6c568-firebase-adminsdk-...json` file into:

```
backend/YoureItFunctions/serviceAccountKey.json
```

This file is gitignored — never commit it.

### 4. Run frontend locally

```bash
cd frontend
npm run dev
```

### 5. Run backend locally

Install [Azure Functions Core Tools](https://learn.microsoft.com/en-us/azure/azure-functions/functions-run-local) and the .NET 8 SDK, then:

```bash
cd backend/YoureItFunctions
func start
```

---

## Deployment

### Frontend → Vercel (or Azure Static Web Apps)

**Vercel (recommended — free):**
1. Push to GitHub
2. Go to [vercel.com](https://vercel.com) → Import project
3. Set root directory to `frontend`
4. Add all `VITE_*` env variables from `.env.local`
5. Deploy

**Azure Static Web Apps:**
- Same process as your last project, set root to `frontend`

### Backend → Azure Functions

1. In Azure Portal → Create a resource → Function App
2. Runtime: .NET 8, OS: Linux, Plan: **Consumption (Serverless)** — this is free
3. After creation, go to the Function App → Configuration → Add these app settings:
   - No extra settings needed beyond defaults — the service account key is uploaded separately
4. Deploy via VS Code Azure Functions extension or GitHub Actions
5. Upload `serviceAccountKey.json` via Kudu (Advanced Tools) to `site/wwwroot/`
6. Copy the Function URL and paste it into your frontend `.env.local` as `VITE_API_URL`

---

## Game Rules Enforced in App

- ✅ Cumulative time tracking (millisecond precision)
- ✅ No tag-backs (can't tag the person who just tagged you)
- ✅ Full timestamp log for every transfer
- ✅ Push notifications to all players on every tag
- ✅ Real-time sync across all devices

## iPhone Users

To receive push notifications on iPhone:
1. Open the site in Safari
2. Tap the Share button → **Add to Home Screen**
3. Open the app from your Home Screen
4. Tap **Enable Notifications** in the Players tab

---

## Adding Players

Go to the **Players** tab → add each person with a name and emoji → each person taps "me?" next to their name on their own device → enable notifications.

## Starting a Game

In the **Players** tab → select who starts as "it" → tap **Start Game**.