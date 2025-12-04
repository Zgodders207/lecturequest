# LectureQuest — Standalone Local App

This project was developed on Replit and has been converted to run completely standalone using browser localStorage.

## Features

✅ **No login required** - App loads directly to the main interface  
✅ **No database needed** - All data stored in browser localStorage  
✅ **No backend API calls** - Fully client-side application  
✅ **Mock quiz generation** - Generates sample quizzes from your uploaded lectures  
✅ **Clean codebase** - All redundant API code and unused components removed

## What Works

- Upload lectures via text input
- Take quizzes on uploaded content
- Track XP, levels, and achievements
- View quiz history and progress
- Review scheduling system

## What Requires Backend (Disabled)

- Calendar integration with Google Calendar
- Friends and leaderboard system
- Skills analysis
- PDF/DOCX file parsing (only .txt files work)
- Batch file upload  

## Quick Start

1. Install dependencies:

```powershell
npm install
```

2. Start the development server:

```powershell
npm run dev
```

3. Open your browser to:
```
http://localhost:5000
```

That's it! The app will load immediately without any login or configuration.

## How It Works

- **Data Storage**: All user data (lectures, profile, progress) is saved in your browser's localStorage
- **Authentication**: Bypassed - the app always loads directly to the dashboard
- **Quizzes**: Mock questions are generated client-side from your lecture content
- **Persistence**: Your data persists as long as you don't clear browser data

## Production Build

To create an optimized production build:

```powershell
npm run build
npm run start
```

## Data Management

- **Clear all data**: Open browser DevTools → Application tab → Local Storage → Clear all
- **Export data**: Copy values from localStorage in DevTools
- **Portable**: Works entirely in the browser, no external services needed

## Troubleshooting

- **Data not persisting?** Check that your browser allows localStorage
- **Port 5000 in use?** Kill the process: `taskkill /F /PID <pid>` or change PORT in `.env`
- **TypeScript errors?** Run `npm run check` to validate

## What Changed From Replit Version

- ❌ Removed: Replit authentication (OIDC)
- ❌ Removed: Database API calls (PostgreSQL/Neon)
- ❌ Removed: Landing/login page
- ✅ Added: Browser localStorage for all data
- ✅ Added: Client-side mock quiz generation
- ✅ Added: Direct app access without authentication
