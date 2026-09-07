# StayFinder

## Overview

StayFinder is a full-stack accommodation rental platform built with Node.js, Express, MongoDB, and EJS. Users can browse listings, make booking requests, leave reviews, message hosts, and use AI-powered features to discover properties.

## Problem Statement

Finding the right accommodation is often tedious — filtering through dozens of listings with rigid search forms. StayFinder simplifies this with natural language search, AI-powered recommendations, review summaries, and a helpful assistant, all while keeping the core booking and hosting workflow simple and reliable.

## Features

### Core Platform
- **User Authentication** — Passport-Local-Mongoose signup/login/logout with session management
- **Listing Management** — CRUD operations with Cloudinary image uploads, ownership enforcement
- **Search & Filtering** — Keyword search, price range, guest capacity, sorting, pagination
- **Booking System** — Date validation, overlap detection, host approval workflow, renter cancellation
- **Reviews & Ratings** — Star ratings, duplicate prevention, rating distribution
- **Messaging** — Host ↔ renter messaging with notifications and unread counts
- **Notifications** — Persistent notifications for bookings and messages
- **User Profiles** — Editable profiles with field whitelisting and URL validation
- **Dashboard** — Overview of bookings, listings, requests, and unread counts
- **Wishlist** — Save/remove favorite listings

### AI-Powered Features
- **Natural Language Search** — "I need a cheap place in Hyderabad for 4 people"
- **Property Recommendations** — Personalized scoring with AI explanations
- **AI Review Summary** — Summarize guest reviews (positive/negative themes)
- **Property Comparison** — Side-by-side comparison with AI insights
- **StayFinder Assistant** — Intent-based Q&A about real listings

### Maps
- **Leaflet + OpenStreetMap** — Free, no-API-key maps with property markers

## Technology Stack

- **Runtime:** Node.js 22
- **Framework:** Express 5
- **Database:** MongoDB with Mongoose 8
- **Auth:** Passport.js + passport-local-mongoose
- **Templates:** EJS + ejs-mate
- **Images:** Cloudinary + Multer
- **Maps:** Leaflet + OpenStreetMap (free, no API key)
- **AI:** OpenAI-compatible provider abstraction with deterministic fallback
- **Testing:** Node.js built-in test runner

## Architecture

```
app.js                 → Entry point, middleware, route mounting
cloudConfig.js         → Cloudinary configuration
midlewares.js          → Auth & authorization middleware
controllers/           → Business logic (listing, booking, user, message, notification, ai)
models/                → Mongoose schemas (listing, booking, user, message, notification, review, wishlist)
routes/                → Express route definitions
views/                 → EJS templates (listings, bookings, users, messages, notifications, ai)
public/                → Static assets (CSS, JS)
utils/                 → ExpressError, wrapAsync, aiService
init/                  → Database seed script
tests/                 → Automated tests
```

## Authentication

- Passport-Local-Mongoose handles password hashing (hash + salt fields)
- Session-based authentication with express-session
- `isLoggedin` middleware protects authenticated routes
- `isOwner` middleware enforces listing ownership
- `isReviewOwner` middleware enforces review ownership
- Session secret from `SESSION_SECRET` env var (fallback for dev only)

## Listing Management

- Create, read, update, delete listings
- Image upload via Multer → Cloudinary
- Ownership enforced on edit/delete
- Deletion cascades to reviews and bookings
- Optional latitude/longitude for map display

## Search & Filtering

- Keyword search across title, location, country, description (escaped regex)
- Price min/max filters (validated positive numbers)
- Guest capacity filter (`maxGuests >= requested`)
- Sort whitelist: newest, oldest, price_asc, price_desc
- Pagination with page/limit

## Booking System

- Renter selects dates and guests
- Backend validates: check-in not in past, check-out after check-in, guests within maxGuests
- Overlap detection blocks conflicting pending/confirmed bookings
- Cancelled bookings do NOT block dates
- Owner cannot book own listing
- Total price = nights × price per night

## Availability

- Blocked dates shown on listing detail page
- Half-open interval: [checkIn, checkOut)
- Frontend date picker respects blocked ranges
- Backend is authoritative; frontend is UX only

## Host Approval

- Hosts view booking requests for their listings
- Accept or reject pending bookings
- Accept checks for overlapping bookings (race condition protection)
- Notifications sent to renter on accept/reject

## Notifications

- Persistent MongoDB notifications
- Types: new_booking_request, booking_accepted, booking_rejected, booking_cancelled, new_message
- Unread count in navbar (scoped to current user)
- Mark as read / mark all as read
- Notification failures never undo the main operation

## Reviews & Ratings

- Authenticated users can review (1-5 rating + comment)
- Duplicate review prevention (one review per user per listing)
- Review owner can delete their review
- Average rating calculated from populated reviews
- Rating distribution display

## User Profiles

- Editable: displayName, bio, location, profileImage
- Field whitelist — username/email/auth fields never touched
- profileImage validated as http(s) URL only (no javascript: URLs)
- Server-side length limits enforced

## Messaging

- Renter ↔ host messaging about a listing
- Recipient derived securely from listing owner (never trusted from form)
- Hosts can open specific renter threads (verified against booking/message participation)
- Self-messaging prevented
- Unread count per conversation
- Messages scoped: users cannot read others' conversations

## Maps

- Leaflet + OpenStreetMap (free, no API key required)
- Optional latitude/longitude on listings
- Map shown only when coordinates exist
- Graceful fallback when coordinates unavailable
- Marker with property popup

## Payment-ready Architecture

- Booking model includes: `paymentStatus` (pending/paid/failed/refunded), `paymentMethod`, `paymentReference`
- No real payment processing implemented
- Ready for Stripe/Razorpay integration
- **No card numbers, CVV, or bank passwords are collected or stored**

## AI Architecture

- Clean provider abstraction in `utils/aiService.js`
- Uses real LLM when `AI_PROVIDER` + `AI_API_KEY` are configured
- Deterministic fallback when no provider exists (clearly labeled, NOT generative AI)
- AI never invents properties, reviews, or factual values
- All AI outputs reference real MongoDB data
- API key never exposed to frontend

## AI Natural Language Search

- Parses queries like "cheap beach house in Goa for 3 people"
- Extracts: location, guest count, price preference, keywords
- Searches real Listing collection with structured MongoDB query
- Falls back to rule-based parser when no LLM configured

## AI Recommendations

- Scores listings by rating signal + review count
- Personalizes for logged-in users (excludes seen/wishlisted)
- AI explains why properties are recommended (when LLM configured)

## AI Review Summaries

- Summarizes positive/negative themes from real reviews
- Minimum 2 reviews required
- Keyword/frequency fallback when no LLM

## Property Comparison

- Compare 2-4 selected listings
- Shows real database values: price, location, guests, rating, reviews
- Optional AI explanation

## StayFinder Assistant

- Intent-based Q&A about real listings
- Recognizes: guest capacity, budget, best-rated, location queries
- Controlled server-side operations only — no arbitrary MongoDB queries
- Falls back to natural language search

## Security

- IDOR prevention: all resources verified against authenticated user
- Authorization middleware on all protected routes
- Mass assignment prevention: explicit field whitelists
- MongoDB query injection prevention: escaped regex, validated ObjectIds
- XSS prevention: EJS auto-escapes output
- Session security: httpOnly, secure in production, sameSite=lax
- No secrets exposed to frontend or error pages
- Profile image URL validation (http/https only)

## Testing

- 29 automated tests using Node.js built-in test runner
- Run: `npm test`
- Tests cover: booking date validation, overlap detection, guest capacity, profile field whitelist, search filtering, AI fallback logic

## Environment Variables

```env
ATLASDB_URL=          # MongoDB connection string
CLOUD_NAME=           # Cloudinary cloud name
CLOUD_API_KEY=        # Cloudinary API key
CLOUD_API_SECRET=     # Cloudinary API secret
SESSION_SECRET=       # Session encryption secret
AI_PROVIDER=          # AI provider (e.g. "openai") — leave blank for fallback
AI_API_KEY=           # AI API key
AI_MODEL=             # AI model name (default: gpt-4o-mini)
NODE_ENV=             # development / production
```

## Installation

1. Clone the repository:
```bash
git clone <repo-url>
cd major_project
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file (see `.env.example` for variable names)

4. Start MongoDB locally or set `ATLASDB_URL`

5. (Optional) Seed sample data:
```bash
node init/index.js
```

## Running Locally

```bash
npm run dev    # with nodemon
# or
npm start      # node app.js
```

Open: http://localhost:8080

## Project Structure

```
├── app.js                    # Application entry point
├── cloudConfig.js            # Cloudinary config
├── midlewares.js             # Auth middleware
├── package.json
├── .env.example              # Environment variable names
├── .gitignore
├── controllers/
│   ├── listing.js
│   ├── booking.js
│   ├── user.js
│   ├── message.js
│   ├── notification.js
│   ├── reviews.js
│   ├── dashboard.js
│   ├── wishlist.js
│   └── ai.js
├── models/
│   ├── listing.js
│   ├── booking.js
│   ├── user.js
│   ├── message.js
│   ├── notification.js
│   ├── reviews.js
│   └── wishlist.js
├── routes/
│   ├── listing.js
│   ├── booking.js
│   ├── user.js
│   ├── review.js
│   ├── message.js
│   ├── notification.js
│   ├── wishlist.js
│   └── ai.js
├── views/
│   ├── listings/
│   ├── bookings/
│   ├── users/
│   ├── messages/
│   ├── notifications/
│   ├── wishlist/
│   ├── dashboard/
│   ├── includes/
│   ├── layouts/
│   └── ai/
├── public/
│   ├── css/
│   └── js/
├── utils/
│   ├── ExpressError.js
│   ├── wrapAsync.js
│   └── aiService.js
├── init/
│   ├── index.js
│   └── data.js
└── tests/
    ├── aiService.test.js
    └── booking.test.js
```

## Future Improvements

- Real payment integration (Stripe/Razorpay)
- WebSocket-based real-time messaging
- Email notifications
- Advanced map features (geocoding, area search)
- Multi-language support
- Mobile app

---

## Known Limitations

- AI features use deterministic fallback when no LLM provider is configured (clearly labeled)
- No real payment processing (payment fields are architecture-ready)
- Maps require manual coordinate entry (no geocoding)
- No WebSocket messaging (HTTP polling only)

## Contact

Created by **jaka sai charan**.