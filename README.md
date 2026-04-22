# EVOLVE HQ

Internal workspace, admin console, and CRM for [EVOLVE PRIVATE LIMITED](https://evolve.agency) — served from a single Next.js codebase across three subdomains.

| Subdomain | Purpose | Access |
|-----------|---------|--------|
| `hq.evolve.agency` | Employee workspace | All employees |
| `admin.evolve.agency` | Admin console | admin, superadmin |
| `crm.evolve.agency` | CRM system | BA/BD positions + admin/superadmin |

---

## Tech Stack

- **Framework** — Next.js 16+ (App Router, TypeScript)
- **Auth** — NextAuth.js v5, session cookie shared across `.evolve.agency`
- **Database** — MongoDB 8 + Mongoose 8
- **UI** — Tailwind CSS 4 + shadcn/ui
- **Deployment** — Docker Compose on VPS (see [Dockerfile](./Dockerfile))

---

## Local Development

### 1. Install dependencies

```bash
npm install --legacy-peer-deps
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

```
AUTH_SECRET=<random 32+ char string>
AUTH_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3000
MONGODB_URI=mongodb://localhost:27017/evolve
CONTACT_EMAIL=hello@evolve.agency
NEXT_PUBLIC_HQ_URL=http://localhost:3000
NEXT_PUBLIC_ADMIN_URL=http://localhost:3000
NEXT_PUBLIC_CRM_URL=http://localhost:3000
```

### 3. Start dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```
src/
├── app/
│   ├── (workspace)/          # hq.evolve.agency — employee pages
│   │   ├── dashboard/
│   │   ├── tasks/
│   │   ├── attendance/
│   │   ├── leaves/
│   │   ├── meetings/
│   │   └── profile/
│   ├── (admin)/              # admin.evolve.agency — admin console
│   │   └── admin/
│   │       ├── cms/          # Projects, Services, Testimonials, FAQ, Inquiries
│   │       ├── hr/           # Attendance reports, leave approvals
│   │       ├── tasks/        # All-employee task management
│   │       ├── team/
│   │       └── settings/
│   ├── (crm)/                # crm.evolve.agency — CRM
│   │   └── crm/
│   │       ├── contacts/
│   │       ├── deals/
│   │       └── activities/
│   ├── api/
│   │   ├── admin/            # Admin-only API routes
│   │   ├── public/           # Unauthenticated routes (consumed by evolve.agency)
│   │   ├── tasks/
│   │   ├── meetings/
│   │   └── me/
│   └── login/
├── components/
│   └── layout/               # WorkspaceSidebar, AdminSidebar, CRMSidebar, Header
├── lib/
│   ├── auth/auth.ts          # NextAuth config
│   ├── db/mongodb.ts         # Mongoose connection singleton
│   ├── db/models/            # All Mongoose models
│   └── rate-limit.ts        # Login rate limiter (10 req / 15 min per IP)
└── middleware.ts             # Subdomain routing + role-based access control
```

---

## Roles & Access

| Role | HQ | Admin Console | CRM |
|------|----|---------------|-----|
| `employee` | Full | No | No |
| `manager` | Full | Limited | No |
| `admin` | Full | Full | Full |
| `superadmin` | Full | Full (+ user mgmt) | Full |

CRM access is **position-based**: employees with position `BA` or `BD` get CRM access regardless of role.

---

## Docker Deployment

The app uses `output: "standalone"` for a minimal ~120 MB runtime image.

```bash
# Build and start app + MongoDB
docker compose up --build evolve-hq mongodb -d

# View logs
docker compose logs -f evolve-hq
```

See the root `docker-compose.yml` and `tech/VPS_SETUP.md` for full deployment instructions.
