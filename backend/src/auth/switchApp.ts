import { Request, Response } from "express";
import jwt, { SignOptions } from "jsonwebtoken";
import { getPool } from "../db/pool";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const jwtSignOptions: SignOptions = {
  expiresIn: (process.env.JWT_EXPIRES_IN || "7d") as SignOptions["expiresIn"],
};
const SWITCH_TOKEN_EXPIRES = (process.env.SWITCH_TOKEN_EXPIRES_IN || "5m") as SignOptions["expiresIn"];

export const SWITCH_TARGET_APPS = ["ins", "eng", "op"] as const;
export type SwitchTargetApp = (typeof SWITCH_TARGET_APPS)[number];

function frontendUrl(targetApp: SwitchTargetApp): string {
  const urls: Record<SwitchTargetApp, string> = {
    ins: process.env.JK_INS_FRONTEND_URL || "http://localhost:3000",
    eng: process.env.JK_ENG_FRONTEND_URL || "http://localhost:3002",
    op: process.env.JK_OP_FRONTEND_URL || "http://localhost:3001",
  };
  return urls[targetApp].replace(/\/+$/, "");
}

function switchTokenExpiresSeconds(): number {
  const raw = process.env.SWITCH_TOKEN_EXPIRES_IN || "5m";
  if (raw.endsWith("m")) return Number.parseInt(raw, 10) * 60 || 300;
  if (raw.endsWith("h")) return Number.parseInt(raw, 10) * 3600 || 300;
  if (raw.endsWith("s")) return Number.parseInt(raw, 10) || 300;
  return 300;
}

export async function handleSwitchApp(
  req: Request,
  res: Response,
  currentAppCode: string,
): Promise<void> {
  const targetApp = req.body?.targetApp;
  if (typeof targetApp !== "string" || !SWITCH_TARGET_APPS.includes(targetApp as SwitchTargetApp)) {
    res.status(400).json({ error: "전환할 앱이 올바르지 않습니다." });
    return;
  }
  if (targetApp === currentAppCode) {
    res.status(400).json({ error: "이미 해당 앱에 있습니다." });
    return;
  }

  const userId = req.user!.id;
  const accessResult = await getPool().query(
    `SELECT role FROM user_app_access WHERE user_id = $1 AND app_code = $2`,
    [userId, targetApp],
  );

  if (accessResult.rows.length === 0) {
    res.status(403).json({ error: "해당 앱 접속 권한이 없습니다." });
    return;
  }

  const role = accessResult.rows[0].role as string;
  const switchToken = jwt.sign(
    {
      sub: userId,
      email: req.user!.email,
      app: targetApp,
      role,
      purpose: "switch",
    },
    JWT_SECRET,
    { expiresIn: SWITCH_TOKEN_EXPIRES },
  );

  const resolvedTarget = targetApp as SwitchTargetApp;
  res.json({
    token: switchToken,
    targetApp: resolvedTarget,
    redirectUrl: `${frontendUrl(resolvedTarget)}/auth/callback`,
    expiresIn: switchTokenExpiresSeconds(),
  });
}

type CompleteSwitchUserLoader = (
  userId: string,
  email: string,
  role: string,
) => Promise<Record<string, unknown>>;

export async function handleCompleteSwitch(
  req: Request,
  res: Response,
  appCode: string,
  loadUser?: CompleteSwitchUserLoader,
): Promise<void> {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "인증이 필요합니다." });
    return;
  }

  const token = header.slice(7);
  let payload: jwt.JwtPayload;
  try {
    payload = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
  } catch {
    res.status(401).json({ error: "유효하지 않거나 만료된 전환 토큰입니다." });
    return;
  }

  if (payload.purpose !== "switch") {
    res.status(400).json({ error: "앱 전환용 토큰이 아닙니다." });
    return;
  }
  if (payload.app !== appCode) {
    res.status(403).json({ error: "이 앱용 전환 토큰이 아닙니다." });
    return;
  }

  const userId = payload.sub as string;
  const email = payload.email as string;
  const accessResult = await getPool().query(
    `SELECT role FROM user_app_access WHERE user_id = $1 AND app_code = $2`,
    [userId, appCode],
  );

  if (accessResult.rows.length === 0) {
    res.status(403).json({ error: "해당 앱 접속 권한이 없습니다." });
    return;
  }

  const role = accessResult.rows[0].role as string;
  const fullToken = jwt.sign(
    { sub: userId, email, app: appCode, role },
    JWT_SECRET,
    jwtSignOptions,
  );

  const user = loadUser
    ? await loadUser(userId, email, role)
    : await loadDefaultUser(userId, email, role, appCode);

  res.json({ token: fullToken, user });
}

async function loadDefaultUser(
  userId: string,
  email: string,
  role: string,
  appCode: string,
): Promise<Record<string, unknown>> {
  const result = await getPool().query(`SELECT name FROM users WHERE id = $1`, [userId]);
  return {
    id: userId,
    email,
    name: (result.rows[0]?.name as string | null) ?? null,
    role,
    app: appCode,
  };
}
