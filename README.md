# Writify

A peer-to-peer assignment marketplace built for university students. Writify connects students who need academic help with peers who can write, creating a trusted community backed by verified university accounts, ratings, and direct WhatsApp communication.

## Features

**Authentication & Access**
- Google OAuth restricted to university email addresses (`@student.iul.ac.in`)
- Guest mode for browsing without an account
- Session-based auth with account lockout after repeated failed attempts

**Assignment Lifecycle**
- Post assignment requests visible to all active writers for 7 days
- Browse writer profiles with portfolios, ratings, and availability status
- Request a specific writer directly from their profile page
- Writers accept requests, triggering instant WhatsApp contact
- Mark assignments complete and rate the other party

**Filtering & Discovery**
- Filter writers by stream, availability status, and search query
- Filter assignment requests by type (Class Assignment, Lab File, Workshop File, Graphics Sheet) and sort by date, deadline, or price
- Assignment types scoped by course — Workshop Files and Graphics Sheets only appear for B.Tech students

**Communication**
- One-click WhatsApp redirect with pre-filled messages including assignment ID
- WhatsApp number stored per user for persistent contact

**Ratings & Trust**
- 1-5 star rating system with optional text reviews
- Ratings displayed on writer cards, assignment cards, and profiles
- Rating counts shown alongside averages (e.g., 4.2(5))

**UI/UX**
- Light mode by default, dark mode toggle persisted in localStorage
- Responsive across mobile, tablet, and desktop
- Animated page transitions via Framer Motion
- Toast notifications for all user actions
- Skeleton loading states throughout

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, React Router v6 |
| Styling | Tailwind CSS v3, clsx + tailwind-merge |
| Animations | Framer Motion |
| Icons | Lucide React |
| Notifications | Sonner |
| Backend | Node.js, Express.js |
| Database | PostgreSQL via `pg` (raw SQL, no ORM) |
| Auth | Passport.js (Google OAuth 2.0), express-session |
| Security | Helmet, express-rate-limit, validator.js (XSS sanitization) |
| Testing | Jest (backend), React Testing Library + Jest (frontend) |

## Project Structure

```
WritifyApp/
├── backend/
│   ├── server.js            # Express app, all API routes, middleware
│   ├── security.js          # Rate limiting, account lockout, input sanitization
│   ├── db/
│   │   ├── init.sql          # Full schema (5 tables)
│   │   ├── setupDatabase.js  # Auto-init on first run
│   │   └── migrations/       # Column additions
│   ├── models/               # Legacy model stubs (unused)
│   └── __tests__/            # Backend test suite
├── frontend/
│   ├── src/
│   │   ├── components/       # All page and UI components
│   │   ├── contexts/         # ThemeContext (dark mode)
│   │   ├── utils/            # api, auth, cn, logUtil
│   │   ├── assets/           # Logo image
│   │   ├── __tests__/        # Frontend test suite
│   │   └── test-utils/       # Shared test helpers
│   └── public/
└── README.md
```

## Database Schema

Five tables: `users`, `writer_portfolios`, `assignment_requests`, `assignments`, `ratings`. See `backend/db/init.sql` for the full schema.

Key relationships:
- A **user** can be both a client and a writer
- An **assignment request** is created by a client, optionally accepted by a writer (creating an **assignment**)
- **Ratings** are tied to a specific assignment request, one per rater per request

## Local Development

### Prerequisites
- Node.js v18+
- PostgreSQL running locally
- A Google Cloud project with OAuth 2.0 credentials

### Backend

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
PORT=5000
DATABASE_URL=postgresql://username:password@localhost:5432/writify_db
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
SESSION_SECRET=your_secure_random_string
FRONTEND_URL=http://localhost:3000
GOOGLE_CALLBACK_URL=http://localhost:5000/auth/google/callback
ENCRYPTION_KEY=your_32_character_encryption_key
```

Initialize the database and start the server:

```bash
npm run setup-db
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm start
```

The app runs at `http://localhost:3000`.

## Testing

### Backend

```bash
cd backend
npm test                # single run
npm run test:watch      # watch mode
npm run test:coverage   # with coverage report
```

Covers: account lockout logic, XSS input sanitization, phone number validation/storage, unique ID generation, WhatsApp lookup table.

### Frontend

```bash
cd frontend
npm test                                          # watch mode (default)
npx react-scripts test --watchAll=false           # single run
npx react-scripts test --watchAll=false --coverage # with coverage
```

Covers: utility functions (cn, api config, auth flows, logging), ThemeContext persistence, ErrorBoundary, DarkModeToggle, Logo, Login page (Google auth, guest auth, error states, storage flags), Dashboard (guest/auth modes, navigation, quick actions).

## Deployment

| Service | Purpose | Config |
|---------|---------|--------|
| Railway | PostgreSQL database | Provision a Postgres instance, copy the connection URL |
| Render | Backend API | Root: `backend`, Build: `npm install`, Start: `npm start`, add all env vars |
| Vercel | Frontend SPA | Root: `frontend`, Framework: Create React App, add `REACT_APP_API_URL` env var |

## Image Handling

Portfolio and sample work images are hosted externally (Imgur, Google Drive, ImageKit). Users paste the direct URL into their profile settings.

## License

MIT
