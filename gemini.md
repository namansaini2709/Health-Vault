# HealthVault — Nearby Doctor Discovery & Appointment Feature (Premium)
**Document:** Implementation Guide & Developer Spec  
**Feature owner:** HealthVault Product / Engineering  
**Version:** 1.0  
**Date:** 2025-10-12

---

## Summary / Purpose

This document describes a complete implementation plan for the **Nearby Doctor Discovery & Appointment** feature for **HealthVault**.  
**Important:** **This feature MUST ONLY be available to Premium accounts.** Non-premium users will see a gated UI and a CTA to upgrade.

The feature allows users to:
- Scan a configurable radius (default **10 km**) around their current or selected location.
- Discover nearby doctors/clinics filtered by **specialization**, **availability (open now)**, **distance**, **ratings**, and **consultation type** (in-person / telemedicine).
- View detailed place information (address, phone, website, opening hours), mapped pins, and available booking links.
- Book appointments through: (A) external scheduling links (e.g., clinic website, Google Business appointment links), (B) integrated third-party scheduling APIs (Practo, Zocdoc, Lybrate) if partnerships exist, or (C) HealthVault's own scheduling system for verified doctors.
- On successful booking, store appointment details **encrypted** in the user's HealthVault (appointments category).
- Provide notifications and reminders; sync with user calendar (optional).

---

## Table of Contents

1. Product Rules & Premium Gating  
2. High-level Architecture  
3. Data Model & Database Schema (Postgres + PostGIS)  
4. Backend API Endpoints (spec)  
5. Google Maps / Places Integration (detailed)  
6. Frontend UX & Component Flow (ShadCN + VaultOS)  
7. Booking Integrations & Strategies  
8. Security, Privacy & Compliance (E2E encryption)  
9. Rate Limiting, Caching & Cost Controls  
10. Billing & Feature Gating (Premium enforcement)  
11. Monitoring, Analytics & Logging  
12. Testing Strategy & QA  
13. Qwen CLI and Gemini CLI — Prompts & Automation Recipes  
14. Deployment Checklist & Environment Variables  
15. Appendix: Example Code Snippets

---

## 1. Product Rules & Premium Gating

- **Feature entitlement:** Only users with `account.tier === 'premium'` or `entitlements.nearby_doctors === true` may use this feature.
- **UI behavior for non-premium:**
  - Show a locked card in the main menu ("Nearby Doctors — Premium") with short benefits and `Upgrade` CTA.
  - Allow a single demo scan (optional) limited to 3 results and without detailed contact info, to showcase feature value.
- **Billing considerations:**
  - Use a feature-flag toggle (LaunchDarkly / simple DB flag) to enable/disable the feature for specific markets.
  - Billing must reflect usage caps (e.g., premium tiers have X scans/month).
- **Privacy notice:** When premium user enables location sharing, show explicit consent modal describing what is shared and how long results will be cached.

---

## 2. High-level Architecture

```
[Mobile/Web Frontend (Vite + React + ShadCN + VaultOS)]
    ↕ HTTPS (JWT auth, user context)
[HealthVault API (Node.js/NestJS/Express)]
    ↕
[Business Logic: Doctors Service, Booking Service, Entitlements Service]
    ↕
[Database: PostgreSQL + PostGIS]  <-- Cached doctor snapshots
    ↕
[External APIs]
  - Google Places API / Maps JS (discovery)
  - Place Details API (opening_hours)
  - Third-party scheduler APIs (Practo/Zocdoc) OR direct clinic booking URLs
  - Notification providers (Twilio/SendGrid)
```

Key components:
- **Doctors Service**: queries Places API and internal cache, normalizes data, enforces premium checks.
- **Booking Service**: routes booking to third-party API or internal scheduler; records booking metadata in DB and encrypted vault.
- **Cache Layer**: Redis for Places result caching → reduce costs and avoid rate limits.
- **Entitlements**: middleware that enforces Premium gating and usage quotas.

---

## 3. Data Model & Database Schema

### Core tables (Postgres with PostGIS)

**doctors_cache** — cached Places results (for performance)
```sql
CREATE TABLE doctors_cache (
  id SERIAL PRIMARY KEY,
  place_id TEXT UNIQUE NOT NULL,          -- Google Place ID or internal id
  name TEXT NOT NULL,
  types TEXT[],                           -- e.g., ['doctor','hospital']
  specializations TEXT[],                 -- ['cardiologist','general practitioner']
  phone TEXT,
  website TEXT,
  address TEXT,
  location GEOGRAPHY(POINT, 4326),        -- longitude/latitude
  raw_json JSONB,                         -- original API payload
  last_fetched TIMESTAMP WITH TIME ZONE,
  verified BOOLEAN DEFAULT false
);
CREATE INDEX ON doctors_cache USING GIST (location);
```

**doctor_availability** — optional for verified doctors (internal scheduling)
```sql
CREATE TABLE doctor_availability (
  id SERIAL PRIMARY KEY,
  doctor_id INT REFERENCES doctors_cache(id) ON DELETE CASCADE,
  start_ts TIMESTAMP WITH TIME ZONE,
  end_ts TIMESTAMP WITH TIME ZONE,
  slot_length INT DEFAULT 30, -- minutes
  metadata JSONB
);
```

**appointments** — user bookings (encrypted payload stored in vault too)
```sql
CREATE TABLE appointments (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  doctor_place_id TEXT,               -- link to doctors_cache.place_id
  source TEXT,                        -- 'google_places' | 'practo' | 'healthvault_internal'
  external_booking_reference TEXT,
  start_ts TIMESTAMP WITH TIME ZONE,
  end_ts TIMESTAMP WITH TIME ZONE,
  status TEXT,                        -- 'booked','cancelled','completed'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**audit_logs** — for booking actions
```sql
CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
  user_id UUID,
  action TEXT,
  payload JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 4. Backend API Endpoints (Spec)

> All endpoints require authentication. Premium enforcement is handled via middleware `requirePremium`.

### Doctors / Discovery
- `GET /api/v1/doctors/nearby?lat={lat}&lng={lng}&radius=10000&specialization=cardiologist&open_now=true`
  - Response: `[{ place_id, name, distance_m, location: {lat,lng}, open_now, rating, address, phone (if premium user), place_details_url (if premium) }]`
  - Notes: For premium users, include phone/website. For non-premium, return limited info.

- `GET /api/v1/doctors/:place_id/details`
  - Response: detailed place info + cached hours + link to booking if available.

### Booking
- `POST /api/v1/bookings`
  - Body: `{ place_id, doctor_id?, start_ts, end_ts, source_preference? }`
  - Flow:
    1. Validate user entitlement (premium).
    2. If doctor has `healthvault_internal` availability, book internally.
    3. Else if `external_booking_url` exists, return redirect/booking token to front-end.
    4. Else attempt third-party API booking (if integrated).
  - Response: `{ booking_id, status, calendar_entry_url? }`

- `GET /api/v1/bookings/:id` — fetch booking status.

- `POST /api/v1/bookings/:id/cancel` — cancel booking (if allowed by source).

### Entitlements & Quotas
- `GET /api/v1/entitlements` — returns user tier and remaining scans/credits.
- `POST /api/v1/entitlements/purchase` — purchase scans/upgrades (linked to billing).

---

## 5. Google Maps / Places Integration (Detailed)

### APIs Used
- **Places Nearby Search**: `/maps/api/place/nearbysearch/json` — find places within radius.
- **Place Details**: `/maps/api/place/details/json` — fetch opening_hours, phone, website.
- **Maps JavaScript API**: for client-side maps visualization.
- **Geocoding**: for user-entered addresses.

### Example Nearby Search Request (server-side)
```js
const axios = require('axios');

async function fetchNearby(lat, lng, radius = 10000, keyword = '') {
  const params = {
    location: `${lat},${lng}`,
    radius,
    keyword,             // e.g., 'cardiologist'
    type: 'doctor|hospital|health',
    key: process.env.GOOGLE_MAPS_API_KEY,
  };
  const res = await axios.get('https://maps.googleapis.com/maps/api/place/nearbysearch/json', { params });
  return res.data; // results array
}
```

### Rate Limits & Quotas
- Monitor usage in Google Cloud Console.
- Use server-side proxy for API calls to hide API key and to centralize caching & billing.
- Implement exponential backoff on 429 errors.

---

## 6. Frontend UX & Component Flow (ShadCN + VaultOS)

### Access & Gating
- Entry: `Main Menu -> Nearby Doctors (Premium)` or Dashboard CTA.
- If user is non-premium: show locked card with benefits and `Upgrade` CTA.
- If premium: show full UI.

### Primary Screen Layout
- **Top bar:** search + specialization filter + radius selector (5/10/20 km) + "Use my location" button
- **Left pane (or top on mobile):** Map with markers & cluster support.
- **Right pane:** Scrollable list of DoctorCards sorted by distance / rating / open_now.
- **DoctorCard fields:**
  - Avatar/clinic icon
  - Name + Specialization
  - Distance (e.g., "3.4 km")
  - Rating / verified badge
  - Next available slot (if known)
  - Actions: `View Details`, `Book`, `Directions`

### Animations & Visuals
- Show rotating vault scan center while fetching (VaultOS `RotatingVault` component).
- Radial pulse representing 10 km radius; results populate as markers animate in.
- Booking modal uses `vault-unlock` animation on confirmation and "seal" animation on successful save to vault.

### Accessibility
- All map markers must be reachable via keyboard (list alternative).
- Provide textual list view for screen readers.

---

## 7. Booking Integrations & Strategies

### Option A — External Booking Link (Simple)
- Use `place.details.url` if clinics list booking link.
- Front-end opens external link in new tab.
- On redirect back (if your flow supports it), capture booking confirmation or ask user to confirm manual booking.

**Pros:** Fast to implement.  
**Cons:** No control over real-time availability; inconsistent UX.

### Option B — Third-Party Scheduling API (Medium)
- Partner with platforms (Practo, Lybrate, Zocdoc) that expose scheduling APIs.
- Use their API to fetch real slots and to book directly.
- Implement OAuth / API key integration per partner.

**Pros:** Real-time slots and unified booking experience.  
**Cons:** Requires partnerships and integration work; mapping doctors to providers may need matching logic.

### Option C — HealthVault Internal Scheduling (Best Long-Term)
- Invite/verify doctors to join HealthVault (provider portal).
- Doctors publish availability (doctor_availability).
- HealthVault manages booking & calendar sync.
- For doctors already in Places but not verified, allow a "Request to join" flow.

**Pros:** Full control, audit logs, encrypted appointment data.  
**Cons:** Requires operational effort to onboard providers.

---

## 8. Security, Privacy & Compliance

- **Location consent:** obtain explicit permission each time or store opt-in consent.
- **E2E encryption:** appointment details must be encrypted client-side before being persisted in the user’s vault (so HealthVault backend stores ciphertext).
  - Use per-user encryption keys stored in a secure KMS or derived from user credentials.
- **PII minimization:** store only essential contact info; never expose more than necessary in list results.
- **Logging:** redact PII in logs; use hashed identifiers.
- **Regulatory:** ensure compliance with HIPAA/GDPR as relevant — especially if storing appointment/PHI (coordinate with legal).
- **Secrets:** Google API keys should be only used server-side for requests that require billing; if using Maps JS on frontend, restrict HTTP referrers and use a separate key with limited scope.

---

## 9. Rate Limiting, Caching & Cost Controls

- **Cache Places results** in Redis for a geographic tile (e.g., geohash ± radius) for 6–24 hours. Use `place_id` as dedupe key.
- **Quota per user:** premium accounts may have limited scans/month (e.g., 500 scans). Enforce via entitlements API.
- **Global rate limit:** throttle server requests to Google per API key; queue requests if near quota.
- **Cost tracking:** emit metrics for API calls (Grafana/Prometheus) to monitor Google bill.

---

## 10. Billing & Feature Gating (Premium)

- Use `entitlements` table/ service to track:
  - `tier: 'free' | 'premium'`
  - `nearby_scans_remaining: int`
  - `scan_reset_at: timestamp`
- On each scan:
  1. Check `nearby_scans_remaining` > 0 for premium users.
  2. Decrement counter; record usage log.
- Allow purchasing additional scan packs via billing integration (Stripe).
- UI: show quota usage progress bar (e.g., "32 / 500 scans used").

---

## 11. Monitoring, Analytics & Logging

- **Event tracking:** Fire events for `nearby_search_initiated`, `nearby_search_result_count`, `booking_initiated`, `booking_completed`.
- **Errors:** capture via Sentry with redaction of PII.
- **Billing & Cost Analytics:** log API calls to Google Places with tags for region and user tier.
- **Uptime & Alerts:** monitor backend latency and errors; alert on quota exhaustion or increased 5xx rates.

---

## 12. Testing Strategy & QA

- **Unit tests:** for geospatial query generation, entitlement checks, and booking logic.
- **Integration tests:** mocking Google Places responses and verifying caching/normalization.
- **E2E tests (Playwright):** flows for premium user discovery + booking + vault storage.
- **Accessibility tests:** axe-core integration and keyboard-only workflows.
- **Load testing:** simulate concurrent searches to ensure rate limiting / queuing works.

---

## 13. Qwen CLI and Gemini CLI — Prompts & Automation Recipes

You mentioned you are using **Qwen CLI** and **Gemini CLI**. Below are recommended prompts and automation recipes for generating code scaffolding, API stubs, and frontend components using those CLIs. Customize prompts with your repo context.

### A — Qwen CLI (backend scaffolding prompts)
**Prompt: Generate Nearby Doctors API (Node.js + Express + Prisma + PostGIS)**
```
You are a backend engineer. Generate an Express.js route handler and Prisma schema for a Nearby Doctors feature that uses PostGIS geography points.
Include:
- Prisma schema for doctors_cache and doctor_availability.
- An Express route GET /api/v1/doctors/nearby that accepts lat, lng, radius, specialization, open_now and returns normalized results.
- Redis caching logic using geohash or bounding box.
- Example PostGIS SQL query for ST_DWithin and ST_Distance.
Output only the code files: prisma/schema.prisma, src/routes/doctors.js, src/services/doctorsService.js, and a README snippet explaining env vars.
```

### B — Gemini CLI (frontend scaffolding prompts)
**Prompt: Generate NearbyDoctors React component**
```
You are a frontend developer. Generate a React + TypeScript component set for Nearby Doctors integrated with @react-google-maps/api and ShadCN UI tokens.
Include:
- NearbyMap.tsx (loads map, shows markers, clusters).
- DoctorList.tsx (list view with DoctorCard).
- DoctorCard.tsx (props: doctor, onBook).
- useNearbyDoctors.ts (React Query hook calling /api/v1/doctors/nearby).
- A demo page NearbyPage.tsx that wires everything and handles premium gating UI.
Make sure to include accessible markup and example Tailwind classes using VaultOS tokens.
Output files only with code and minimal comments.
```

> **Tip:** For both CLIs, include `--context` pointing to your repo root and any existing schema files to improve code relevance.

---

## 14. Deployment Checklist & Environment Variables

### Required ENV variables
```
GOOGLE_MAPS_API_KEY=...
GOOGLE_PLACES_API_KEY=...
DATABASE_URL=postgres://...
REDIS_URL=redis://...
JWT_SECRET=...
STRIPE_SECRET_KEY=...
KMS_ENDPOINT=...
NOTIFICATION_API_KEY=...
```

### CI/CD Steps
1. Lint & test on PRs.
2. Deploy staging with feature flag ON for QA.
3. Smoke test: run E2E tests on staging after deploy.
4. Rollout to production with entitlements feature flag.

---

## 15. Appendix: Example Code Snippets

### Example server-side nearby endpoint (Express + axios)
```js
const express = require('express');
const axios = require('axios');
const router = express.Router();
const redis = require('./redisClient');
const GEO_CACHE_TTL = 60 * 60 * 24; // 24 hours

router.get('/nearby', requirePremium, async (req, res) => {
  const { lat, lng, radius = 10000, specialization = '' } = req.query;
  const cacheKey = `nearby:${lat}:${lng}:${radius}:${specialization}`;
  const cached = await redis.get(cacheKey);
  if (cached) return res.json(JSON.parse(cached));

  const googleRes = await axios.get('https://maps.googleapis.com/maps/api/place/nearbysearch/json', {
    params: {
      location: `${lat},${lng}`,
      radius,
      keyword: specialization,
      type: 'doctor',
      key: process.env.GOOGLE_MAPS_API_KEY
    }
  });
  const normalized = googleRes.data.results.map(r => ({
    place_id: r.place_id,
    name: r.name,
    location: r.geometry.location,
    rating: r.rating,
    open_now: r.opening_hours?.open_now || false,
    vicinity: r.vicinity
  }));
  await redis.set(cacheKey, JSON.stringify(normalized), 'EX', GEO_CACHE_TTL);
  res.json(normalized);
});
```

### Example client-side encryption snippet (Web Crypto API)
```ts
async function encryptAppointment(plain, userKey) {
  // userKey: CryptoKey from user's password-derived key or KMS-wrapped key
  const enc = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipher = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    userKey,
    enc.encode(JSON.stringify(plain))
  );
  return { iv: Array.from(iv), cipher: Buffer.from(cipher).toString('base64') };
}
```

---

## Final Notes & Recommendations

- **Start with server-side Places integration and caching** to validate UX and cost. Use a small pilot in a single city to tune results.
- **Offer internal scheduling only to verified providers** — this creates a premium moat and better UX.
- **Keep the premium gating strict** at API layer, with clear UI cues and upgrade CTA in frontend.
- **Monitor costs** (Google API) and usage carefully: caching & quotas are essential.
- **Document data flows** for privacy compliance (where location and appointment data is stored and how long).

---



it shows profile updated successfully but there are no changes in the dashboard the completion dropped from 60% to 40percent 
the access tab shows error that failed to load access permisions dev console logs:Error fetching access data: TypeError: Failed to fetch
    at getPatientPendingRequests (accessControlService.ts:129:26)
    at fetchAccessData (AccessManagement.tsx:31:52)
    at AccessManagement.tsx:26:5
    at Object.react_stack_bottom_frame (react-dom_client.js?v=0fccd5a7:17486:20)
    at runWithFiberInDEV (react-dom_client.js?v=0fccd5a7:1485:72)
    at commitHookEffectListMount (react-dom_client.js?v=0fccd5a7:8460:122)
    at commitHookPassiveMountEffects (react-dom_client.js?v=0fccd5a7:8518:60)
    at commitPassiveMountOnFiber (react-dom_client.js?v=0fccd5a7:9887:29)
    at recursivelyTraversePassiveMountEffects (react-dom_client.js?v=0fccd5a7:9868:13)
    at commitPassiveMountOnFiber (react-dom_client.js?v=0fccd5a7:9984:13)
fetchAccessData @ AccessManagement.tsx:35Understand this error
:5001/api/access-requests/patient/94699819-462e-49cc-bdbe-0a782506bd38/granted:1  Failed to load resource: net::ERR_CONNECTION_REFUSEDUnderstand this Error
i also want you to create a feature to show the current plan and i want you to only make Patient ID: 2506bd38 this as premium so that i can test the appointment feature 
i am working on a deadline there is a lot of pressure i would really appreciate if you could be more effiecient 
the profile is still not updating 
i want you to also add a tab along with overview records ai insights and access with the name of appointments and include all the api and let me search for available doctors in a 10km radius 