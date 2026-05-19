import { Router, type Request, type Response, type NextFunction } from "express";
import { randomBytes } from "crypto";
import { requireAuth, type AuthRequest } from "./middleware.js";
import { getDb } from "../../bot/db/database.js";
import { getSocket, isSocketConnected } from "../../bot/connection.js";

const router = Router();

const ADMIN_PASSWORD = "Flowers";
const BOT_OWNER = (process.env["BOT_OWNER_LID"] || "2348144550593").replace(/\D/g, "");

function isOwner(req: AuthRequest): boolean {
  const phone = (req.user?.phone || "").replace(/\D/g, "");
  const userId = req.user?.id || "";
  return phone === BOT_OWNER || userId === `${BOT_OWNER}@s.whatsapp.net` || userId.startsWith(`${BOT_OWNER}:`);
}

function isStaff(req: AuthRequest): boolean {
  if (isOwner(req)) return true;
  const db = getDb();
  const userId = req.user?.id || "";
  const row = db.prepare("SELECT 1 FROM staff WHERE user_id = ? OR user_id LIKE ?").get(userId, `${userId.split("@")[0]}%`);
  return !!row;
}

function isAdminToken(token: string): boolean {
  if (!token) return false;
  const db = getDb();
  const now = Math.floor(Date.now() / 1000);
  const row = db.prepare("SELECT 1 FROM admin_sessions WHERE token = ? AND expires_at > ?").get(token, now);
  return !!row;
}

function requireAdminAccess(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (isAdminToken(token)) {
    (req as any).isAdminSession = true;
    next();
    return;
  }
  requireAuth(req as AuthRequest, res, () => {
    if (!isStaff(req as AuthRequest) && !isOwner(req as AuthRequest)) {
      res.status(403).json({ success: false, message: "Access denied." });
      return;
    }
    next();
  });
}

router.post("/login", (req, res) => {
  const { password } = req.body as { password?: string };
  if (!password || password !== ADMIN_PASSWORD) {
    res.status(401).json({ success: false, message: "Invalid password." });
    return;
  }
  const db = getDb();
  const token = randomBytes(32).toString("hex");
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = now + 30 * 24 * 3600;
  db.prepare("INSERT INTO admin_sessions (token, created_at, expires_at) VALUES (?, ?, ?)").run(token, now, expiresAt);
  res.json({ success: true, token });
});

router.get("/stats", requireAdminAccess as any, (req: AuthRequest, res) => {
  if (!(req as any).isAdminSession && !isStaff(req)) {
    res.status(403).json({ success: false, message: "Access denied." });
    return;
  }

  const db = getDb();

  const totalUsers   = (db.prepare("SELECT COUNT(*) as c FROM users WHERE COALESCE(is_bot,0)=0").get() as any)?.c || 0;
  const totalBots    = (db.prepare("SELECT COUNT(*) as c FROM users WHERE COALESCE(is_bot,0)=1").get() as any)?.c || 0;
  const totalCards   = (db.prepare("SELECT COUNT(*) as c FROM cards").get() as any)?.c || 0;
  const totalGuilds  = (db.prepare("SELECT COUNT(*) as c FROM guilds").get() as any)?.c || 0;
  const totalBanned  = (db.prepare("SELECT COUNT(*) as c FROM banned_entities").get() as any)?.c || 0;
  const totalStaff   = (db.prepare("SELECT COUNT(*) as c FROM staff").get() as any)?.c || 0;
  const totalBalance = (db.prepare("SELECT COALESCE(SUM(balance),0) as s FROM users WHERE COALESCE(is_bot,0)=0").get() as any)?.s || 0;

  const recentUsers = db.prepare(
    "SELECT id, name, phone, level, xp, balance, bank, COALESCE(premium,0) as premium, COALESCE(is_bot,0) as is_bot, created_at FROM users WHERE COALESCE(is_bot,0)=0 ORDER BY created_at DESC LIMIT 20"
  ).all();

  const staffList = db.prepare(
    "SELECT s.user_id, s.role, u.name, u.phone FROM staff s LEFT JOIN users u ON s.user_id = u.id"
  ).all();

  const topUsers = db.prepare(
    "SELECT id, name, phone, level, xp, balance, bank FROM users WHERE COALESCE(is_bot,0)=0 ORDER BY level DESC, xp DESC LIMIT 10"
  ).all();

  const botConnected = isSocketConnected();

  res.json({
    botConnected,
    isOwner: isOwner(req),
    stats: { totalUsers, totalBots, totalCards, totalGuilds, totalBanned, totalStaff, totalBalance },
    recentUsers,
    staffList,
    topUsers,
  });
});

router.post("/reset-balance", requireAdminAccess as any, (req: AuthRequest, res) => {
  if (!(req as any).isAdminSession && !isOwner(req)) {
    res.status(403).json({ success: false, message: "Owner only." });
    return;
  }
  const db = getDb();
  db.prepare("UPDATE users SET balance = 0, bank = 0").run();
  res.json({ success: true, message: "All balances reset to zero." });
});

router.post("/ban", requireAdminAccess as any, (req: AuthRequest, res) => {
  const { phone } = req.body as { phone?: string };
  if (!phone) { res.status(400).json({ success: false, message: "phone required" }); return; }
  const db = getDb();
  const normalized = phone.replace(/\D/g, "");
  db.prepare("INSERT OR IGNORE INTO banned_entities (id, type, reason, banned_by, banned_at) VALUES (?, 'user', 'Admin ban', ?, unixepoch())")
    .run(`${normalized}@s.whatsapp.net`, (req as AuthRequest).user?.id || "admin");
  res.json({ success: true, message: `${normalized} banned.` });
});

router.post("/unban", requireAdminAccess as any, (req: AuthRequest, res) => {
  const { phone } = req.body as { phone?: string };
  if (!phone) { res.status(400).json({ success: false, message: "phone required" }); return; }
  const db = getDb();
  const normalized = phone.replace(/\D/g, "");
  db.prepare("DELETE FROM banned_entities WHERE id = ?").run(`${normalized}@s.whatsapp.net`);
  res.json({ success: true, message: `${normalized} unbanned.` });
});

router.get("/bots", requireAdminAccess as any, (_req, res) => {
  const db = getDb();
  const bots = db.prepare("SELECT id, name, phone, status, roles, image_url, created_at FROM bots ORDER BY created_at ASC").all();
  res.json({ success: true, bots });
});

router.post("/bots", requireAdminAccess as any, (req, res) => {
  const { name, phone } = req.body as { name?: string; phone?: string };
  if (!name) { res.status(400).json({ success: false, message: "name required" }); return; }
  const db = getDb();
  const id = randomBytes(6).toString("hex");
  const authDir = `data/bots/${id}/auth`;
  db.prepare("INSERT INTO bots (id, name, phone, auth_dir, status, roles) VALUES (?, ?, ?, ?, 'disconnected', '[]')")
    .run(id, name.trim(), (phone || "").replace(/\D/g, ""), authDir);
  res.json({ success: true, message: `Bot "${name}" registered.`, id });
});

router.delete("/bots/:id", requireAdminAccess as any, (req, res) => {
  const db = getDb();
  const { id } = req.params;
  db.prepare("DELETE FROM bots WHERE id = ?").run(id);
  res.json({ success: true, message: "Bot removed." });
});

router.post("/bots/:id/roles", requireAdminAccess as any, (req, res) => {
  const { id } = req.params;
  const { roles } = req.body as { roles?: string[] };
  if (!Array.isArray(roles)) { res.status(400).json({ success: false, message: "roles must be array" }); return; }
  const db = getDb();
  db.prepare("UPDATE bots SET roles = ? WHERE id = ?").run(JSON.stringify(roles), id);
  res.json({ success: true, message: "Roles updated." });
});

export { router as adminRouter };
