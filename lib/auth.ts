import { cookies } from 'next/headers';

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'tournament2026';
const ADMIN_TOKEN = Buffer.from(`${ADMIN_USERNAME}:${ADMIN_PASSWORD}`).toString('base64');

/**
 * Validate admin credentials
 */
export function validateAdminCredentials(username: string, password: string): boolean {
  return username === ADMIN_USERNAME && password === ADMIN_PASSWORD;
}

/**
 * Create admin session cookie
 */
export async function setAdminCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set('admin_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });
}

/**
 * Get admin token from cookies
 */
export async function getAdminToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get('admin_token')?.value;
}

/**
 * Verify admin token
 */
export async function verifyAdminToken(): Promise<boolean> {
  const token = await getAdminToken();
  if (!token) return false;
  
  // Simple token validation - just check if it matches our expected token
  return token === ADMIN_TOKEN;
}

/**
 * Clear admin session
 */
export async function clearAdminCookie() {
  const cookieStore = await cookies();
  cookieStore.delete('admin_token');
}

/**
 * Generate admin token from credentials
 */
export function generateAdminToken(username: string, password: string): string | null {
  if (!validateAdminCredentials(username, password)) {
    return null;
  }
  return Buffer.from(`${username}:${password}`).toString('base64');
}
