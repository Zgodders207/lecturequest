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
- Nature-inspired sage green aesthetic with calming organic tones
- Color palette based on: #F1F3E0, #D2DCB6, #A1BC98, #778873
- Clean, minimal design with generous whitespace (max-w-5xl containers, py-12 spacing)
- Simple stat cards without heavy icons
- Gold accents for XP/achievements, success color for high accuracy
- Full design system defined in `design_guidelines.md` and `client/src/index.css`

**State Management**: Local React state with no global state library. Application state managed in `client/src/pages/home.tsx` includes:
- User profile (level, XP, achievements, power-ups, streaks)
- Lecture history
- Current quiz state
- View navigation (dashboard, upload, quiz, results, achievements)

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

**Current Implementation**: In-memory storage with `MemStorage` class in `server/storage.ts` (minimal implementation)

**Schema Definition**: Drizzle ORM configuration prepared in `drizzle.config.ts` for PostgreSQL
- Schema defined in `shared/schema.ts`
- Migration output directory: `./migrations`
- Database connection via `DATABASE_URL` environment variable

**Note**: The application is currently configured for database integration but not actively using persistent storage. All user data exists in client-side state.

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

**Daily Quiz Generation**:
- Uses previous weak topics
- Considers confidence level
- Adapts difficulty based on previous scores

**Response Processing**: JSON parsing with cleanup utility to remove markdown code fences

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