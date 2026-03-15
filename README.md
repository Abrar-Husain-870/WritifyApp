# Writify 🎓

Writify is a modern, secure, peer-to-peer assignment marketplace platform designed exclusively for university students. It connects students who need academic assistance with talented peers who can provide help, fostering a collaborative learning environment.

## ✨ Features

- **Exclusive Access**: Google OAuth authentication strictly limited to university email addresses (`.student.iul.ac.in`).
- **Student & Writer Roles**: Seamlessly switch between requesting help and offering your services.
- **Assignment Broadcasting**: Post assignments to a public board for available writers to accept.
- **Direct Writer Requests**: Browse writer profiles, view their ratings/portfolios, and request them directly.
- **Advanced Filtering**: Filter assignments and writers by university stream, assignment type (e.g., Lab Files, Workshop Files, Graphics Sheets), and status.
- **WhatsApp Integration**: Direct one-click WhatsApp redirection for seamless communication between clients and writers.
- **Rating & Review System**: Built-in rating system to ensure quality and build trust within the community.
- **Modern UI/UX**: Fully responsive, accessible design with smooth animations and a built-in Dark/Light mode toggle.

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Routing**: React Router DOM v6
- **Styling**: Tailwind CSS v3
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **Notifications**: Sonner (Toast notifications)

### Backend
- **Environment**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL (interfaced via `pg`)
- **Authentication**: Passport.js (Google OAuth 2.0)
- **Security**: Helmet, Express Rate Limit, CORS

## 🚀 Local Development Setup

### Prerequisites
- Node.js (v18 or higher recommended)
- PostgreSQL installed and running locally
- Git

### 1. Clone the Repository
```bash
git clone <repository-url>
cd writify
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory based on `.env.example`:
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

Initialize the database schema:
```bash
npm run setup-db
```

Start the backend development server:
```bash
npm run dev
```

### 3. Frontend Setup
Open a new terminal window:
```bash
cd frontend
npm install
```

Start the frontend development server:
```bash
npm start
```
The application will be available at `http://localhost:3000`.

## 🌍 Deployment Guide

### Database (Railway)
1. Create a project on [Railway](https://railway.app).
2. Provision a new PostgreSQL database.
3. Copy the "PostgreSQL Connection URL" and update your backend environment variables.
4. Run `npm run setup-db` locally using the production database URL to initialize the schema.

### Backend (Render)
1. Create a Web Service on [Render](https://render.com).
2. Connect your GitHub repository.
3. Set the Root Directory to `backend`.
4. Build Command: `npm install`
5. Start Command: `npm start`
6. Add all necessary environment variables (including `NODE_ENV=production`).

### Frontend (Vercel)
1. Import your repository into [Vercel](https://vercel.com).
2. Set the Framework Preset to Create React App.
3. Set the Root Directory to `frontend`.
4. Add the environment variable:
   - `REACT_APP_API_URL`: Your Render backend URL (e.g., `https://writify-backend.onrender.com`)
5. Deploy!

## 📸 Image Handling
Writify uses external image hosting to keep the database lightweight. Users should:
1. Upload portfolio images to services like Imgur or Google Drive.
2. Get the direct image link.
3. Paste the URL into their profile settings.

## 📄 License
This project is licensed under the MIT License.
