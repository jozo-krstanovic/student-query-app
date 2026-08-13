# Student Inquiry App — Data Model Design Task

## Context

- **Frontend:** React (already built/in progress, not part of this task)
- **Backend:** PHP (already built/in progress, not part of this task)
- **Database:** Supabase (Postgres) — the PHP backend connects to Supabase for all data access. No frontend-direct Supabase access.
- **Current stage:** Designing the data model / database schema before continuing backend implementation.

## Goal of this task

Design a complete Supabase (Postgres) data model — tables, columns, types, relationships, constraints, and indexes — that supports the application described below. Where reasonable, propose migration SQL. Flag any requirement below that is ambiguous or has multiple reasonable modeling approaches, explain the trade-offs, and recommend one.

## App overview

A student inquiry management app with three categories of users: **students**, **faculty members**, and a **superuser** (admin) who manages roles and inquiry subjects. Inquiries move through a configurable, ordered approval chain involving different faculty roles.

## Functional requirements

### Students

1. Student logs in.
2. Student sees a list of their own inquiries, plus an option to add a new one.
3. When creating an inquiry:
   - Student selects a **Subject** from a pre-defined, admin-managed list of subjects.
   - Student writes the inquiry text/body.
   - Student can attach/submit one or more documents (file uploads).
   - Student submits ("completes") the inquiry.
4. On an existing inquiry's detail view, the student can:
   - Add comments.
   - View all comments (their own and faculty comments, subject to visibility rules — see Open Questions).
   - View the current state/status of the inquiry, including where it is in the approval chain.

### Faculty

1. Multiple faculty members can log in.
2. Each faculty member has a **role** (e.g., Secretary, Dean, etc. — the specific set of roles should be data-driven/configurable, not hardcoded).
3. Each role has **permissions** that define what it can do with inquiries (e.g., which inquiries it can see, and what actions it can take — approve, reject, comment, etc.).
4. When a faculty member logs in, they see inquiries relevant to their role (e.g., inquiries currently awaiting action at their step in the chain).
5. Inquiries follow a **predetermined chain of approval steps**. Example: an inquiry first requires a Secretary to "Approve," which then advances it to a Dean for the next action, and so on.
6. Faculty members can add comments to inquiries.
7. An inquiry can be **reset to the beginning of the approval chain** (by an authorized role — see Open Questions).

### Superuser / Admin

1. There is a **superuser** account type, separate from students and faculty, with its own UI.
2. The superuser can:
   - Create new **roles** (and presumably edit/deactivate them — confirm scope).
   - Create new **inquiry subjects/types**.
3. Data model should support role and subject management being done entirely through this UI (no hardcoded roles/subjects), since faculty roles and subjects are referenced by the approval chain and inquiry creation flows above.

### Notifications

- Whenever an inquiry is created or modified in any way (submitted, commented on, advanced/approved/rejected in the chain, reset, etc.), the relevant people (student owner + relevant faculty at the current/affected step) receive an **in-app notification**.

## Entities to model (starting point — adjust as needed)

- `users` — shared identity for students and faculty, or separate tables/role flag (recommend an approach)
- `roles` — e.g., Secretary, Dean, Registrar, etc. (created/managed by the superuser)
- `permissions` / `role_permissions` — what each role can do
- `subjects` — pre-defined inquiry subjects/categories (created/managed by the superuser)
- `inquiries` — core inquiry record (student owner, subject, body, current status, current chain step, timestamps)
- `inquiry_documents` — uploaded files linked to an inquiry
- `inquiry_comments` — comments linked to an inquiry and author (student or faculty)
- `approval_chains` / `chain_steps` — the ordered sequence of roles/steps an inquiry must pass through (should support different chains per subject if needed — see Open Questions)
- `inquiry_chain_progress` or `inquiry_step_history` — tracks an inquiry's current position and history through its chain (approvals, rejections, resets, who acted, when)
- `notifications` — in-app notifications per user, linked to the triggering inquiry/event

## Non-functional / implementation notes

- All access goes through the PHP backend using Supabase (likely via service-role key, not client-side RLS) — but still recommend whether Row Level Security should be enabled defensively, and how the backend should enforce authorization if not relying on RLS.
- Maintain an audit trail of chain actions (who approved/rejected/reset, when, and any notes).
- Design should support adding new roles, subjects, and chain configurations without schema changes where reasonable.

## Open questions to resolve during design (please propose sensible defaults if I don't answer these)

1. Are students and faculty the same `users` table with a type/role distinction, or separate tables?
2. Is the approval chain the same for every inquiry, or can it vary by Subject (e.g., different subjects route through different roles)?
3. Who is authorized to reset an inquiry to the start of the chain — any faculty on the chain, a specific role, or the student?
4. When an inquiry is reset, should chain history be preserved (audit trail) or cleared?
5. Can a faculty member see comments/documents on all inquiries they have visibility into, or only ones currently at their step?
6. Should rejection be modeled (chain moving backward/to student for revision) in addition to approval, or is "reset to start" the only backward path?
7. Document storage: are files stored in Supabase Storage (with a reference row in `inquiry_documents`) — confirm this is the intended approach.
8. When the superuser creates a role, does it start with no permissions (assigned separately) or can permissions be set as part of role creation?
9. When the superuser creates a new subject, does it need an approval chain assigned immediately, or can subjects exist without a chain configured yet?
10. Is there exactly one superuser, or could there be multiple superuser accounts? Should superuser be a `role`, or a distinct user type outside the roles/permissions system entirely (since it manages roles/permissions itself)?

## Deliverable

- Proposed table schemas (SQL DDL) for Postgres/Supabase.
- Entity-relationship explanation in plain language.
- Notes on indexes needed for common queries (student's own inquiries, faculty's pending-at-my-step inquiries, unread notifications per user).
- Any recommendations on enums vs. lookup tables (e.g., for inquiry status, role names).
