# Flash Cards AI

An intelligent web application for creating and learning flashcards using AI-powered generation and spaced repetition system (SRS). Transform long texts into high-quality flashcards and optimize your learning with scientifically-backed repetition algorithms.

## Project Description

Flash Cards AI addresses the time-consuming process of manually creating effective flashcards from educational content. The application uses AI to generate 30 flashcards from text inputs (10-15k characters) and provides an intuitive interface for reviewing and selecting the best cards. Built for language learners and students who want to accelerate their spaced repetition learning journey.

### Key Features
- 🤖 **AI-Powered Generation**: Transform long texts into 30 high-quality flashcards using OpenRouter.ai
- 📱 **Card Review Interface**: Review and select generated flashcards
- ✏️ **Manual Card Editing**: Edit flashcards after AI generation
- 📚 **Set Management**: Organize cards into sets with smart limits (200 cards/set, 1000 cards/user)
- 🔐 **Authentication**: Email/password login via Supabase Auth
- 🧠 **SRS Integration**: Spaced repetition system (SM-2 algorithm)
- 🌍 **Multi-language**: Support for Polish, English, and Spanish content
- 📊 **Analytics**: Track learning progress and AI acceptance rates
- 🚩 **Feature Flags**: Environment-based feature control system

## Tech Stack

### Frontend
- **Astro 5** - Static site generation with islands architecture
- **React 19** - Interactive components and UI
- **TypeScript 5** - Type-safe development
- **Tailwind CSS 4** - Utility-first styling
- **shadcn/ui** - Pre-built accessible components
- **Radix UI** - Headless component primitives

### Backend & Infrastructure
- **Supabase** - PostgreSQL database, authentication, and real-time features
- **Supabase Edge Functions** - Serverless API endpoints
- **Row Level Security (RLS)** - Data protection and access control
- **Feature Flags System** - Environment-based feature control

### AI & External Services
- **OpenRouter.ai** - AI model integration for flashcard generation (GPT-4o, Claude-3.5-Sonnet)

### Development & Testing
- **Vitest** - Unit and integration testing
- **Playwright** - End-to-end testing
- **MSW** - API mocking
- **ESLint & Prettier** - Code quality and formatting

## Getting Started Locally

### Prerequisites
- Node.js 22.14.0 (see `.nvmrc`)
- npm or yarn package manager
- Supabase account and project

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd 10x-cards
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env.local` file in the root directory:
   ```env
   PUBLIC_SUPABASE_URL=your_supabase_url
   PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   OPENROUTER_API_KEY=your_openrouter_api_key
   PUBLIC_ENV_NAME=local
   ```

4. **Database Setup**
   - Set up your Supabase project
   - Run the migration files from `supabase/migrations/`
   - Configure Row Level Security policies

5. **Start Development Server**
   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:4321`

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run dev:test` | Start development server in test mode |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Fix ESLint issues automatically |
| `npm run format` | Format code with Prettier |
| `npm run test` | Run unit tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:ui` | Run tests with UI |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run test:e2e` | Run end-to-end tests |
| `npm run test:e2e:ui` | Run E2E tests with UI |
| `npm run test:e2e:headed` | Run E2E tests in headed mode |
| `npm run test:all` | Run all tests (unit + E2E) |

## Project Scope

### MVP Features ✅
- AI flashcard generation from text (10-15k characters) using OpenRouter.ai
- Card review and selection interface
- Manual flashcard editing after AI generation
- Set management with pagination
- Email/password authentication via Supabase Auth
- SRS integration with SM-2 algorithm
- Basic analytics and event tracking
- Multi-language support (PL/EN/ES)
- Feature flags system for environment-based control

### Data Limits
- **Account Limit**: 1,000 flashcards per user
- **Set Limit**: 200 flashcards per set
- **Pagination**: 50 items per page
- **Daily SRS Limits**: 20 new cards, 100 reviews
- **Generation Limit**: 30 cards per generation

### Current Implementation Status
- ✅ **API Endpoints**: Complete REST API with 15+ endpoints
- ✅ **Database Schema**: Full Supabase setup with RLS policies
- ✅ **AI Integration**: OpenRouter.ai service with multiple models
- ✅ **Testing Framework**: Comprehensive test suite (Vitest + Playwright)
- ✅ **Feature Flags**: Environment-based feature control
- ✅ **Authentication**: Email/password system via Supabase Auth
- 🚧 **Frontend UI**: Basic components, needs completion
- 🚧 **SRS System**: Complete SM-2 algorithm backend, frontend UI pending

### Out of Scope (Post-MVP)
- File import (PDF, DOCX)
- Set sharing and collaboration
- Native mobile applications
- Advanced SRS algorithms
- External platform integrations

## Project Status

🚧 **Development Phase** - MVP in active development

### Key Metrics & Goals
- **AI Acceptance Rate**: Target ≥75% of generated cards accepted
- **Generation Performance**: P95 < 10 seconds for 1k words
- **Learning Activation**: ≥60% users start first SRS session within 24h
- **Quality Standards**: <2% duplicates in generation batches

### Architecture Overview
- **Backend**: Complete REST API with 15+ endpoints
- **Database**: Full Supabase setup with migrations and RLS
- **AI Service**: OpenRouter.ai integration with multiple models
- **Testing**: Comprehensive test suite with 90%+ coverage
- **Deployment**: Cloudflare Pages with GitHub Actions CI/CD
- **Feature Control**: Environment-based feature flags system

## License

This project is currently in development. License information will be added upon release.

---

## Documentation

### Technical Documentation
- [Product Requirements Document](.ai/prd.md) - Original PRD
- [Updated PRD v2](.ai/prd-2.md) - With anonymous mode
- [Technical Architecture](.ai/tech-stack.md) - Tech stack details
- [API Documentation](.ai/api-endpoints-implemented.md) - Complete API reference
- [Authentication Architecture](auth-architecture-diagram.md) - Auth system design

### Development Guides
- [Testing Setup](TESTING_SETUP.md) - Comprehensive testing guide
- [Deployment Guide](DEPLOYMENT.md) - Cloudflare Pages deployment
- [Feature Flags](src/features/README.md) - Feature control system
- [Services Documentation](src/lib/services/README.md) - OpenRouter integration
- [Auth Components](src/components/auth/README.md) - Authentication components

### Testing
- [Testing Guide](tests/README.md) - Complete testing documentation
- [Unit Tests](tests/unit/) - Component and service tests
- [E2E Tests](tests/e2e/) - End-to-end test suites
- [Test Coverage](coverage/) - Coverage reports

## Contributing

This project is in active development. The backend API is complete and ready for frontend integration. Key areas for contribution:

1. **Frontend UI Completion** - React components for card review and SRS interface
2. **Authentication Frontend** - Complete the auth flow UI
3. **SRS Frontend Integration** - Connect SRS backend to frontend
4. **Testing** - Expand test coverage for new features
5. **Documentation** - Improve user-facing documentation