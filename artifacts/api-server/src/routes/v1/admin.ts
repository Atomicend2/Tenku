import { Router } from "express";
import { requireAuth, type AuthRequest } from "./middleware.js";
import { getDb } from "../../bot/db/database.js";
import { getSocket, isSocketConnected } from "../../bot/connection.js";

const router = Router();

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

router.get("/stats", requireAuth, (req: AuthRequest, res) => {
  if (!isStaff(req)) {
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

router.post("/reset-balance", requireAuth, (req: AuthRequest, res) => {
  if (!isOwner(req)) {
    res.status(403).json({ success: false, message: "Owner only." });
    return;
  }
  const db = getDb();
  db.prepare("UPDATE users SET balance = 0, bank = 0").run();
  res.json({ success: true, message: "All balances reset to zero." });
});

router.post("/ban", requireAuth, (req: AuthRequest, res) => {
  if (!isStaff(req)) {
    res.status(403).json({ success: false, message: "Staff only." });
    return;
  }
  const { phone } = req.body as { phone?: string };
  if (!phone) { res.status(400).json({ success: false, message: "phone required" }); return; }
  const db = getDb();
  const normalized = phone.replace(/\D/g, "");
  db.prepare("INSERT OR IGNORE INTO banned_entities (id, type, reason, banned_by, banned_at) VALUES (?, 'user', 'Admin ban', ?, unixepoch())")
    .run(`${normalized}@s.whatsapp.net`, req.user?.id || "admin");
  res.json({ success: true, message: `${normalized} banned.` });
});

router.post("/unban", requireAuth, (req: AuthRequest, res) => {
  if (!isStaff(req)) {
    res.status(403).json({ success: false, message: "Staff only." });
    return;
  }
  const { phone } = req.body as { phone?: string };
  if (!phone) { res.status(400).json({ success: false, message: "phone required" }); return; }
  const db = getDb();
  const normalized = phone.replace(/\D/g, "");
  db.prepare("DELETE FROM banned_entities WHERE id = ?").run(`${normalized}@s.whatsapp.net`);
  res.json({ success: true, message: `${normalized} unbanned.` });
});

export { router as adminRouter };
