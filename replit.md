# LectureQuest - Gamified Learning Platform

## Overview

LectureQuest is a single-page React application that transforms passive lecture attendance into active learning through gamification. Students upload lecture materials (text/PDF), take AI-generated quizzes, and track their progress through an XP-based leveling system with achievements and daily challenges.

The application uses an AI-powered quiz generation system (Claude API) to create personalized learning experiences based on lecture content and identified weak areas.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React 18 with TypeScript using functional components and hooks (useState, useEffect)

**UI Framework**: Shadcn/ui component library built on Radix UI primitives with Tailwind CSS for styling

**Styling Approach**: 
- "Quiet luxury" aesthetic inspired by wisprflow.ai with editorial elegance
- Color palette: Warm cream background (#FFFDF9), deep forest green primary (#034F46), soft lavender accents (#F0D7FF)
- Typography: EB Garamond (serif) for headings, Figtree (sans-serif) for body text
- Clean, minimal design with generous whitespace (max-w-5xl containers, py-16 spacing)
- Elegant cards with subtle shadows and refined borders
- Gold accents for XP/achievements, success color for high accuracy
- Lucide icons for all iconography (no emojis)
- Full design system defined in `design_guidelines.md` and `client/src/index.css`

**State Management**: Local React state with no global state library. Application state managed in `client/src/pages/home.tsx` includes:
- User profile (level, XP, achievements, power-ups, streaks)
- Lecture history
- Current quiz state
- View navigation (dashboard, upload, quiz, results, achievements)

**Dashboard Design**: Clean, tab-based interface in `client/src/components/dashboard.tsx`:
- Compact header with stats bar (Level, XP, Streak, Progress)
- Three-tab navigation for focused content:
  - **Today** tab: Daily quiz, reviews due, calendar events, study materials
  - **Skills** tab: Skills profile with career insights and export
  - **Progress** tab: Stats grid, achievements, power-ups
- Demo mode for showcasing features with sample data

**Routing**: Wouter for lightweight client-side routing

**Data Fetching**: TanStack Query (React Query) with custom API request utilities in `client/src/lib/queryClient.ts`

**Type Safety**: Comprehensive TypeScript interfaces defined in `shared/schema.ts` for:
- Questions and quiz results
- User profiles and achievements
- Lectures and daily quizzes
- Gamification elements (XP, levels, power-ups)

### Backend Architecture

**Server Framework**: Express.js with TypeScript

**API Structure**: RESTful endpoints defined in `server/routes.ts`:
- `POST /api/generate-quiz` - Generates quiz from lecture content
- `POST /api/generate-daily-quiz` - Creates personalized daily quizzes based on weak topics
- `POST /api/calendar` - Connects and syncs ICS calendar feed
- `GET /api/calendar/events` - Retrieves cached calendar events
- `DELETE /api/calendar` - Disconnects calendar

### Calendar Integration

**ICS Feed Parsing**: Uses node-ical to parse ICS calendar feeds from academic calendars

**Security Features** (SSRF Protection):
- HTTPS-only URL requirement
- DNS resolution validation before connection
- Private IP range blocking (IPv4 and IPv6 loopback, private, link-local, CGNAT, multicast, reserved)
- Custom DNS lookup function to prevent DNS rebinding attacks
- Redirect validation with per-hop DNS verification (max 5 redirects)
- Blocks suspicious domains (.nip.io, .sslip.io, .xip.io, .localtest.me, .local, .internal)
- Direct IP addresses not allowed (must use domain names)

**Event Classification**: Automatically classifies events as lectures, labs, tutorials, exams, or other based on title keywords

**Dashboard Integration**:
- Upcoming Lectures: Shows next 7 days of scheduled events
- Missing Lectures: Identifies attended lectures without uploaded materials (14-day lookback)

**Request Validation**: Zod schemas for type-safe request validation

**Development Setup**: 
- Vite dev server with HMR (Hot Module Replacement)
- Custom middleware in `server/vite.ts` for development mode
- Static file serving for production builds

**Build Process**: Custom build script (`script/build.ts`) that:
- Bundles client with Vite
- Bundles server with esbuild
- Optimizes dependencies for cold start performance

### Data Storage

**Current Implementation**: PostgreSQL database with Neon serverless driver and Drizzle ORM

**Database Tables**:
- `users` - User profiles with level, XP, achievements, streaks
- `lectures` - Uploaded lecture content with quiz results and skills
- `topic_review_stats` - SM-2 spaced repetition tracking per topic
- `review_events` - Audit log of all review activities
- `daily_quiz_plans` - Generated daily quiz plans with completion status
- `calendar_settings` - ICS calendar URL and sync status
- `calendar_events` - Cached calendar events

**WebSocket Configuration**: Uses `ws` package for Neon serverless connection in Node.js environment

**Schema Definition**: Drizzle ORM configuration in `drizzle.config.ts`
- Schema defined in `shared/schema.ts`
- Migration: `npm run db:push` for schema sync
- Database connection via `DATABASE_URL` environment variable

### Gamification System

**Level Calculation**: Square root formula - Level = floor(sqrt(totalXP / 100))

**XP Distribution**:
- Base XP per quiz: 50
- Per correct answer: 10
- Perfect score bonus: 50
- Confidence rating bonus: 5 per rating point
- Improvement bonus: 20
- Streak bonus: 5 per day streak
- Double XP power-up: 2x multiplier

**Achievements System**: Tracked in `client/src/lib/game-utils.ts` with conditions for:
- Perfect scores
- Streak milestones
- Level achievements
- Quiz completion counts
- Improvement metrics

**Power-ups**:
- Hints (eliminate wrong answers)
- Second Chance (retry incorrect answer)
- Double XP

### AI Integration

**Provider**: Anthropic Claude API (claude-sonnet-4-20250514 model)

**Implementation**: Direct API calls in `server/routes.ts` using `@anthropic-ai/sdk`

**Quiz Generation Strategy**:
- Analyzes lecture content to extract key concepts
- Generates 5-7 multiple choice questions
- Provides explanations for each answer
- Identifies topics for weak areas based on incorrect answers
- **Skills Recognition**: Identifies 3-5 transferable skills per lecture with:
  - Name, description, and category (cognitive/technical/interpersonal)
  - Relevant career paths (2-3 per skill)
  - Proficiency level calculated from quiz accuracy

**Skills Proficiency Calculation**:
- Proficient: Quiz accuracy >= 85%
- Intermediate: Quiz accuracy 60-84%
- Developing: Quiz accuracy < 60%

**Daily Quiz Generation**:
- Uses previous weak topics
- Considers confidence level
- Adapts difficulty based on previous scores

**Response Processing**: JSON parsing with cleanup utility to remove markdown code fences

### Skills Profile & Career Mapping

**Aggregation**: GET /api/skills endpoint aggregates all identified skills across lectures
- Skills sorted by proficiency level (proficient > intermediate > developing)
- Dashboard displays skills with career badges
- CSV export functionality for sharing with employers/advisors

**Dashboard Integration**:
- Skills Profile section shows aggregated skills
- Each skill displays 2-3 relevant career paths
- Proficiency breakdown (proficient/intermediate/developing counts)
- Export button generates CSV with full skill data

## External Dependencies

### Third-Party Services

**AI Service**: 
- Anthropic Claude API
- API key configured via `ANTHROPIC_API_KEY` environment variable
- Used for quiz generation and content analysis

**Database** (Configured but not active):
- Neon PostgreSQL (via `@neondatabase/serverless`)
- Connection pooling for serverless environments
- Drizzle ORM for schema management and queries

### Key NPM Packages

**UI Components**:
- Radix UI primitives (accordion, dialog, dropdown, progress, toast, etc.)
- Tailwind CSS for utility-first styling
- class-variance-authority and clsx for conditional styling

**Development Tools**:
- Vite for fast development and optimized production builds
- TypeScript for type safety
- tsx for running TypeScript files directly
- esbuild for server bundling

**Form Handling**:
- React Hook Form with Zod resolvers for validation

**Date Utilities**:
- date-fns for date formatting and manipulation

### Build and Deployment

**Development**: `npm run dev` - Runs tsx server with Vite middleware for HMR

**Production Build**: `npm run build` - Creates optimized client bundle and server bundle

**Production Start**: `npm start` - Runs compiled server with static file serving

**Database Management**: `npm run db:push` - Pushes Drizzle schema changes to database

### Environment Variables Required

- `ANTHROPIC_API_KEY` - Claude API authentication
- `DATABASE_URL` - PostgreSQL connection string (when database is activated)
- `NODE_ENV` - Environment mode (development/production)