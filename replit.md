# AirNav Enterprise Risk Management System

## Overview
A comprehensive Enterprise Risk Management (ERM) system for AirNav Indonesia, built to manage, assess, and mitigate aviation-related risks.

## Architecture
- **Frontend**: React with TypeScript, Wouter routing, TanStack Query, Shadcn UI
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Styling**: Tailwind CSS with dark mode support

## Features
- **Dashboard**: KPIs, risk heat map (likelihood x impact), risk levels, category distribution, mitigation progress
- **Risk Register**: Full CRUD for risks with likelihood/impact scoring (1-5 scale), status tracking, filtering
- **Risk Categories**: Organize risks by category (Operational, Financial, Strategic, Compliance, Technology)
- **Mitigation Plans**: Track mitigation actions linked to risks with priority, status, due dates

## Data Model
- `risk_categories`: id, name, description, color
- `risks`: id, title, description, categoryId, likelihood, impact, riskScore, status, owner, department
- `mitigations`: id, riskId, title, description, status, priority, dueDate, assignedTo

## File Structure
- `shared/schema.ts` - Drizzle schema and Zod validation
- `server/db.ts` - Database connection
- `server/storage.ts` - Storage interface (DatabaseStorage)
- `server/routes.ts` - API endpoints
- `server/seed.ts` - Seed data for initial load
- `client/src/pages/dashboard.tsx` - Dashboard with metrics and heat map
- `client/src/pages/risks.tsx` - Risk register with CRUD
- `client/src/pages/categories.tsx` - Category management
- `client/src/pages/mitigations.tsx` - Mitigation tracking
- `client/src/components/app-sidebar.tsx` - Navigation sidebar
- `client/src/components/theme-provider.tsx` - Dark mode provider

## API Endpoints
- GET/POST `/api/risk-categories`
- PATCH/DELETE `/api/risk-categories/:id`
- GET/POST `/api/risks`
- GET/PATCH/DELETE `/api/risks/:id`
- GET/POST `/api/mitigations`
- GET `/api/mitigations/risk/:riskId`
- PATCH/DELETE `/api/mitigations/:id`
- GET `/api/dashboard/stats`
