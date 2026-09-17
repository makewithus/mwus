<USER_REQUEST>
intercept-console-error.ts:48 Error fetching developers: FirebaseError: The query requires an index. You can create it here: https://console.firebase.google.com/v1/r/project/mwus-556a1/firestore/indexes?create_composite=Ckhwcm9qZWN0cy9td3VzLTU1NmExL2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy91c2Vycy9pbmRleGVzL18QARoICgRyb2xlEAEaDQoJY3JlYXRlZEF0EAIaDAoIX19uYW1lX18QAg

forward-logs-shared.ts:120 [Fast Refresh] rebuilding
forward-logs-shared.ts:120 [Fast Refresh] done in 436ms
projects:1 
 Failed to load resource: the server responded with a status of 404 (Not Found)

fix this ans also 

CLIENT PROJECT
TRACKING PORTAL
V1 FUNCTIONAL DOCUMENTATION
────────────────────────────────────────────────────────────────────────────────────────────
A focused project tracking and client portal for MakeWithUs. The system keeps Admin, Developers and Clients aligned while enforcing strict role-based access and maintaining a complete audit trail.

ROLE
PRIMARY PURPOSE
VISIBILITY
ADMIN
Full management and oversight
All clients, projects and audit data
DEVELOPER
Execute and update assigned work
Assigned projects only
CLIENT
Understand project progress
Own projects only

CORE PRINCIPLE
Admin sees everything. Developers see only assigned projects. Clients see only their own projects. Every important change is attributable to a user and timestamp.

01  PURPOSE & SCOPE
The V1 system is an internal project tracking system with a client-facing portal. It is designed to make project status, scope, milestones and updates visible without exposing internal information that the client or developer should not access.
• Track each client and their projects from onboarding to completion.
• Allow Admin to define scope, milestones, assignments and project status.
• Allow assigned Developers to update only the projects assigned to them.
• Allow Clients to view only their own projects and client-visible information.
• Provide a visual progress tracker showing the complete project journey.
• Maintain a reliable audit history of important changes.
02  USER ROLES & PERMISSIONS
AREA
ADMIN
DEVELOPER
CLIENT
Clients
Full CRUD
No
Own account only
Projects
Full CRUD
Assigned only
Own projects only
Assign developers
Yes
No
No
Scope
Create / edit
View
View
Milestones
Full control
Update assigned
View
Progress
Full control
Update assigned
View
Updates
Add / edit
Add / edit assigned
View client-visible
Internal notes
View / manage
Assigned projects
No
Audit log
Full access
No
No
User access
Full control
No
No

03  END-TO-END WORKFLOW
ADMIN FLOW
Login → Dashboard → Create Client → Create Project → Define Scope → Create Milestones → Assign Developer → Monitor Updates → Complete Project
DEVELOPER FLOW
Login → My Projects → Select Assigned Project → View Scope & Progress → Update Milestones → Update Progress → Post Update → Set Next Step / Blocker → Complete
CLIENT FLOW
Login → My Projects → Select Project → View Progress Bar → View Project Journey → View Scope → View Latest Updates → View Timeline
04  CLIENT MANAGEMENT
Admin creates and manages client accounts.
FIELD
REQUIRED
NOTES
Company name
Yes
Client/company display name
Contact person
Yes
Primary contact
Email
Yes
Used for account/access
Phone
Yes
Contact number
Country / Location
Yes
Client location
Login / access setup
Yes
Portal access
Website
Optional
Client website
Notes
Optional
Admin-only information
Client source
Optional
Referral, outbound, etc.

05  PROJECT MANAGEMENT
Each project belongs to a client and can be assigned to one or more developers by Admin.
• Project name
• Client
• Description
• Assigned developer(s)
• Start date
• Expected delivery date
• Project status
• Project health
• Project scope
• Milestones
• Progress
Recommended project statuses: Onboarding · In Progress · Client Review · Revisions · Finalization · Delivered · Completed · On Hold
Project health: On Track · At Risk · Delayed · On Hold
06  PROJECT SCOPE
Admin defines what the client purchased. Scope is visible to the Client and assigned Developer, while only Admin controls scope changes.
SCOPE EXAMPLE
STATUS
Home page
Included
About page
Included
Services page
Included
Contact page
Included
WhatsApp integration
Included
Responsive design
Included

Scope changes must be audited. Example: 'Gallery page added — changed by Admin — 15 Sep 2026.'
07  MILESTONES & VISUAL PROGRESS TRACKER
The progress tracker is a core V1 feature. It must allow a client to understand the entire project journey at a glance, not just see a percentage.
Example project journey:
✓ Requirements  →  ✓ UI Design  →  ● Development  →  ○ Client Review  →  ○ Final Testing  →  ○ Deployment
VISUAL STATE
MEANING
✓ Completed
Stage has been completed
● Current
Stage currently in progress
○ Upcoming
Stage not started
! Blocked
Stage cannot proceed until blocker is resolved

Progress display: 65% COMPLETE  |  ████████████████░░░░░░  |  CURRENT STAGE: DEVELOPMENT
Preferred V1 behavior: Calculate overall progress from milestone completion where practical. If manual percentage is used in V1, keep progress, current stage and project status consistent.
08  PROJECT UPDATES
Admin and assigned Developers can post project updates. Each update must specify whether it is client-visible or internal.
TYPE
VISIBLE TO
EXAMPLE
Client Visible
Admin + Assigned Developer + Client
Homepage and service pages are complete. Mobile optimization is in progress.
Internal
Admin + Assigned Developer
Waiting for client to provide final images.

09  TIMELINE
Important project events should be automatically recorded in chronological order.
Example: 14 Sep — Developer posted update → 13 Sep — Developer assigned → 12 Sep — Project created → 12 Sep — Scope created → 11 Sep — Client account created.
10  SCREEN REQUIREMENTS
ADMIN DASHBOARD
• Total clients
• Active projects
• Completed projects
• Projects at risk
• Projects nearing deadline
• Projects waiting for client
• Recently updated projects
• Projects without recent updates
DEVELOPER DASHBOARD
• Show only assigned projects.
• Show project name, progress, current stage, health and delivery date.
• Provide access to project scope, milestones, updates and project actions.
CLIENT PROJECT PAGE
• Project name and description
• Large overall progress percentage
• Clear visual progress bar
• Complete stage-by-stage project journey
• Current stage
• Expected delivery date
• Project scope
• Latest client-visible update
• Next step
• Project timeline
11  AUDIT LOG — CRITICAL REQUIREMENT
Admin must be able to determine who changed what, when it changed, and what the previous and new values were.
EVENT
EXAMPLE
Progress change
Rahul — 55% → 65% — 14 Sep 10:42 AM
Developer assignment
Admin — Unassigned → Rahul — 13 Sep 04:20 PM
Delivery date
Admin — 18 Sep → 20 Sep — 13 Sep 02:15 PM
Project update
Rahul — Added client-visible update — 14 Sep 10:40 AM
Scope change
Admin — Added Gallery page — 15 Sep

• Audit record must include user, role, action, date/time, affected client/project, previous value, new value and relevant description.
• Normal users must never be able to edit or delete audit records.
• Treat audit history as append-only wherever possible.
12  SECURITY & ACCESS CONTROL
Authorization must be enforced on the backend. Hiding menus or pages in the frontend is not sufficient.
• A Developer can access only projects assigned to that Developer.
• A Client can access only projects belonging to that Client account.
• Changing a project ID in a URL or request must not bypass authorization.
• Admin can access all projects and users.
• All protected project reads and writes must validate the current user's role and relationship to the project.
• Client-visible and internal information must be separated at the permission level.
Required authorization concept: Logged-in User → Identify Role → Check Project Ownership / Assignment → Check Permission → Allow / Deny
13  CORE DATA RELATIONSHIPS
CLIENT → has many PROJECTS → each PROJECT has SCOPE, MILESTONES, PROGRESS, UPDATES, TIMELINE and AUDIT LOG → PROJECT is assigned to DEVELOPER(S).
ENTITY
RELATIONSHIP / PURPOSE
Client
Owns one or more projects and has portal access
Project
Central record for delivery and visibility
Developer
Works only on assigned projects
Scope
Defines agreed deliverables
Milestone
Represents a project stage
Progress
Overall completion and current stage
Update
Human-readable project communication
Timeline
Chronological project events
Audit Log
Immutable history of important changes

14  UI / DESIGN SYSTEM REQUIREMENTS
• Primary font family: Space Mono.
• Use Space Mono consistently across headings, body text, buttons, navigation, cards, tables, status labels and progress information.
• All cards must have sharp edges. Avoid large border-radius, bubble-style UI and excessive glassmorphism.
• Use clear borders, spacing and hierarchy instead of decorative effects.
• Overall visual direction: clean, sharp, technical, professional and minimal.
Theme modes: Light Mode · Dark Mode · System Mode
• Light mode must provide a clean light interface.
• Dark mode must provide a complete dark interface.
• System mode must follow the operating system preference.
• Theme selection should persist for the user.
• All screens and components must support all three modes consistently.
15  V1 BOUNDARIES
Keep V1 focused on project transparency, progress tracking, role-based access and auditability.
• Do not add payment gateway.
• Do not add invoicing.
• Do not add chat.
• Do not add file management.
• Do not add AI features.
• Do not add CRM functionality.
• Do not add advanced task management.
• Do not add time tracking.
• Do not add automated billing.
• Do not add complex reporting.
• Do not add client approvals.
• Do not add WhatsApp integration as a portal feature.
• Do not add email automation.
16  V1 ACCEPTANCE CRITERIA
#
REQUIREMENT
MUST PASS
01
Role separation
Admin / Developer / Client permissions are enforced.
02
Developer isolation
Developer can see and modify only assigned projects.
03
Client isolation
Client can see only their own projects.
04
Progress tracker
Client can understand progress and stages at a glance.
05
Scope visibility
Client and assigned Developer can see agreed scope.
06
Updates
Admin/Developer can publish client-visible and internal updates.
07
Timeline
Important project events are recorded chronologically.
08
Audit
Admin can see who changed what and when.
09
Themes
Light, Dark and System modes work throughout the app.
10
Typography
Space Mono is used consistently.
11
Card style
Cards use sharp edges, not rounded/bubble styling.
12
Backend authorization
Direct URL/request manipulation cannot bypass access control.


As per the features said by the CTO make sure each and every feature are created properly ,  in terms of UI and functionality and backend  and make sure each and every feature shoudl work as expected and  as per the functionality7 aexpected as per the doc , in the current codebase as well if required add proper validations in all the edge cases that can be comes when we make it to available to the company and in real time it wil be use also ad toast success and error mesaages instead of displaying the response there itself at the same time make sure for the appropriate functions the toast error or success or warnkg shoud be shoot and also add the dark and light theme toggle in thisand dark theme be equaly good and properly aligned 
</USER_REQUEST>
<ADDITIONAL_METADATA>
The current local time is: 2026-09-16T21:28:14+05:30.

The user's current state is as follows:
Active Document: /media/krrish/Linux Partition/mwu/.env (LANGUAGE_UNSPECIFIED)
Cursor is on line: 7
Other open documents:
- /media/krrish/Linux Partition/mwu/src/app/forgot-password/page.js (LANGUAGE_JAVASCRIPT)
- /media/krrish/Linux Partition/mwu/.env.example (LANGUAGE_UNSPECIFIED)
- /media/krrish/Linux Partition/mwu/scripts/seed.mjs (LANGUAGE_JAVASCRIPT)
- /media/krrish/Linux Partition/mwu/src/lib/services/audit.js (LANGUAGE_JAVASCRIPT)
- /media/krrish/Linux Partition/mwu/src/app/client/dashboard/page.js (LANGUAGE_JAVASCRIPT)
Running terminal commands:
- npm run dev (in /home/krrish/Desktop/TechTonicWavee/Vidyasetu/backend, running for 2h24m12s)
- npm run dev (in /media/krrish/Linux Partition/mwu, running for 1h0m25s)
</ADDITIONAL_METADATA>