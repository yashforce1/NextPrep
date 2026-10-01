# NexPrep — JEE & NEET Intelligence Platform

A full-stack quiz platform for JEE and NEET aspirants with AI-powered analysis, question generation, and personalized tutoring — built with React, Vite, and Claude AI.

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.example .env
# Edit .env and add your Anthropic API key

# 3. Start development server
npm run dev
```

Open http://localhost:5173

---

## 🔑 Demo Login Credentials

| Role     | Email                   | Password    |
|----------|-------------------------|-------------|
| Admin    | admin@nexprep.in        | admin123    |
| Student  | aryan@student.com       | student123  |
| Student  | priya@student.com       | student123  |
| Student  | rohan@student.com       | student123  |

---

## 📁 Project Structure

```
nexprep/
├── index.html
├── vite.config.js
├── package.json
├── .env.example                    # Copy to .env and add API key
└── src/
    ├── main.jsx                    # Entry point
    ├── App.jsx                     # Router & route guards
    ├── styles/
    │   └── globals.css             # Design tokens & global styles
    ├── context/
    │   └── AppContext.jsx          # Global state (auth, questions, tests, results)
    ├── api/
    │   └── claude.js               # All Anthropic API integrations
    ├── utils/
    │   └── sampleData.js           # Seed data for demo
    └── pages/
        ├── LandingPage.jsx
        ├── LoginPage.jsx
        ├── admin/
        │   ├── AdminLayout.jsx     # Sidebar + outlet
        │   ├── AdminDashboard.jsx  # Stats, activity, student table
        │   ├── QuestionBank.jsx    # CRUD + AI question generation
        │   ├── CreateTest.jsx      # 4-step test builder wizard
        │   ├── ManageTests.jsx     # View/edit/delete tests
        │   ├── StudentResults.jsx  # All submissions table
        │   └── Analytics.jsx      # Charts: subject, student, difficulty
        └── student/
            ├── StudentLayout.jsx   # Sidebar + outlet
            ├── StudentDashboard.jsx # Stats, pending tests, trend chart
            ├── MyTests.jsx         # Pending & completed tests
            ├── TakeTest.jsx        # Full quiz engine with timer
            ├── TestResults.jsx     # Deep analysis + AI insight tabs
            └── AITutor.jsx         # Chat interface with Claude
```

---

## 🤖 AI Features (require API key)

| Feature | Location | Description |
|---------|----------|-------------|
| AI Question Generator | Admin > Question Bank | Generate JEE/NEET MCQs by subject/topic/difficulty |
| Performance Analysis | Student > Results > AI Analysis tab | Deep analysis: strengths, weaknesses, topic breakdown |
| Study Plan Generator | Student > Results > Study Plan tab | Weekly personalized study plan |
| AI Hints | Student > Take Test | Contextual hints during exam |
| Solution Explainer | Student > Results > Questions tab | Detailed step-by-step AI explanation |
| AI Tutor Chat | Student > AI Tutor | Full conversational tutor with subject filter |

---

## 🎨 Design System

- **Font Display**: Syne (headings)
- **Font Body**: DM Sans (content)
- **Font Mono**: JetBrains Mono (code/timers)
- **Theme**: Dark space aesthetic with cyan/purple gradient accents
- **CSS Variables**: All tokens in `src/styles/globals.css`

---

## ⚙️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 + Vite |
| Routing | React Router v6 |
| Charts | Recharts |
| AI | Anthropic Claude (claude-sonnet-4-20250514) |
| State | React Context + localStorage |
| Icons | Lucide React |
| Styling | Pure CSS with variables |

---

## 🔐 Production Deployment Note

For production, **never** expose `VITE_ANTHROPIC_API_KEY` in the frontend.
Instead, create a backend server (Node.js/Express or Next.js API route) that:
1. Receives requests from your React frontend
2. Calls the Anthropic API server-side
3. Returns results to the frontend

This keeps your API key secure.

---

## 📊 Features Overview

### Admin Panel
- Dashboard with platform-wide stats
- Question bank with full CRUD + AI generation
- 4-step test builder wizard (details → questions → students → review)
- Manage test status (active/draft/archived)
- Student results table with grade calculation
- Analytics dashboard with bar charts, pie charts

### Student Panel
- Dashboard with pending tests + score trend line chart
- Test cards with status (pending/completed)
- Full-featured quiz engine:
  - Countdown timer with urgency state
  - Question navigator grid
  - Flag for review system
  - Skip questions
  - AI hints (requires API key)
  - Submit confirmation
- Results & Analysis with 4 tabs:
  - Overview (subject charts, radar, progress bars)
  - Questions (answer review with explanations)
  - AI Analysis (strengths, weaknesses, topic breakdown)
  - Study Plan (weekly personalized schedule)
- AI Tutor chat with subject filter + quick prompts

---

## Google Analytics 4 setup

1. Create a GA4 property and a **Web** data stream for your site. In Google
   Analytics, open **Admin → Data streams → your web stream** and copy the
   **Measurement ID** (`G-...`). [Google's instructions](https://support.google.com/analytics/answer/9539598).
2. Create a `.env` file in the project root (or append to your existing file):

   ```dotenv
   VITE_GA_MEASUREMENT_ID=G-YOUR_REAL_ID
   VITE_GA_DEBUG=true
   ```

   Replace the example ID. Restart Vite after changing environment variables.
   Local development only sends events when `VITE_GA_DEBUG=true`. With no valid
   ID, analytics does not load or send anything.
3. In the web stream's **Enhanced measurement → settings → Page views →
   advanced settings**, disable **Page changes based on browser history events**.
   The app sends page views itself; leaving this setting on duplicates them.
   Do not add another Google tag snippet to `index.html` or via Tag Manager.
   [Google's manual page-view guidance](https://developers.google.com/analytics/devguides/collection/ga4/views).
4. Use the app and check GA4 **DebugView** / **Realtime**. Browser Network tools
   should show `gtag/js` loading and requests containing `collect`. Ad blockers
   can block delivery. The browser console's `window.dataLayer` shows queued
   calls, but queued calls alone do not prove Google received them.
5. For deployment, set `VITE_GA_MEASUREMENT_ID` in your hosting provider's build
   environment and set `VITE_GA_DEBUG=false`. Rebuild and deploy. Vite embeds
   these variables at build time; the measurement ID is public, not a secret.

## Events

| Event | When it fires |
| --- | --- |
| `page_viewed` | Initial page load and each pathname change, including back/forward. Query/hash-only changes are ignored. |
| `signup_completed` | Helper prepared for future registration; currently **not emitted**, because the app has demo login only. |
| `quiz_created` | A test is created successfully through AppContext. |
| `quiz_published` | A test is created as active or changes from draft/archived to active. Reactivating counts again. |
| `quiz_started` | Student clicks Begin Test. |
| `quiz_submitted` | A result is added, with `submission_type` of `manual` or `automatic`. |
| `report_viewed` | An existing student result is shown, or the admin Student Results page opens (including its empty state). |
| `report_downloaded` | Student initiates a CSV download from an existing result. The browser cannot confirm the file was saved. |

The app also emits GA4's standard `page_view` alongside `page_viewed` so Pages
and Screens reports work. These are two intentionally different event names;
use `page_view` for GA4 view counts. Strict Mode effect replays do not duplicate
route/report events, while leaving a page and returning counts as a new view.

To connect a future successful registration, import `trackSignupCompleted` from
`src/lib/analytics.js` and call `trackSignupCompleted('email')` only after account
creation succeeds. Do not call it on login or form submission failures.

Custom payloads use an explicit parameter allowlist. Names, emails, passwords,
answers, scores, and free-form titles are not sent by these custom events.
Query strings and URL fragments are excluded from the app's page locations.
This integration starts tracking when configured; it does not implement a
consent banner. GA4's own automatic/enhanced collection is controlled separately
in your property's settings.

For custom reporting, register event-scoped custom dimensions for parameters
such as `report_type`, `submission_type`, and `user_role` in GA4 Custom definitions.
Avoid using unique quiz IDs as a primary reporting dimension at high volume.

## Verification

Run `npm run build` and `node --experimental-vm-modules --test tests/analytics.test.js`.
The latter checks configuration, initialization, event payloads, page-view
commands, failure isolation, and CSV escaping without contacting Google.

For end-to-end verification with a real measurement ID:

1. Log in as admin. Create a draft test: expect `quiz_created` only. Change its
   status to Active: expect `quiz_published`. Creating an active test emits both.
2. Log in as a student. Open an uncompleted test: no start event until Begin Test.
   Answer and submit: expect one `quiz_started`, then one `quiz_submitted`.
   Check timeout submission separately with a short-duration test.
3. View the result: expect `report_viewed`. Click Download Report (CSV), inspect
   the downloaded file, and check `report_downloaded`.
4. Navigate away and back: each pathname visit should produce one `page_view`
   and one `page_viewed`. Missing student results must not emit `report_viewed`.

Live GA4 receipt requires your measurement ID and access to your property.
