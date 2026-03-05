# AirNav Enterprise Risk Management System

## Overview
A comprehensive Enterprise Risk Management (ERM) system for AirNav Indonesia, built following SRS specifications. Features 3-level risk taxonomy, 9-parameter impact assessment with Max Impact principle, organizational hierarchy, workflow approval tracking, and mitigation planning.

## Architecture
- **Frontend**: React with TypeScript, Wouter routing, TanStack Query, Shadcn UI
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Styling**: Tailwind CSS with dark mode support

## Features
- **Dashboard**: KPIs, 5x5 risk heat map, risk level distribution, workflow status, top 10 risks, taxonomy & org unit breakdowns, mitigation progress
- **Risk Register**: Full CRUD with 9-parameter impact scoring (Max Impact principle), 3-level taxonomy (T1→T2→T3), workflow states (Draft→Reviewed→Approved→Validated), auto-generated risk codes
- **Mitigations**: Strategy-based (Reduce/Transfer/Avoid/Accept) with progress tracking, PIC, cost estimates
- **Organizational Units**: Hierarchical tree (Head Office→Directorat→Division→Branch)
- **Taxonomy**: 3-level classification view (T1 Tema → T2 Kategori → T3 Peristiwa)

## Data Model
- `users`: id, username, password, fullName, orgUnitId, role, line, isActive
- `org_units`: id, name, parentId, type, level
- `taxonomy_t1/t2/t3`: Hierarchical risk classification
- `risks`: 9 impact params (financial, legal, compliance, reputation, market, IT, HR, HSSE, PMN), impactScore (Max), likelihoodScore, inherentRiskScore, residual scores, taxonomy refs, org unit, workflow status
- `mitigations`: riskId, strategy, actionDescription, picName, deadline, estimatedCost, progress, status
- `workflow_logs`: riskId, fromStatus, toStatus, actorName, actorRole, comments

## File Structure
- `shared/schema.ts` - Drizzle schema and Zod validation
- `server/db.ts` - Database connection
- `server/storage.ts` - Storage interface (DatabaseStorage) with Max Impact computation
- `server/routes.ts` - API endpoints
- `server/seed.ts` - Realistic AirNav Indonesia seed data
- `client/src/pages/dashboard.tsx` - Dashboard with heatmap and analytics
- `client/src/pages/risks.tsx` - Risk register with multi-tab form
- `client/src/pages/mitigations.tsx` - Mitigation tracking
- `client/src/pages/org-units.tsx` - Organizational hierarchy
- `client/src/pages/taxonomy.tsx` - 3-level taxonomy viewer
- `client/src/components/app-sidebar.tsx` - Navigation sidebar
- `client/src/components/theme-provider.tsx` - Dark mode provider
- `client/src/lib/risk-helpers.ts` - Risk scoring utilities, labels, colors

## API Endpoints
- GET/POST/PATCH/DELETE `/api/org-units`
- GET `/api/taxonomy/t1`, `/api/taxonomy/t2?t1Id=`, `/api/taxonomy/t3?t2Id=`
- GET/POST `/api/risks`, GET/PATCH/DELETE `/api/risks/:id`
- GET/POST `/api/mitigations`, GET `/api/mitigations/risk/:riskId`, PATCH/DELETE `/api/mitigations/:id`
- GET `/api/workflow-logs/:riskId`, POST `/api/workflow-logs`
- GET `/api/dashboard/stats`

## Key Business Rules
- Impact Score = MAX(all 9 impact parameters)
- Inherent Risk Score = Impact Score × Likelihood Score
- Risk Levels: Rendah (1-3), Sedang (4-8), Tinggi (9-15), Sangat Tinggi (16-25)
- Workflow: Draft → Reviewed → Approved → Validated (with sent_back option)
- Mitigation Strategies: Reduce, Transfer, Avoid, Accept
- UI language: Indonesian (Bahasa Indonesia)
