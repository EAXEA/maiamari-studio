/**
 * MAIAMARI.STUDIO — Admin oturum doğrulama (server-only)
 * ------------------------------------------------------
 * Supabase'e bağımsız basit panel girişi: `ADMIN_PASSWORD_HASH` (bcrypt)
 * ile parola kontrolü + `ADMIN_SESSION_SECRET` ile HMAC imzalı httpOnly cookie.
 *
 * Cookie biçimi:  base64url(payload) "." base64url(hmacSHA256(payload))
 *   payload = JSON { exp: <unix-ms> }
 *
 * Bu modül yalnızca sunucuda çalışır (server action / RSC); next/headers
 * ve node:crypto importları onu zaten client bundle'dan uzak tutar.
 */
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const COOKIE_NAME = "mai_admin";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 gün

function getSecret(): string {
  const s = process.env.ADMIN_SESSION_SECRET;
  if (!s) throw new Error("ADMIN_SESSION_SECRET tanımlı değil (.env.local)");
  return s;
}

function getAdminPasswordHash(): string | null {
  const h = process.env.ADMIN_PASSWORD_HASH;
  if (!h || h.startsWith("<")) return null; // doldurulmamış şablon
  return h;
}

/** İmza secret'ı geçerli mi: tanımlı, şablon değil ve yeterince uzun (≥16). */
function hasValidSecret(): boolean {
  const s = process.env.ADMIN_SESSION_SECRET;
  return !!s && !s.startsWith("<") && s.length >= 16;
}

/** Panel girişi yapılandırılmış mı (hash + geçerli secret var mı). */
export function isAdminConfigured(): boolean {
  return getAdminPasswordHash() !== null && hasValidSecret();
}

/** Yapılandırma zayıfsa uyarı döner (yoksa null). */
export function getAdminConfigWarning(): string | null {
  if (!getAdminPasswordHash()) {
    return "ADMIN_PASSWORD_HASH tanımlı değil. Bcrypt hash üretip env'e ekleyin.";
  }
  return null;
}

function sign(data: string): string {
  return crypto.createHmac("sha256", getSecret()).update(data).digest("base64url");
}

/** Zamanlama-güvenli string karşılaştırma. */
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

/** Parolayı `ADMIN_PASSWORD_HASH` (bcrypt) ile doğrula. */
export async function verifyPassword(input: string): Promise<boolean> {
  const hash = getAdminPasswordHash();
  if (!hash) return false;
  return bcrypt.compare(input, hash);
}

/** Yeni bir imzalı oturum token'ı üret. */
export function createSessionToken(): string {
  const payload = Buffer.from(
    JSON.stringify({ exp: Date.now() + MAX_AGE_SECONDS * 1000 }),
  ).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

/** Token geçerli mi (imza + süre). */
export function verifySessionToken(token: string | undefined): boolean {
  if (!token) return false;
  const [payload, mac] = token.split(".");
  if (!payload || !mac) return false;
  if (!safeEqual(mac, sign(payload))) return false;
  try {
    const { exp } = JSON.parse(Buffer.from(payload, "base64url").toString());
    return typeof exp === "number" && exp > Date.now();
  } catch {
    return false;
  }
}

/** Girişten sonra oturum cookie'sini yaz. */
export async function setSessionCookie(): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

/** Çıkışta cookie'yi sil. */
export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

/** Şu anki istek yetkili mi. */
export async function isAuthed(): Promise<boolean> {
  const store = await cookies();
  return verifySessionToken(store.get(COOKIE_NAME)?.value);
}

/**
 * Korumalı admin sayfaları/aksiyonları için kapı. Yetkisizse login'e
 * yönlendirir (sayfalarda) veya hata fırlatır (aksiyonlarda kullanılır).
 */
export async function requireAdmin(): Promise<void> {
  if (!(await isAuthed())) redirect("/admin/login");
}

export const ADMIN_COOKIE_NAME = COOKIE_NAME;
