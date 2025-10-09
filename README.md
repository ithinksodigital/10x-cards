## 10x Cards

![Version](https://img.shields.io/badge/version-0.0.1-informational) ![Node](https://img.shields.io/badge/node-22.14.0-339933?logo=node.js&logoColor=white) ![Astro](https://img.shields.io/badge/astro-5-FF5D01?logo=astro&logoColor=white) ![React](https://img.shields.io/badge/react-19-61DAFB?logo=react&logoColor=061F2F) ![License](https://img.shields.io/badge/license-MIT-blue)

A modern, opinionated starter for building fast, accessible, and AI‑friendly web applications with Astro and React.

### Table of contents
- [1. Project name](#1-project-name)
- [2. Project description](#2-project-description)
- [3. Tech stack](#3-tech-stack)
- [4. Getting started locally](#4-getting-started-locally)
- [5. Available scripts](#5-available-scripts)
- [6. Project scope](#6-project-scope)
- [7. Project status](#7-project-status)
- [8. License](#8-license)

## 1. Project name

10x Cards

## 2. Project description

An Astro 5 + React 19 starter template focused on performance, accessibility, and developer experience. It includes a sensible project structure, Tailwind 4 styling, and UI building blocks, along with linting and formatting for consistent code quality.

## 3. Tech stack

- **Astro**: 5.x (app uses `astro` ^5.13.7)
- **React**: 19.x (app uses `react` ^19.1.1)
- **TypeScript**: 5.x
- **Tailwind CSS**: 4.x (via `@tailwindcss/vite`)
- **UI utilities**: `class-variance-authority`, `tailwind-merge`, `lucide-react`, Radix primitives
- **Tooling**: ESLint 9, Prettier, Husky, lint-staged

See `src/components/ui/` for ready-to-use UI components and `src/styles/global.css` for base styles.

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

## 6. Project scope

This repository serves as a foundation for building modern, content-focused applications using Astro and React:
- Preconfigured styling with Tailwind 4
- UI primitives and utilities to build accessible components
- Opinionated code quality setup (ESLint + Prettier)
- Clear, scalable file structure ready for pages, APIs, and middleware

If your product requires additional domain specifics (features, user roles, or data model), capture them in a `PRD` and link it here.

## 7. Project status

- Version: `0.0.1`
- Status: Active development (pre-release)

## 8. License

MIT
