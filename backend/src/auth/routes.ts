import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt, { SignOptions } from "jsonwebtoken";
import { getPool } from "../db/pool";
import { normalizeEmail } from "./email";
import { authenticate } from "./middleware";

const router = Router();
const APP_CODE = process.env.APP_CODE || "eng";
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const jwtSignOptions: SignOptions = {
  expiresIn: (process.env.JWT_EXPIRES_IN || "7d") as SignOptions["expiresIn"],
};

router.post("/register", async (req: Request, res: Response) => {
  const { email, password, name } = req.body as {
    email?: string;
    password?: string;
    name?: string;
  };

  if (!email || !password) {
    res.status(400).json({ error: "이메일과 비밀번호는 필수입니다." });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ error: "비밀번호는 6자 이상이어야 합니다." });
    return;
  }

  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const passwordHash = await bcrypt.hash(password, 10);
    const userResult = await client.query(
      `INSERT INTO users (email, password_hash, name)
       VALUES ($1, $2, $3)
       RETURNING id, email, name`,
      [normalizeEmail(email), passwordHash, name ?? null]
    );
    const user = userResult.rows[0];
    await client.query(
      `INSERT INTO user_app_access (user_id, app_code, role)
       VALUES ($1, $2, 'user')`,
      [user.id, APP_CODE]
    );
    await client.query("COMMIT");

    const token = jwt.sign(
      { sub: user.id, email: user.email, app: APP_CODE, role: "user" },
      JWT_SECRET,
      jwtSignOptions
    );

    res.status(201).json({
      token,
      user: { id: user.id, email: user.email, name: user.name, app: APP_CODE, role: "user" },
    });
  } catch (err: unknown) {
    await client.query("ROLLBACK");
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      err.code === "23505"
    ) {
      res.status(409).json({ error: "이미 등록된 이메일입니다." });
      return;
    }
    console.error(err);
    res.status(500).json({ error: "회원가입 중 오류가 발생했습니다." });
  } finally {
    client.release();
  }
});

router.post("/login", async (req: Request, res: Response) => {
  const { email, password } = req.body as {
    email?: string;
    password?: string;
  };

  if (!email || !password) {
    res.status(400).json({ error: "이메일과 비밀번호는 필수입니다." });
    return;
  }

  const userResult = await getPool().query(
    `SELECT id, email, name, password_hash, is_active, approval_status
     FROM users WHERE email = $1`,
    [normalizeEmail(email)]
  );

  if (userResult.rows.length === 0) {
    res.status(401).json({ error: "연락처(또는 아이디) 또는 비밀번호가 올바르지 않습니다." });
    return;
  }

  const user = userResult.rows[0];
  if (!user.is_active) {
    res.status(403).json({ error: "비활성화된 계정입니다." });
    return;
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    res.status(401).json({ error: "연락처(또는 아이디) 또는 비밀번호가 올바르지 않습니다." });
    return;
  }

  const accessResult = await getPool().query(
    `SELECT role, app_code FROM user_app_access
     WHERE user_id = $1 AND app_code = $2`,
    [user.id, APP_CODE]
  );

  if (accessResult.rows.length === 0) {
    res.status(403).json({ error: "해당 프로젝트 접속 권한이 없습니다." });
    return;
  }

  const access = accessResult.rows[0];

  if (access.role === "user") {
    if (user.approval_status === "pending") {
      res.status(403).json({ error: "관리자 승인 대기 중입니다. 승인 후 로그인할 수 있습니다." });
      return;
    }
    if (user.approval_status === "rejected") {
      res.status(403).json({ error: "가입이 거절되었습니다." });
      return;
    }
  }

  const token = jwt.sign(
    {
      sub: user.id,
      email: user.email,
      app: APP_CODE,
      role: access.role,
    },
    JWT_SECRET,
    jwtSignOptions
  );

  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: access.role,
      app: access.app_code,
    },
  });
});

router.get("/me", authenticate, async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const result = await getPool().query(
    `SELECT u.id, u.email, u.name, a.role, a.app_code
     FROM users u
     JOIN user_app_access a ON a.user_id = u.id
     WHERE u.id = $1 AND a.app_code = $2`,
    [userId, APP_CODE]
  );

  if (result.rows.length === 0) {
    res.status(404).json({ error: "사용자를 찾을 수 없습니다." });
    return;
  }

  const row = result.rows[0];
  res.json({
    user: {
      id: row.id,
      email: row.email,
      name: row.name,
      role: row.role,
      app: row.app_code,
    },
  });
});

export default router;
