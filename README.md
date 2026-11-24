# TaskFlow — Smart Todo List CRUD Application

A full-stack Smart Todo List web application featuring full Create, Read, Update, and Delete (CRUD) operations, real-time filtering, sorting, progress analytics, and light/dark theme support.

## Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Motion, Lucide Icons
- **Backend**: Node.js, Express.js REST API
- **Database**: Cloud SQL (PostgreSQL) with Drizzle ORM
- **Authentication**: Firebase Authentication (Google Sign-In) with server-side token verification

> Note: Cloud SQL in AI Studio provisions PostgreSQL, so the active schema (`src/db/schema.ts`) and database layer (`src/db/index.ts`, `src/db/tasks.ts`) use PostgreSQL with Drizzle ORM. A SQL reference DDL script is also included at `database/schema.sql`.

## Folder Structure

```text
├── database/
│   └── schema.sql            # SQL schema reference script
├── src/
│   ├── components/
│   │   ├── AuthGate.tsx      # Google Sign-In landing view
│   │   ├── DashboardSummary.tsx # Total, pending, completed, overdue & progress cards
│   │   ├── DeleteConfirmModal.tsx # Delete confirmation modal
│   │   ├── Sidebar.tsx       # Responsive view & category navigation
│   │   ├── TaskCard.tsx      # Task item card with completion toggle & actions
│   │   ├── TaskFormModal.tsx # Create / Edit task modal with validation
│   │   └── ToastContainer.tsx # Success & error toast notifications
│   ├── context/
│   │   └── AuthContext.tsx   # Firebase Auth provider
│   ├── db/
│   │   ├── drizzle.config.ts # Drizzle Kit migration config
│   │   ├── index.ts          # PostgreSQL connection pool & Drizzle client
│   │   ├── schema.ts         # Relational users & tasks tables
│   │   ├── tasks.ts          # Task CRUD query helpers
│   │   └── users.ts          # User sync helper
│   ├── lib/
│   │   ├── api.ts            # Authenticated REST API client
│   │   ├── firebase-admin.ts # Server-side Firebase Admin verifier
│   │   └── firebase.ts       # Client-side Firebase SDK initialization
│   ├── middleware/
│   │   └── auth.ts           # Express Bearer token verification middleware
│   ├── types/
│   │   └── task.ts           # Shared frontend task interfaces
│   ├── utils/
│   │   └── date.ts           # Date formatting & overdue utilities
│   ├── App.tsx               # Main dashboard workspace
│   ├── index.css             # Tailwind v4 configuration & theme tokens
│   └── main.tsx              # React entry point
├── server.ts                 # Express server + REST API endpoints + Vite middleware
├── package.json
└── tsconfig.json
```

## REST API Endpoints

All `/api/tasks` routes require a valid Firebase ID token in the `Authorization: Bearer <token>` header.

- `GET /api/tasks` — List tasks for the authenticated user (supports `search`, `priority`, `status`, `category`, `sortBy`, `sortOrder`)
- `POST /api/tasks` — Create a new task (validates title, priority, category, due date, and status)
- `PUT /api/tasks/:id` & `PATCH /api/tasks/:id` — Update an existing task's details or status
- `DELETE /api/tasks/:id` — Delete a task owned by the user

## Running Locally

1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure environment variables (`SQL_HOST`, `SQL_DB_NAME`, `SQL_USER`, `SQL_PASSWORD`, `SQL_ADMIN_USER`, `SQL_ADMIN_PASSWORD`) and `firebase-applet-config.json`.
3. Push the schema to PostgreSQL:
   ```bash
   npx drizzle-kit push --config=src/db/drizzle.config.ts
   ```
4. Start the development server on port 3000:
   ```bash
   npm run dev
   ```
5. Build for production:
   ```bash
   npm run build
   npm start
   ```
