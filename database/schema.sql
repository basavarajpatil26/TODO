-- Smart Todo List SQL Schema Reference
-- Active runtime uses Cloud SQL (PostgreSQL) via Drizzle ORM (src/db/schema.ts).

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  uid TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  display_name TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  priority VARCHAR(20) NOT NULL DEFAULT 'Medium',
  category VARCHAR(64) NOT NULL DEFAULT 'Work',
  due_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'Pending',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_user_due_date ON tasks (user_id, due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_user_status ON tasks (user_id, status);
