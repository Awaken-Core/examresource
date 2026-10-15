import { pool } from '../src/core/config/db.ts';

const sql = `
DO $$ BEGIN
  CREATE TYPE notification_kind AS ENUM ('welcome', 'blog', 'broadcast');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS notifications (
  id text PRIMARY KEY,
  kind notification_kind NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  href text,
  audience_user_id text REFERENCES users(id) ON DELETE CASCADE,
  created_by_id text REFERENCES users(id) ON DELETE SET NULL,
  source_key text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS notifications_source_key_unique ON notifications (source_key);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON notifications (created_at);
CREATE INDEX IF NOT EXISTS notifications_audience_user_id_idx ON notifications (audience_user_id);

CREATE TABLE IF NOT EXISTS notification_reads (
  notification_id text NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  read_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (notification_id, user_id)
);

CREATE INDEX IF NOT EXISTS notification_reads_user_id_idx ON notification_reads (user_id);
`;

await pool.query(sql);
console.log('notifications tables ready');
await pool.end();
