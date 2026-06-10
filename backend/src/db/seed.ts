import bcrypt from "bcryptjs";
import { getPool } from "./pool";

export async function seedAdmin(): Promise<void> {
  if (process.env.SEED_ADMIN === "false") return;

  const pool = getPool();
  const passwordHash = await bcrypt.hash("admin123", 10);

  const userResult = await pool.query(
    `INSERT INTO users (email, password_hash, name, is_active)
     VALUES ('admin@jk.local', $1, 'Administrator', true)
     ON CONFLICT (email) DO UPDATE
       SET password_hash = EXCLUDED.password_hash,
           is_active = true,
           updated_at = NOW()
     RETURNING id`,
    [passwordHash]
  );

  const userId = userResult.rows[0].id;
  const apps = ["op", "ins", "eng"];

  for (const appCode of apps) {
    await pool.query(
      `INSERT INTO user_app_access (user_id, app_code, role)
       VALUES ($1, $2, 'admin')
       ON CONFLICT (user_id, app_code) DO NOTHING`,
      [userId, appCode]
    );
  }
}
