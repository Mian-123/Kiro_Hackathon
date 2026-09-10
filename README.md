# CivicPulse Lahore

**See it. Report it. Verify it. Resolve it.**

CivicPulse is a civic incident reporting and accountability platform for Lahore, Pakistan. Citizens report infrastructure problems from their phone; AI turns thousands of unstructured observations into actionable civic intelligence; and a verified workflow tracks every issue from report to resolution — with humans accountable at every step.

> **We are not replacing civic workers with AI. We use AI to reduce the intelligence bottleneck between thousands of citizen observations and actionable civic incidents.**

---

## Table of Contents

- [The Problem](#the-problem)
- [What CivicPulse Does](#what-civicpulse-does)
- [The Six Roles (App Tabs)](#the-six-roles-app-tabs)
- [The Civic Lifecycle](#the-civic-lifecycle)
- [Where AI Is Used (and Where It Isn't)](#where-ai-is-used-and-where-it-isnt)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [AI Providers](#ai-providers)
- [Demo Walkthrough](#demo-walkthrough)

---

## The Problem

Civic complaint systems in large cities break down in predictable ways. CivicPulse targets seven of them:

| # | Problem | How CivicPulse solves it |
|---|---------|--------------------------|
| 1 | **Complaints are fragmented** — each report is an isolated case | Converts reports into structured civic records linked to a common **Civic Incident** |
| 2 | **Many people report the same physical problem** — 10 reports treated as 10 cases | Groups related reports: *10 observations → 1 Civic Incident + 10 supporting reports* |
| 3 | **Reports lack trustworthy context** | Captures location, time, photo, description, category, evidence and full history |
| 4 | **No single operational picture** | One workflow: Citizen → Civic Incident → UC Officer → Work Order → Contractor → Verification |
| 5 | **"Resolved" doesn't mean actually fixed** | Multi-stage verification: Contractor evidence → Street Rep → Citizen confirmation (reject → reopened) |
| 6 | **Citizens can't see what's happening** | Live tracking, status timeline with timestamps, resolution evidence, map view |
| 7 | **Government lacks geographic intelligence** | Real maps showing issue locations, density, hotspots and areas needing attention |

---

## What CivicPulse Does

- **Structured reporting** — a guided mobile flow captures photo, GPS location + reverse-geocoded address, category (English / Urdu / Roman Urdu), and description.
- **AI triage** — classification, severity, duplicate detection and priority scoring run automatically in the background so the citizen never waits.
- **Sensitive-location awareness** — reports within 500m of a hospital or school are automatically flagged and prioritised.
- **Accountable resolution** — work orders flow to contractors, who upload completion evidence; Street Reps verify on the ground; citizens confirm and rate.
- **Command dashboards** — UC Officer and Mayor/Ops dashboards give operational and city-wide oversight with league tables, budgets, contractor oversight and enforcement.

---

## The Six Roles (App Tabs)

CivicPulse ships as an interactive prototype with a role switcher across the top. Each role is a fully working view sharing live state.

### 1. Citizen (mobile app)
- Report a problem through a 5-step wizard: **Evidence → Location → Category → Description → Review**
- GPS auto-detection with address + coordinates
- "What is the problem?" category grid with Urdu labels
- AI priority notice when near a hospital/school
- Track reports with a timestamped status timeline
- Verify and rate completed work to release payment
- Delete a report (removes it everywhere)

### 2. Street Rep (mobile app)
- Verify citizen reports on the ground (view citizen photo, upload own ground photo)
- Verify completed contractor work — approve or **return the job** (dispute)
- Ward street health scores, field notes, escalations, citizen messages

### 3. UC Officer (operations dashboard)
- Single-page command view for a Union Council
- KPI cards, live street map, complaint queue with **Needs Review / In Process / Active** tabs
- AI-merge indicators showing how many reports were combined
- Create Work Order → assign a contractor (with ratings and workload)
- Street rankings, representative performance, budget
- Disputes banner + Completed Jobs & Work Records table

### 4. Contractor (mobile portal)
- See assigned work orders
- **Start Work** → **Complete** with a completion photo
- Track job status and payment

### 5. Mayor / Ops (city command center)
- City-wide KPIs (citywide street score, complaints today, resolved on time, streets in red)
- District league table, urgent streets board, contractor oversight, budget & enforcement
- Department performance table, category distribution, Union Council issue breakdown

### 6. Admin (governance)
- User, department and category management
- Incident merge/split, configuration (AI thresholds, priority weights), audit log

---

## The Civic Lifecycle

```
Citizen reports
      │
      ▼
AI triage  (classify · severity · duplicate check · priority)
      │
      ▼
Street Rep verifies on ground  (photo)
      │
      ▼
UC Officer creates Work Order  →  assigns Contractor
      │
      ▼
Contractor starts work  →  completes + uploads evidence
      │
      ▼
Street Rep verifies completed work  (approve  /  return job → dispute)
      │
      ▼
Citizen confirms & rates  →  RESOLVED   (reject → REOPENED)
```

Every transition is timestamped and visible on the citizen's tracker.

---

## Where AI Is Used (and Where It Isn't)

The civic workflow itself does **not** require AI. What requires AI is turning unstructured, high-volume citizen observations into usable civic intelligence. CivicPulse uses AI only where volume, ambiguity, visual evidence, and similarity make manual processing impractical at city scale.

### AI functions

| Function | What it does | Model |
|----------|--------------|-------|
| **Image understanding** | Interprets uploaded photos ("accumulated garbage near a roadside", "damaged road surface") | Groq Llama 4 Scout (vision) |
| **Issue classification** | Sorts an unstructured report into one of 10 civic categories | Groq Llama 4 Scout |
| **Severity assessment** | Estimates apparent severity (low → critical) from the evidence | Groq Llama 4 Scout |
| **Duplicate / similarity detection** | Compares distance, time, category, semantic text similarity and image similarity to detect that multiple reports describe **one** physical incident | sentence-transformers + imagehash (local) |
| **Incident prioritisation** | Combines severity, citizen support, population density, location sensitivity (hospital/school within 500m) and duration into a 0–100 score | 5-factor formula + Groq Llama 3.3 70B reasoning |

> **AI recommends. Humans decide.** Every AI output is advisory and overridable by officers and admins.

### The strongest AI use case — duplicate detection at scale

With 100,000 reports, there are millions of possible report-to-report comparisons. A human cannot inspect every combination. AI-assisted similarity turns duplicate detection from a manual search problem into an automated intelligence problem — combining text, image, location and time signals that a keyword search cannot understand.

### What does NOT require AI (deterministic software by design)

Authentication · database · GPS · timestamps · maps · work orders · contractor workflow · status tracking · evidence storage · verification · notifications · dashboards.

CivicPulse is not "AI everywhere." It uses AI where intelligence is needed and deterministic software where deterministic software is better.

---

## Tech Stack

**Frontend**
- Next.js 16 + React 19 (App Router)
- TypeScript
- Tailwind CSS v4
- MapLibre GL + OpenStreetMap (real interactive maps)
- Shared in-browser app-state for the live cross-role demo

**Backend**
- FastAPI (Python)
- Pydantic v2 schemas
- Groq API (Llama 4 Scout vision + Llama 3.3 70B text)
- sentence-transformers + imagehash for local semantic/visual duplicate detection
- Pluggable AI provider layer: `mock` | `local` | `groq`
- Structured logging (structlog)

---

## Project Structure

```
Civic_Lab/
├── frontend/                     Next.js app
│   ├── app/                      routes + layout
│   ├── components/
│   │   ├── roles/                CitizenApp, StreetRepApp, DepartmentApp (UC Officer),
│   │   │                         ContractorApp, MinistryApp (Mayor/Ops), AdminApp
│   │   └── ui/                   LiveMap, Timeline, StatusChip, Icons, etc.
│   └── lib/                      app-state (shared live state), mock-data, utils
│
└── backend/                      FastAPI app
    ├── app/
    │   ├── ai_services/          AI layer — providers + operations
    │   │   ├── classifier.py     Operation 1: classify_report
    │   │   ├── deduplicator.py   Operation 2: check_duplicate
    │   │   ├── priority_scorer.py Operation 3: calculate_priority
    │   │   └── providers/        mock / local / groq
    │   ├── routers/              reports, incidents, department, ministry, admin, ai
    │   ├── services/             mock DB
    │   ├── models/               enums + schemas
    │   └── core/                 auth + RBAC
    ├── requirements.txt          full deps (includes local ML)
    └── requirements-min.txt      minimal deps (Groq only, no ML compile)
```

---

## Getting Started

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:3000** and use the role switcher in the top bar.

### Backend

```bash
cd backend
pip install -r requirements-min.txt      # fast path: Groq AI, no ML compilation
# or: pip install -r requirements.txt    # full stack incl. local semantic dedup

uvicorn app.main:app --reload --port 8000
```

API runs at **http://127.0.0.1:8000** · interactive docs at **/docs**.

Copy `.env.example` to `.env` and set your Groq key:

```
AI_PROVIDER=groq
GROQ_API_KEY=gsk_your_key_here
```

> The frontend prototype runs entirely in-browser for the live cross-role demo, so the backend is only needed to exercise the real Groq AI endpoints.

---

## AI Providers

Set `AI_PROVIDER` in `backend/.env`:

| Value | Behaviour |
|-------|-----------|
| `mock` | Deterministic keyword rules. No API, no ML. Always works — great for demos. |
| `local` | Offline sentence-transformers + imagehash for real semantic/visual dedup. No API key. |
| `groq` | Groq API for vision classification + priority reasoning; local models for dedup. Best accuracy. |

All three implement the same interface, so switching is a one-line config change.

---

## Demo Walkthrough

1. **Citizen** → Report a Problem → add photo → confirm GPS (pin near a hospital to trigger the AI priority notice) → pick a category → submit → get a complaint number instantly.
2. **Street Rep** → Verify reports → view the citizen photo → take a ground photo → confirm.
3. **UC Officer** → Complaint queue → see AI-merge counts → **Create work order** → assign a contractor.
4. **Contractor** → open the assigned job → **Start Work** → **Complete** + upload after-photo.
5. **Street Rep** → Verify completed work → approve or **return job** (dispute shows on the UC dashboard).
6. **Citizen** → My Reports → see the timestamped timeline → rate the work → **RESOLVED**.
7. **Mayor / Ops** → city-wide command center with league tables, hotspots, budget and enforcement.

---

*CivicPulse Lahore — interactive prototype · Next.js + FastAPI + Groq · built for the Kiro Hackathon.*
