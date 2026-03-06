# AirNav Enterprise Risk Management System

## Overview
A comprehensive Enterprise Risk Management (ERM) system for AirNav Indonesia, built following SRS specifications. Features 3-level risk taxonomy, 9-parameter impact assessment with Max Impact principle, organizational hierarchy, L1/L2 workflow approval tracking with iterative review cycles, mitigation planning, and comprehensive audit trail.

## Architecture
- **Frontend**: React with TypeScript, Wouter routing, TanStack Query, Shadcn UI
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Styling**: Tailwind CSS with dark mode support

## Features
- **Dashboard**: KPIs, 5x5 risk heat map, risk level distribution, L1/L2 workflow status (6 columns), top 10 risks, taxonomy & org unit breakdowns, mitigation progress
- **Risk Register**: Full CRUD with 9-parameter impact scoring (Max Impact principle), 3-level taxonomy (T1→T2→T3), L1/L2 workflow with iterative review, auto-generated risk codes
- **Workflow Actions**: Role-based workflow buttons in risk detail dialog (Submit, Review, Approve, Return, Finalize)
- **Audit Trail**: Field-level change tracking with who/when, viewable via clickable icons on each data field
- **Mitigations**: Strategy-based (Reduce/Transfer/Avoid/Accept) with progress tracking, PIC, cost estimates, audit trail per record
- **Organizational Units**: Hierarchical tree (Head Office→Directorat→Division→Branch)
- **Taxonomy**: 3-level classification CRUD (T1 Tema → T2 Kategori → T3 Peristiwa)

## L1/L2 Workflow
- **L1 Flow**: Draft → Submitted → (Reviewer: approve or return to inputer) → Reviewed → (GM/Approval: approve L1 or return to reviewer) → L1 Approved
- **L2 Flow**: L1 Approved → L2 Review → (L2: finalize, correct, or return to L1) → L2 Finalized
- **Iteration**: Documents can go back and forth between roles until finalized
- **Line-based access**: L1 users (line=1) handle L1 transitions, L2 users (line=2) handle L2 transitions
- **Comment required**: Return/rejection actions require mandatory comments
- **Statuses**: draft, submitted, returned_to_inputer, reviewed, returned_to_reviewer, l1_approved, l2_review, l2_returned, l2_finalized

## Data Model
- `users`: id, username, password, fullName, orgUnitId, role, line (0=sysadmin, 1=L1, 2=L2), isActive
- `org_units`: id, name, parentId, type, level
- `taxonomy_t1/t2/t3`: Hierarchical risk classification
- `risks`: 9 impact params (financial, legal, compliance, reputation, market, IT, HR, HSSE, PMN), impactScore (Max), likelihoodScore, inherentRiskScore, residual scores, taxonomy refs, org unit, workflow status
- `mitigations`: riskId, strategy, actionDescription, picName, deadline, estimatedCost, progress, status
- `workflow_logs`: riskId, fromStatus, toStatus, actorName, actorRole, comments, timestamp
- `audit_trails`: tableName, recordId, fieldName, oldValue, newValue, changedBy, changedByName, changedByRole, changedAt

## Organizational Data Scoping
- Users with an orgUnitId see only risks/mitigations/stats for their org unit and all descendant units
- GM Cabang (branch level): sees all data across branch divisions and sub-divisions
- Kepala Divisi (branch_division level): sees data for their division and sub-divisions only
- Inputer/Reviewer: can see all data in their org scope but can only edit/delete risks they created themselves
- Approval role: can edit any risk within their org scope (for corrections during approval)
- Sysadmin: sees all data globally, no org restriction
- Users without orgUnitId (legacy): see all data (no org filter applied)
- Dashboard stats are also scoped to the user's org unit hierarchy

## Authentication & RBAC
- Session-based auth with express-session + connect-pg-simple
- Default users:
  - sysadmin/admin123 (line 0, full access)
  - inputer1/inputer123 (line 1, create/edit/delete risks+mitigations)
  - reviewer1/reviewer123 (line 1, L1 review)
  - approval1/approval123 (line 1, L1 approval/GM)
  - reviewer2/reviewer123 (line 2, L2 review)
  - approval2/approval123 (line 2, L2 approval)
  - Branch users (Cabang Soekarno-Hatta):
    - inputer_fin_cgt/inputer123 (inputer, Sub Divisi Finansial)
    - inputer_hr_cgt/inputer123 (inputer, Sub Divisi Personalia)
    - reviewer_ga_cgt/reviewer123 (reviewer, Kepala Divisi GA)
    - approval_gm_cgt/approval123 (approval, GM Cabang)
- Frontend AuthProvider with useAuth hook; UI gated by role and line
- Backend enforces role+line checks on all workflow transitions

## File Structure
- `shared/schema.ts` - Drizzle schema and Zod validation (including audit_trails)
- `server/db.ts` - Database connection
- `server/storage.ts` - Storage interface with Max Impact computation and audit trail auto-creation
- `server/routes.ts` - API endpoints with role+line-based workflow validation
- `server/auth.ts` - Session setup (includes line in session), requireAuth/requireRole middleware
- `server/seed.ts` - Seed data with 6 default users (L1+L2)
- `client/src/pages/login.tsx` - Login page
- `client/src/pages/dashboard.tsx` - Dashboard with L1/L2 workflow status cards
- `client/src/pages/risks.tsx` - Risk register with workflow action buttons and audit trail integration
- `client/src/pages/mitigations.tsx` - Mitigation tracking (RBAC-gated actions)
- `client/src/pages/org-units.tsx` - Organizational hierarchy
- `client/src/pages/taxonomy.tsx` - 3-level taxonomy CRUD (sysadmin only)
- `client/src/pages/users.tsx` - User management (sysadmin only)
- `client/src/lib/auth.tsx` - AuthProvider context and useAuth hook
- `client/src/lib/risk-helpers.ts` - Risk scoring utilities, status labels, workflow action definitions
- `client/src/components/audit-trail.tsx` - AuditTrailIcon (popover) and AuditTrailList components
- `client/src/components/app-sidebar.tsx` - Navigation sidebar with role-based menu
- `client/src/components/theme-provider.tsx` - Dark mode provider

## API Endpoints
- Auth: POST `/api/auth/login`, POST `/api/auth/logout`, GET `/api/auth/me`
- Users: GET/POST/PATCH/DELETE `/api/users` (sysadmin only)
- Org Units: GET/POST/PATCH/DELETE `/api/org-units`
- Taxonomy: GET/POST/PATCH/DELETE `/api/taxonomy/t1`, `/api/taxonomy/t2`, `/api/taxonomy/t3`
- Risks: GET/POST `/api/risks`, GET/PATCH/DELETE `/api/risks/:id`
- Mitigations: GET/POST `/api/mitigations`, GET `/api/mitigations/risk/:riskId`, PATCH/DELETE `/api/mitigations/:id`
- Workflow: GET `/api/workflow-logs/:riskId`, POST `/api/workflow-logs` (validates role+line transitions)
- Audit Trail: GET `/api/audit-trails/:tableName/:recordId`, GET `/api/audit-trails/:tableName/:recordId/:fieldName`
- Dashboard: GET `/api/dashboard/stats`

## Key Business Rules
- Impact Score = MAX(all 9 impact parameters)
- Inherent Risk Score = Impact Score x Likelihood Score
- Risk Levels: Rendah (1-3), Sedang (4-8), Tinggi (9-15), Sangat Tinggi (16-25)
- Workflow: Draft → Submitted → Reviewed → L1 Approved → L2 Review → L2 Finalized (with return paths)
- Return actions require mandatory comments
- Workflow transitions validated server-side by role AND line number
- Mitigation Strategies: Reduce, Transfer, Avoid, Accept
- All field-level changes tracked in audit trail with actor info and timestamps
- UI language: Indonesian (Bahasa Indonesia)
