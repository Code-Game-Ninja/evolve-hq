# Phase 2: Technical Implementation Plan

This document outlines the detailed functions and components remaining for the completion of Evolve HQ.

- [x] **Inquiry Management**:
    - Functional `InquiriesClient` with split-view layout.
    - Status management (New, Read, Replied, Archived).
    - Convert to Lead workflow.
- [ ] **Lead Management**:
    - `LeadCard` component with status indicators.
    - `LeadPipeline` Kanban view for sales stages.
    - `API`: `POST /api/leads`, `PATCH /api/leads/[id]`.
- [ ] **Contact Directory**:
    - Searchable table with filtering by tag/source.
    - Profile view for each client with interaction history.
- [ ] **Analytics**:
    - Conversion rate charts (leads -> projects).

## 2. Advanced HQ Features
- [ ] **Kanban Workspace**:
    - Interactive board for `src/app/(workspace)/tasks`.
    - Real-time updates via Pusher when cards move.
- [ ] **Notification Center**:
    - Sidebar component for system-wide alerts.
    - Mark all as read function.
    - `API`: `GET /api/notifications`, `PATCH /api/notifications/read`.
- [ ] **Profile & HR**:
    - Settings page for personal info update.
    - Multi-Factor Authentication (MFA) setup (infra exists, UI needed).

## 3. Admin & CMS
- [ ] **Project Management**:
    - Internal interface to manage Evolve's portfolio.
    - Image gallery upload with Cloudinary integration.
- [ ] **Service & FAQ Editor**:
    - Dynamic form builder for managing site content.

## 4. Design & Polish (The "Wow" Factor)
- [ ] **Floating Orbs (WebGL/CSS)**:
    - Create a global `BackgroundDecoration` component.
    - Use `framer-motion` for complex path animations.
- [ ] **Glass Switchers**:
    - Replace standard Radix tabs with custom `GlassPillSwitcher`.
- [ ] **Shutter Transitions**:
    - Global layout transition for subdomain/page switching.

## 5. Critical Technical Tasks
- [x] **Middleware Refactor**:
    - Confirmed `src/proxy.ts` is the correct convention for Next.js 16+.
    - Edge compatibility for auth logic resolved.
- [x] **Build Optimization**:
    - Fixed Turbopack export issues.
    - Bundle size optimized.
- [ ] **SEO & Metadata**:
    - Implement `generateMetadata` for all dynamic routes.
