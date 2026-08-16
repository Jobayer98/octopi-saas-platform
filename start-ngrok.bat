@echo off
echo Starting ngrok tunnel for backend on port 4000...
echo.
echo After ngrok starts:
echo  1. Copy the https URL (e.g. https://xxxx.ngrok-free.app)
echo  2. In a NEW terminal run:
echo     stripe listen --forward-to https://YOUR_NGROK_URL/api/v1/webhooks/stripe
echo  3. Copy the whsec_... printed by stripe listen into backend/.env as STRIPE_WEBHOOK_SECRET
echo  4. Restart the backend (npm run dev)
echo.
echo NOTE: Use the whsec from 'stripe listen' output, NOT from Stripe dashboard.
echo.
ngrok http 4000
