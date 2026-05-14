# TicketHub — IT Support Ticket Management Interface

TicketHub is a modern, role-based IT support ticketing platform built with **Next.js 16** and **React 19**. It provides tailored dashboards for three types of users — Admins, Technicians, and Clients — and connects to a separate REST/SSE backend.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Features Overview](#features-overview)
- [User Roles](#user-roles)
- [Pages & Dashboards](#pages--dashboards)
  - [Public Pages](#public-pages)
  - [Admin Dashboard](#admin-dashboard)
  - [Technician Dashboard](#technician-dashboard)
  - [Client Dashboard](#client-dashboard)
- [Ticket Lifecycle](#ticket-lifecycle)
- [Real-Time Notifications (SSE)](#real-time-notifications-sse)
- [Authentication & Route Protection](#authentication--route-protection)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 16](https://nextjs.org) (App Router) |
| UI Library | [React 19](https://react.dev) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com) |
| Animations | [Framer Motion](https://www.framer.com/motion/) |
| HTTP Client | [Axios](https://axios-http.com) |
| Authentication | JWT (`jwt-decode`) stored in cookies & localStorage |
| Icons | [Lucide React](https://lucide.dev) |
| Toast Notifications | [react-hot-toast](https://react-hot-toast.com) |
| Real-Time Updates | Server-Sent Events (SSE) |
| Linting | ESLint (Next.js config) |

---

## Features Overview

- **Role-based access control** — three distinct portals (Admin, Technician, Client) with middleware-enforced route guards
- **Ticket management** — create, view, filter, assign, update status, and resolve tickets
- **SLA tracking** — 2-hour SLA deadline enforcement for CRITICAL tickets with visual breach alerts
- **Real-time notifications** — live SSE stream for ticket updates, role-specific messages, unread count badge, and auto-reconnect
- **Admin user management** — approve pending registrations, view all users, and create new accounts
- **Technician management** — view all technicians, active ticket counts, and availability status
- **Reports & analytics** — KPI cards, bar charts by category, average resolution time, and more
- **Resolved ticket history** — grouped by category with expandable resolution details and SLA breach indicators
- **Responsive design** — fixed sidebar on desktop, slide-out drawer on mobile

---

## User Roles

| Role | Access |
|---|---|
| **Admin** | Full platform access — manage tickets, users, technicians, reports, and history |
| **Technician** | View and action assigned tickets; update status to In Progress or Resolved |
| **Client** | Submit new tickets and track the status of their own requests |

---

## Pages & Dashboards

### Public Pages

| Route | Description |
|---|---|
| `/` | Landing page with Sign In and Request Access links |
| `/login` | JWT login form; stores token in cookie and localStorage |
| `/register` | Self-registration form; account is pending until approved by an Admin |

> Accounts registered through `/register` start with `enabled = false`. The Admin must approve them before they can log in.

---

### Admin Dashboard

Accessible at `/dashboard/admin` — requires the `admin` role.

#### Overview (`/dashboard/admin`)
- Summary cards: **SLA Breaches**, **Active Technicians**, **Critical Tickets**, **Resolved Today**
- SLA breach banner with a direct link to the tickets list
- Recent tickets table (5 most recent, sorted by creation date) with priority-coloured left borders
- Critical ticket rows animate to draw attention to breached SLAs
- Auto-refreshes every 60 seconds

#### Tickets (`/dashboard/admin/tickets`)
- Full paginated ticket list with filtering by **status**, **priority**, **category**, and **keyword**
- Inline ticket detail panel: description, assignee, SLA countdown
- **Accept** new tickets (NEW → ACCEPTED)
- **Assign** tickets to a technician from a dropdown (shows each technician's active ticket count)
- Priority-coloured left borders (Critical = red, High = orange, Medium = yellow, Low = blue)

#### Technicians (`/dashboard/admin/technicians`)
- Summary stats: Total, Busy, and Available technician counts
- Expandable rows showing each technician's assigned ticket list

#### User Management (`/dashboard/admin/users`)
- **Pending Approvals** tab — approve newly registered accounts; badge shows pending count
- **All Users** tab — view all registered users with role, status, and join date
- **Create User** modal — add a new Client or Technician account directly (name, email, phone, password, role)
- Pending count badge also appears on the sidebar nav item

#### Reports (`/dashboard/admin/reports`)
- KPI cards: Total Tickets, Open/Active, Resolved Today, Critical SLA violations, Total Users, Average Resolution Time
- Bar chart: Tickets by Category (Network, Software, Hardware, Security, Access, Other)
- Manual refresh button

#### History (`/dashboard/admin/history`)
- Resolved and closed tickets grouped by category
- Per-category average resolution time
- Expandable rows: original request description alongside the technician's resolution notes
- SLA breach indicator with `SLA BREACH` badge for tickets resolved after their deadline

---

### Technician Dashboard

Accessible at `/dashboard/technician` — requires the `technician` role.

#### Overview (`/dashboard/technician`)
- Personalised welcome message
- Stats cards: **My Assigned Tickets**, **In Progress**, **Critical Priority**, **Resolved Today**
- SLA breach banner for critical overdue tickets
- Recent tickets table (5 most recent) with inline actions:
  - **Start Work** — transitions ticket from NEW/ACCEPTED → IN_PROGRESS
  - **Resolve** — opens an inline solution textarea; submits with RESOLVED status

#### Assigned Tickets (`/technician/tickets`)
- Full paginated table of tickets assigned to the current technician
- SLA countdown displayed for CRITICAL tickets (green = within SLA, amber = approaching, red = overdue/breached)

#### History (`/technician/history`)
- View of past resolved tickets assigned to the technician

---

### Client Dashboard

Accessible at `/dashboard/client` — requires the `client` role.

#### Overview (`/dashboard/client`)
- Summary of the client's tickets by status
- Quick links to submit a new ticket or view existing ones

#### Submit Ticket (`/dashboard/client/new-ticket`)
- Form fields: **Title**, **Description**, **Priority** (Low / Medium / High / Critical), **Category** (Network / Hardware / Software / Access)
- Redirects to the tickets list on successful submission

#### My Tickets (`/dashboard/client/tickets`)
- Paginated list of the client's submitted tickets
- Filter by status and priority
- Live status and priority badges

---

## Ticket Lifecycle

```
NEW → ACCEPTED → IN_PROGRESS → RESOLVED → CLOSED
```

| Status | Actor | Description |
|---|---|---|
| `NEW` | System | Ticket created by a client |
| `ACCEPTED` | Admin | Admin accepts and queues the ticket |
| `IN_PROGRESS` | Technician | Technician starts working on the ticket |
| `RESOLVED` | Technician | Technician submits a solution |
| `CLOSED` | System/Admin | Ticket is fully closed |

**Priorities:** `LOW` · `MEDIUM` · `HIGH` · `CRITICAL`

**Categories:** `NETWORK` · `HARDWARE` · `SOFTWARE` · `ACCESS` · `SECURITY` · `OTHER`

> **SLA:** CRITICAL tickets carry a **2-hour SLA deadline**. Breach is highlighted in the Admin overview, Admin history, and the Technician dashboard with animated banners and red indicators.

---

## Real-Time Notifications (SSE)

- Connects to `NEXT_PUBLIC_API_BASE_URL/api/notifications/subscribe?token=<jwt>` on login
- Listens for `message` and `ticket-update` SSE events
- Displays toast notifications for new/updated tickets
- Role-specific notification labels (e.g. "New Ticket Alert" for admins, "New Assignment" for technicians, "Being Worked On" for clients)
- Unread count badge on the Bell icon in the sidebar footer
- Clicking a notification navigates to the relevant ticket
- Auto-reconnects with exponential backoff (up to 5 retries)
- Watchdog poll every 15 seconds to detect silently closed connections
- Reconnects on browser tab visibility change

---

## Authentication & Route Protection

Authentication state is stored in:
- `th_token` — JWT access token (cookie + localStorage)
- `th_role` — user role (cookie)
- `th_enabled` — account enabled flag (cookie)

**Middleware** (`middleware.js`) intercepts every `/dashboard/**` request:
1. Redirects to `/login?redirect=<path>` if no token or role is present
2. Redirects to `/login?pending=1` if the account is not yet enabled
3. Redirects to the user's own dashboard home if they attempt to access a route for a different role

| Route prefix | Allowed roles |
|---|---|
| `/dashboard/admin/**` | admin |
| `/dashboard/technician/**` | admin, technician |
| `/dashboard/client/**` | admin, client |

---

## Project Structure

```
tickethub_interface/
├── middleware.js              # Route guard (auth + role enforcement)
├── next.config.mjs
├── src/
│   ├── app/
│   │   ├── (auth)/            # Login & Register pages
│   │   ├── (dashboard)/       # Protected dashboard routes
│   │   │   └── dashboard/
│   │   │       ├── admin/     # Overview, Tickets, Technicians, Users, Reports, History
│   │   │       ├── technician/# Technician overview
│   │   │       └── client/    # Client overview, New Ticket, My Tickets
│   │   ├── page.js            # Landing page
│   │   └── providers.js       # App-level context providers
│   ├── components/
│   │   ├── features/          # Page-level smart components
│   │   │   ├── AdminOverviewPanel.jsx
│   │   │   ├── AdminHistoryPanel.jsx
│   │   │   ├── ClientDashboardPanel.js
│   │   │   ├── ClientTicketsPanel.js
│   │   │   ├── LoginForm.js
│   │   │   ├── RegisterForm.js
│   │   │   ├── NotificationDropdown.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── TechnicianTicketsTable.js
│   │   │   ├── TicketActions.js
│   │   │   ├── TicketCard.js
│   │   │   └── TicketForm.js
│   │   ├── layouts/           # AdminLayout, DashboardLayout, TechLayout
│   │   └── ui/                # Button, Input, HasRole, PriorityBadge, StatusBadge
│   ├── constants/
│   │   ├── roles.js           # ROLES enum (admin, technician, client)
│   │   └── routes.js          # ROUTES map
│   ├── context/
│   │   ├── AuthContext.js
│   │   └── NotificationContext.js   # SSE connection & notification state
│   ├── hooks/
│   │   ├── useAuth.js
│   │   └── useFetch.js
│   ├── services/
│   │   └── api.js             # Axios instance + all API helpers
│   ├── types/
│   └── utils/
│       └── dateUtils.js       # SLA formatting helpers
└── public/
    └── TicketHub_LogoNOBG.png
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- A running TicketHub backend (default: `http://localhost:8080`)

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production build

```bash
npm run build
npm run start
```

---

## Environment Variables

Create a `.env.local` file in the project root:

```env
# Base URL for the TicketHub backend API
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
```

If `NEXT_PUBLIC_API_BASE_URL` is not set, the Axios client falls back to `/api` (relative, for proxied setups).

---

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start the Next.js development server |
| `npm run build` | Build for production |
| `npm run start` | Start the production server |
| `npm run lint` | Run ESLint |
