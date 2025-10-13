## 10x Cards

![Version](https://img.shields.io/badge/version-0.0.1-informational) ![Node](https://img.shields.io/badge/node-22.14.0-339933?logo=node.js&logoColor=white) ![Astro](https://img.shields.io/badge/astro-5-FF5D01?logo=astro&logoColor=white) ![React](https://img.shields.io/badge/react-19-61DAFB?logo=react&logoColor=061F2F) ![License](https://img.shields.io/badge/license-MIT-blue)

A modern web application for creating and learning flashcards using AI and spaced repetition system (SRS). Transform long text content into interactive flashcards with intelligent review scheduling.

### Table of contents
- [1. Project name](#1-project-name)
- [2. Project description](#2-project-description)
- [3. Tech stack](#3-tech-stack)
- [4. Getting started locally](#4-getting-started-locally)
- [5. Available scripts](#5-available-scripts)
- [6. API Endpoints](#6-api-endpoints)
- [7. Project scope](#7-project-scope)
- [8. Project status](#8-project-status)
- [9. License](#9-license)

## 1. Project name

10x Cards

## 2. Project description

**10x Cards** is a web application that enables users to quickly create high-quality flashcards from long text content using AI. The application features:

- **AI-powered flashcard generation** from text input (PL/EN/ES languages)
- **Anonymous mode** for immediate value without registration
- **Authenticated mode** with full persistence and SRS (Spaced Repetition System)
- **Smart review scheduling** using SM-2 algorithm
- **Interactive card review** with swipe gestures and bulk actions
- **Data migration** from anonymous to authenticated sessions

The application follows a simple linear flow: **paste → generate → review/edit → save to set → start learning session**.

## 3. Tech stack

### Frontend
- **Astro**: 5.x (SSR with islands architecture)
- **React**: 19.x (interactive components)
- **TypeScript**: 5.x
- **Tailwind CSS**: 4.x (via `@tailwindcss/vite`)
- **UI Components**: shadcn/ui with Radix primitives
- **Form Handling**: react-hook-form with Zod validation
- **Icons**: Lucide React

### Backend & Database
- **Supabase**: PostgreSQL + Auth + RLS + Edge Functions
- **Authentication**: Supabase Auth (email/password)
- **Database**: PostgreSQL with Row Level Security (RLS)
- **API**: Astro API routes with server-side rendering

### AI & Services
- **AI Generation**: OpenRouter.ai integration
- **SRS Algorithm**: SM-2 spaced repetition system
- **Rate Limiting**: Built-in for anonymous and authenticated users

### Development Tools
- **Linting**: ESLint 9 with TypeScript support
- **Formatting**: Prettier with Astro plugin
- **Git Hooks**: Husky + lint-staged
- **Type Safety**: Full TypeScript coverage

## 4. Getting started locally

### Prerequisites
- Node.js 22.14.0 (see `.nvmrc`)
- npm (bundled with Node)

### Setup
```bash
# 1) Clone the repository
git clone <your-repo-url>
cd <your-repo-directory>

# 2) Ensure correct Node version
nvm use || nvm install

# 3) Install dependencies
npm install

# 4) Start the dev server
npm run dev

# 5) Build and preview production
npm run build
npm run preview
```

Project structure highlights:

```md
./src              # Source code
./src/layouts      # Astro layouts
./src/pages        # Astro pages
./src/pages/api    # API endpoints
./src/middleware   # Astro middleware
./src/db           # Supabase clients and types
./src/types.ts     # Shared types
./src/components   # Astro & React components
./src/components/ui# Shadcn/ui-inspired components
./src/lib          # Services and helpers
./src/assets       # Internal static assets
./public           # Public assets
```

## 5. Available scripts

```bash
npm run dev       # Start development server
npm run build     # Build for production
npm run preview   # Preview the production build
npm run astro     # Run Astro CLI directly
npm run lint      # Run ESLint
npm run lint:fix  # Auto-fix ESLint issues
npm run format    # Format with Prettier
```

## 6. API Endpoints

The application provides a comprehensive REST API for flashcard management, AI generation, and spaced repetition learning.

### Core Endpoints

#### Flashcard Generation
- `POST /api/generations` - Start AI-powered flashcard generation from text
- `GET /api/generations/:id` - Check generation status and retrieve results

#### Sets Management
- `GET /api/sets` - List user's flashcard sets (with pagination, search, sorting)
- `POST /api/sets` - Create a new flashcard set
- `GET /api/sets/:id` - Get specific set details
- `PATCH /api/sets/:id` - Update set name
- `DELETE /api/sets/:id` - Delete set and all associated cards

#### Cards Management
- `GET /api/sets/:setId/cards` - List cards in a set (with filtering)
- `POST /api/sets/:setId/cards` - Create a new card manually
- `POST /api/sets/:setId/cards/batch` - Batch create cards from AI generation
- `GET /api/cards/:id` - Get specific card details
- `PATCH /api/cards/:id` - Update card content
- `DELETE /api/cards/:id` - Delete a card

#### Spaced Repetition System (SRS)
- `GET /api/srs/due` - Get cards due for review today
- `POST /api/srs/sessions` - Start a new learning session
- `POST /api/srs/reviews` - Submit card review with rating (SM-2 algorithm)
- `GET /api/srs/sessions/:id/summary` - Get session summary and statistics

### Authentication & User Management
- `POST /api/auth/login` - User login (email/password)
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout
- `POST /api/migrate/anonymous-to-account` - Migrate anonymous session data

### Example Usage

**Generate flashcards from text:**
```bash
curl -X POST http://localhost:4321/api/generations \
  -H "Content-Type: application/json" \
  -d '{
    "source_text": "Your educational text (100-15000 characters)...",
    "language": "en",
    "target_count": 30
  }'
```

**Start a learning session:**
```bash
curl -X POST http://localhost:4321/api/srs/sessions \
  -H "Content-Type: application/json" \
  -d '{
    "set_id": "550e8400-e29b-41d4-a716-446655440000",
    "new_cards_limit": 20,
    "review_cards_limit": 100
  }'
```

### Features
- ✅ **Type-safe validation** with Zod schemas
- ✅ **Anonymous user support** via generation endpoints
- ✅ **Row Level Security** (RLS) for data isolation
- ✅ **Pagination and filtering** for large datasets
- ✅ **Error handling** with consistent response format
- ✅ **SM-2 algorithm** for intelligent review scheduling
- ✅ **Complete frontend generation flow** with React components

## 7. Project scope

This application implements a complete flashcard learning system with the following key features:

### Core Functionality
- **AI-powered flashcard generation** from text content (100-15,000 characters)
- **Anonymous mode** for immediate value without registration barriers
- **Authenticated mode** with full data persistence and advanced features
- **Spaced Repetition System (SRS)** using SM-2 algorithm for optimal learning
- **Interactive card review** with swipe gestures and bulk actions
- **Data migration** from anonymous sessions to user accounts

### User Experience
- **Progressive enhancement** - works without JavaScript for basic functionality
- **Mobile-first design** with touch gesture support
- **Real-time progress tracking** and learning analytics
- **Multi-language support** (Polish, English, Spanish)

### Technical Features
- **Server-side rendering** with Astro for fast initial load
- **Client-side interactivity** with React for rich user experience
- **Type-safe API** with comprehensive validation
- **Row Level Security** for data isolation and privacy
- **Rate limiting** to prevent abuse and control costs

### Data Limits
- **Anonymous users**: Supported via `/api/generations` endpoint (uses "anonymous-user" ID)
- **Authenticated users**: 1,000 cards/account, 200 cards/set
- **Daily SRS limits**: 20 new cards, 100 reviews per day
- **Rate limiting**: Built-in protection for both anonymous and authenticated users

For detailed requirements and specifications, see:
- [Product Requirements Document (PRD v2)](.ai/prd-2.md)
- [Authentication Architecture](.ai/auth-spec.md)

## 8. Project status

- **Version**: `0.0.1`
- **Status**: Active development (MVP phase)
- **Implementation Progress**:
  - ✅ **Backend API**: Complete (15/15 endpoints implemented)
  - ✅ **Database Schema**: Complete with RLS policies
  - ✅ **AI Generation**: Complete with OpenRouter integration
  - ✅ **SRS System**: Complete with SM-2 algorithm
  - ✅ **Anonymous Mode**: Complete (generations endpoint supports anonymous users)
  - ✅ **Frontend UI**: Generation flow complete with full React components
  - ✅ **Supabase Integration**: Complete (auth endpoints, middleware, services)
  - 🚧 **Frontend Auth Components**: Mock implementation (needs connection to Supabase endpoints)

### Recent Updates
- **October 2025**: Complete REST API implementation with 15 endpoints
- **October 2025**: Full database schema with migrations and RLS
- **October 2025**: AI generation service with rate limiting
- **October 2025**: SRS system with SM-2 algorithm implementation
- **October 2025**: Anonymous mode support in generation endpoints
- **October 2025**: Complete frontend generation flow with React components
- **October 2025**: Full Supabase integration (auth endpoints, middleware, services)

## 9. License

MIT
