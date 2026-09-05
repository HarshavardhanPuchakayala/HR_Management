# HRCore — HR & Workforce Management Platform

A full-stack MERN application for managing employee records, leave requests, attendance, and organizational hierarchy, with Redis-backed caching and rate limiting.

## Project Status

🚧 In active development — auth and core data models complete and verified. Employee CRUD, leave workflow, attendance, and Redis integration in progress.

## Problem

Small-to-mid-size companies manage HR manually — employee records in spreadsheets, leave requests over email/Slack, no central system for org structure or attendance. HRCore centralizes employee records, leave approval (routed through the correct manager), attendance tracking, and a queryable reporting hierarchy.

## Core Features (Planned / In Progress)

- [x] Role-based authentication (admin / manager / employee), admin-provisioned accounts (no public self-signup)
- [x] Self-referencing employee hierarchy (manager/direct-report relationships)
- [ ] Employee CRUD (admin)
- [ ] Leave request submission, manager-scoped approval, admin override
- [ ] Attendance check-in/check-out with one-record-per-day enforcement
- [ ] Org chart / hierarchy views (employee's own branch vs. admin's full view)
- [ ] Redis caching for the employee directory / org chart (read-heavy, infrequently changed)
- [ ] Redis-backed rate limiting on login and other sensitive actions

## Tech Stack

**Backend:** Node.js, Express
**Database:** MongoDB, Mongoose
**Cache / Rate Limiting:** Redis
**Auth:** JWT, bcrypt

## Project Structure

```
.
├── server/
│   └── src/
│       ├── models/          # Employee, User, LeaveRequest, Attendance
│       ├── routes/
│       ├── controllers/
│       ├── middleware/      # auth (protect, requireRole factory)
│       └── config/          # DB connection, Redis client (planned)
└── README.md
```

## Data Models

- **Employee** — core HR record (name, job title, department, status); references its own `managerId` for the reporting hierarchy. Not every Employee has login access.
- **User** — login credentials linked 1:1 to an Employee, carries `role` (`admin` / `manager` / `employee`)
- **LeaveRequest** — leave submission with type, dates, status, and approval tracking (`approvedBy` references the approving `User`)
- **Attendance** — one record per employee per calendar day (enforced via compound unique index), with check-in/check-out timestamps

## Getting Started

### Backend

```bash
cd server
npm install
cp .env.example .env   # fill in MONGO_URI, JWT_SECRET, REDIS_URL
npm run dev
```

### Bootstrapping the First Admin Account

There is no public signup. The first `Employee` and `User` (admin) records must be created directly in the database as a one-time setup step; every subsequent account is created by an existing admin via `POST /api/auth/users`.

## Key Architectural Decisions

- **Employee vs. User separation** — mirrors a pattern used in an earlier project (GymTrack's Member vs. User): not everyone tracked in the HR system necessarily has login access, so identity/record-keeping (`Employee`) is kept separate from authentication (`User`).
- **Self-referencing hierarchy via `managerId`** — the simplest correct model for an org chart; direct reports are found via `Employee.find({ managerId: X })` rather than a more complex tree structure, which would be unnecessary complexity for this scale.
- **`requireRole(...allowedRoles)` middleware factory** — supports different routes requiring different role combinations (e.g., "admin only" vs. "admin or manager") without duplicating middleware functions.
- **Leave approval is relationship-scoped, not just role-scoped** — a manager can only approve their own direct reports' requests (found via the hierarchy), while an admin can override any request. This is a genuinely different authorization pattern from a fixed role check.
- **Redis chosen for two specific, real problems** — caching the employee directory/org chart (read-heavy, rarely changes) and rate-limiting sensitive actions (login, account creation) — not added as a generic technology requirement.

## Deferred to Later Phases

- **Leave balance tracking** — deferred due to real policy complexity (accrual rates, carry-over, proration, leave-type-specific rules) that would meaningfully expand scope beyond a working MVP leave workflow.
- **Bulk employee import (CSV)** — deferred; manual entry is sufficient to validate the core system, and a real bulk-import feature needs its own validation/preview/partial-failure handling.
- **Performance reviews** — a separate workflow entirely, planned as a distinct future phase.

## License

Personal learning / portfolio project — not currently licensed for reuse.