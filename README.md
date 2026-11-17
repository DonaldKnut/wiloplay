# Wiloplay

Wiloplay is a music discovery and artist community app built with Next.js, NestJS, PostgreSQL, and Prisma. It includes Deezer preview search, listener accounts, artist profiles, audio uploads, live event listings, and ticket reservations.

## Run locally

Requirements: Node.js 20.9 or later and npm.

1. Start PostgreSQL and copy `apps/api/.env.example` to `apps/api/.env`. Set `DATABASE_URL` to your PostgreSQL connection string and replace `JWT_SECRET` with a long random value.
2. The local `.env.example` enables `PAYMENT_MODE="demo"` for testing ticket checkout without collecting money, contacting Paystack, or sending ticket emails. Demo tickets are clearly labeled and do not count as revenue. Demo mode is disabled when `NODE_ENV=production`. To accept real payments, set `PAYMENT_MODE="paystack"`, configure `PAYSTACK_SECRET_KEY`, enable Dedicated Virtual Accounts for the Paystack business, and configure the webhook URL as `https://<your-api-host>/payments/paystack/webhook`. Set `ADMIN_EMAILS` to a comma-separated allowlist of staff email addresses authorized to approve artist payouts. Configure SMTP to send email verification codes, ticket QR codes, and event updates. For optional AI tools, set `OPENAI_API_KEY`; audio processing also requires `AUPHONIC_API_KEY` and an Auphonic `AUPHONIC_PRESET`.
3. From the repository root, install dependencies, apply the Prisma schema to PostgreSQL, and start both apps:

   ```powershell
   npm install
   npm run db:push
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000). The API runs on [http://localhost:4000](http://localhost:4000).

Artist audio files are stored under `apps/api/uploads/`; use durable object storage and HTTPS for production.
The database provider is now PostgreSQL. Existing records in the previous local SQLite `apps/api/prisma/dev.db` are not copied automatically; back up and migrate that data before switching an existing installation.

## Features

- Verify the account email with a six-digit, expiring code during sign-up. Unverified users who log in or sign up again with the same password continue into verification and can resend a code. Forgot-password / reset-password codes also prove email ownership and sign the user in.
- Follow artist profiles and view follower counts, qualified listens, popular tracks, and listener-shared city trends. A listen is recorded once per playback after 120 seconds; city sharing is optional, and artist payouts are not enabled.
- Search Deezer's public catalog through the API and play the 30-second previews Deezer provides.
- Browse Deezer's current top tracks, artists, and albums from the home page.
- Open a chart artist's profile and preview their top tracks.
- Continue listening with a randomly selected playable track when the current track ends.
- Upload singles or multi-track albums with JPG, PNG, or WebP cover art and a selectable genre; manage, edit, delete, and share releases on WhatsApp, Facebook, or X.
- Request editable title, genre, and description suggestions or generate replacement cover art with OpenAI; start Auphonic processing on an artist's request and preview its output without replacing the original audio.
- Create ticket categories with independent prices and inventory, then share event links on TikTok, WhatsApp, Instagram, and X/Twitter.
- Automatically provision a Paystack virtual account after an administrator verifies an artist.
- Collect ticket payments through order-specific Paystack virtual accounts, verify signed webhooks against Paystack's transaction API, and issue one-time QR tickets only after the exact NGN amount is confirmed.
- View and download ticket QR codes, check in attendees from the artist dashboard, and email updates to paid ticket holders.
- See a live countdown to each show. Past shows and their tickets leave the active lists at showtime; ticket and payment records are retained.
- Responsive discovery home, mood search, and a persistent audio player.

Event prices are entered and displayed in Nigerian naira; amounts are stored and sent to Paystack in kobo. Each order includes the existing 10% Wiloplay fee in its exact transfer amount. Email verification and password-reset codes expire after 10 minutes, can be resent after one minute, and allow five attempts. New passwords require at least eight characters with a letter and a number. Separately, artist payout approval is restricted to emails in `ADMIN_EMAILS`; call `POST /payments/artists/:artistId/verify` as an allowlisted administrator. Email verification codes, ticket QR emails, and event updates require valid SMTP settings; tickets remain accessible in the user's account if email delivery fails. Paystack, SMTP, OpenAI, and Auphonic may charge for use. Keep provider keys server-side in `apps/api/.env`. Deezer preview availability and usage are governed by Deezer's API terms.

## API routes

The API root (`/`) returns service status and links to the health check and documentation. Swagger UI is available at `/docs`, with the generated OpenAPI JSON at `/docs-json`.

| Method | Route | Access |
| --- | --- | --- |
| `GET` | `/` | Public; API status and documentation links |
| `GET` | `/health` | Public; API process health |
| `GET` | `/docs` | Public; interactive Swagger UI |
| `GET` | `/docs-json` | Public; OpenAPI specification |
| `POST` | `/auth/signup` | Public; creates an account and emails a six-digit verification code; unverified accounts continue verification |
| `POST` | `/auth/login` | Public; sends a verification code if the email is not verified |
| `POST` | `/auth/resend-email-verification` | Public; `email` + `password`; resends a verification code |
| `POST` | `/auth/request-email-verification` | Signed in; requests a code for legacy sessions |
| `POST` | `/auth/verify-email` | Public; accepts `email` and the six-digit `code` |
| `POST` | `/auth/forgot-password` | Public; emails a reset code when the account exists |
| `POST` | `/auth/reset-password` | Public; `email`, `code`, and new `password`; verifies email if needed and signs in |
| `POST` | `/auth/become-artist` | Signed in with a verified email |
| `GET` | `/search?q=afrobeats` | Public; unified Wiloplay tracks, artists, shows, and Deezer preview matches |
| `GET` | `/deezer/search?q=indie` | Public |
| `GET` | `/deezer/chart` | Public; returns top tracks, artists, and albums |
| `GET` | `/deezer/artists/:id` | Public; artist details and top tracks with previews |
| `GET` | `/tracks` | Public |
| `GET` | `/tracks/:id` | Public; shareable track details |
| `POST` | `/tracks/:id/listens` | Signed in; records one qualified playback with `playbackId` and optional listener-shared `city` |
| `DELETE` | `/tracks/listens/location` | Signed in; removes the listener's city labels from past plays |
| `GET` | `/tracks/mine` | Artist |
| `POST` | `/tracks/upload` | Artist; multipart `artistName`, `genre`, `releaseType`, audio `files`, and cover; `title` for singles or `albumTitle` for albums |
| `PATCH` | `/tracks/:id` | Artist; update owned track metadata |
| `DELETE` | `/tracks/:id` | Artist; delete owned track |
| `GET` | `/tracks/ai/config` | Artist; reports whether OpenAI and Auphonic are configured |
| `POST` | `/tracks/:id/ai/suggest` | Artist; generates editable metadata suggestions with OpenAI |
| `POST` | `/tracks/:id/ai/cover` | Artist; generates and saves replacement cover art with OpenAI |
| `POST` | `/tracks/:id/enhancement` | Artist; submits the original audio to Auphonic using the configured preset |
| `GET` | `/tracks/:id/enhancement` | Artist; checks processing and downloads a completed supported output |
| `GET` | `/events` | Public |
| `POST` | `/events` | Artist; event fields, JSON `ticketCategories` (name, price in kobo, capacity), and optional multipart `cover` image |
| `PATCH` | `/events/:id/capacity` | Artist; JSON `{ "additionalTickets": 50 }` |
| `POST` | `/events/:id/notify` | Artist; JSON `{ "message": "Doors open at 7 PM." }`; emails paid ticket holders |
| `POST` | `/events/:id/tickets` | Signed in; JSON `{ "quantity": 1, "categoryId": "..." }` (categoryId optional for the Regular tier) |
| `GET` | `/events/mine` | Artist |
| `GET` | `/events/my-tickets` | Signed in |
| `GET` | `/artists/:id` | Public; artist profile, follower/listen totals, top tracks, and aggregated shared-city trends |
| `GET` | `/artists/:id/follow` | Signed in; reports whether the listener follows the artist |
| `PUT` | `/artists/:id/follow` | Signed in; follow an artist |
| `DELETE` | `/artists/:id/follow` | Signed in; unfollow an artist |
| `GET` | `/payments/artist-bank-account` | Verified artist; returns the provisioned account details |
| `POST` | `/payments/artists/:artistId/verify` | Signed in as an email in `ADMIN_EMAILS`; verifies and provisions an artist account |
| `POST` | `/payments/paystack/webhook` | Public; validates Paystack's `x-paystack-signature` and transaction status |
| `POST` | `/events/:id/check-in` | Event artist; JSON `{ "code": "ticket-code" }` |
