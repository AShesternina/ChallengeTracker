/**
 * ChallengeTracker Design Brief Screenshot Script
 * Usage:
 *   node design-brief/screenshot.mjs           -- capture all screenshots
 *   node design-brief/screenshot.mjs --probe   -- capture only probe screenshots
 */

// Resolve modules from frontend/node_modules since that's where they're installed
const playwrightModule = await import(
  new URL('../frontend/node_modules/playwright/index.mjs', import.meta.url).href
);
const { chromium } = playwrightModule;

const sharpModule = await import(
  new URL('../frontend/node_modules/sharp/lib/index.js', import.meta.url).href
);
const sharp = sharpModule.default ?? sharpModule;
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots');
const API_BASE = 'http://localhost:8000/api/v1';
const APP_BASE = 'http://localhost:5173';

const IS_PROBE = process.argv.includes('--probe');

// Ensure screenshots directory exists
fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

// ─── API Helpers ──────────────────────────────────────────────────────────────

async function apiPost(path, body, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`POST ${path} failed (${res.status}): ${text}`);
  }
  return res.json();
}

async function apiGet(path, token) {
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, { headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GET ${path} failed (${res.status}): ${text}`);
  }
  return res.json();
}

// ─── Seed Data ────────────────────────────────────────────────────────────────

async function registerUser(email, password) {
  try {
    const data = await apiPost('/auth/register/email', {
      email,
      password,
      timezone: 'UTC',
    });
    console.log(`  Registered ${email}`);
    return data.access_token;
  } catch (e) {
    // If already exists, try login
    console.log(`  Register failed for ${email}, trying login...`);
    try {
      const data = await apiPost('/auth/login/email', { email, password });
      console.log(`  Logged in ${email}`);
      return data.access_token;
    } catch (e2) {
      console.error(`  Could not register or login ${email}:`, e2.message);
      throw e2;
    }
  }
}

async function seedActiveUser(token) {
  const today = new Date().toISOString().slice(0, 10);

  const challenges = [
    {
      title: 'Morning Workout',
      description: 'Daily exercise to boost energy',
      type: 'single',
      tasks_per_day: 1,
      task_times: ['07:00'],
      default_duration_days: 30,
    },
    {
      title: 'Water Intake',
      description: 'Stay hydrated throughout the day',
      type: 'multi',
      tasks_per_day: 3,
      task_times: ['09:00', '13:00', '18:00'],
      default_duration_days: 30,
    },
    {
      title: 'Reading Habit',
      description: 'Read every day to grow',
      type: 'all_day',
      tasks_per_day: 1,
      task_times: null,
      default_duration_days: 21,
    },
  ];

  const instanceIds = [];

  for (const challenge of challenges) {
    try {
      console.log(`  Creating challenge: ${challenge.title}`);
      const created = await apiPost('/challenges', challenge, token);
      console.log(`  Starting challenge: ${challenge.title} (id=${created.id})`);
      const instance = await apiPost('/challenges/start', {
        challenge_id: created.id,
        start_date: today,
      }, token);
      instanceIds.push(instance.id);
      console.log(`  Instance id: ${instance.id}`);
    } catch (e) {
      console.error(`  Failed to create/start challenge "${challenge.title}":`, e.message);
    }
  }

  // Generate today's tasks
  console.log('  Generating today\'s tasks...');
  let tasks = [];
  try {
    const daily = await apiGet('/daily/today', token);
    tasks = daily.tasks || [];
    console.log(`  Got ${tasks.length} tasks`);
  } catch (e) {
    console.error('  Failed to get daily tasks:', e.message);
  }

  // Complete first 2 tasks, skip 1
  const pending = tasks.filter(t => t.status === 'pending');
  for (let i = 0; i < pending.length; i++) {
    try {
      if (i < 2) {
        await apiPost(`/tasks/${pending[i].id}/complete`, {}, token);
        console.log(`  Completed task ${pending[i].id}`);
      } else if (i === 2) {
        await apiPost(`/tasks/${pending[i].id}/skip`, {}, token);
        console.log(`  Skipped task ${pending[i].id}`);
        break;
      }
    } catch (e) {
      console.error(`  Failed to act on task ${pending[i].id}:`, e.message);
    }
  }

  return instanceIds;
}

// ─── Screenshot Helpers ───────────────────────────────────────────────────────

async function saveWebP(pngBuffer, filename) {
  const outPath = path.join(SCREENSHOTS_DIR, filename);
  await sharp(pngBuffer).webp({ quality: 85 }).toFile(outPath);
  console.log(`  Saved: ${filename}`);
  return outPath;
}

async function loginInBrowser(page, email, password) {
  await page.goto(`${APP_BASE}/login`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(800);
}

async function screenshot(page, url, filename, waitMs = 800) {
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(waitMs);
  const buf = await page.screenshot({ fullPage: false });
  return saveWebP(buf, filename);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('=== ChallengeTracker Screenshot Script ===');
  console.log(`Mode: ${IS_PROBE ? 'PROBE (2 screenshots)' : 'FULL'}`);
  console.log('');

  // Phase 1: Seed data
  console.log('--- Seeding data ---');
  let tokenA, tokenB;
  let instanceIds = [];

  try {
    tokenA = await registerUser('design-brief-active@example.com', 'DesignBrief123');
    tokenB = await registerUser('design-brief-empty@example.com', 'DesignBrief123');
  } catch (e) {
    console.error('Fatal: could not set up test users:', e.message);
    process.exit(1);
  }

  try {
    instanceIds = await seedActiveUser(tokenA);
  } catch (e) {
    console.error('Warning: seeding active user failed:', e.message);
  }

  console.log('');
  console.log('--- Launching browser ---');
  const browser = await chromium.launch({ headless: true });

  const desktopCtx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const mobileCtx = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });

  const desktopPage = await desktopCtx.newPage();
  const mobilePage = await mobileCtx.newPage();

  try {
    // ── PROBE mode: only 2 screenshots ──────────────────────────────────────
    if (IS_PROBE) {
      console.log('--- Probe: 01-login-desktop ---');
      await screenshot(desktopPage, `${APP_BASE}/login`, '01-login-desktop.webp');

      console.log('--- Probe: 03-dashboard-desktop (User A) ---');
      await loginInBrowser(desktopPage, 'design-brief-active@example.com', 'DesignBrief123');
      await screenshot(desktopPage, `${APP_BASE}/`, '03-dashboard-desktop.webp');

      console.log('');
      console.log('Probe complete. Screenshots saved:');
      console.log(`  ${path.join(SCREENSHOTS_DIR, '01-login-desktop.webp')}`);
      console.log(`  ${path.join(SCREENSHOTS_DIR, '03-dashboard-desktop.webp')}`);
      return;
    }

    // ── FULL mode ────────────────────────────────────────────────────────────

    // 01 - Login
    console.log('--- 01: Login ---');
    await screenshot(desktopPage, `${APP_BASE}/login`, '01-login-desktop.webp');
    await screenshot(mobilePage, `${APP_BASE}/login`, '01-login-mobile.webp');

    // 02 - Register
    console.log('--- 02: Register ---');
    await screenshot(desktopPage, `${APP_BASE}/register`, '02-register-desktop.webp');
    await screenshot(mobilePage, `${APP_BASE}/register`, '02-register-mobile.webp');

    // Login User A on both pages
    console.log('--- Logging in User A ---');
    await loginInBrowser(desktopPage, 'design-brief-active@example.com', 'DesignBrief123');
    await loginInBrowser(mobilePage, 'design-brief-active@example.com', 'DesignBrief123');

    // 03 - Dashboard
    console.log('--- 03: Dashboard ---');
    await screenshot(desktopPage, `${APP_BASE}/`, '03-dashboard-desktop.webp');
    await screenshot(mobilePage, `${APP_BASE}/`, '03-dashboard-mobile.webp');

    // 04 - Daily Tasks
    console.log('--- 04: Daily Tasks ---');
    await screenshot(desktopPage, `${APP_BASE}/daily`, '04-daily-desktop.webp');
    await screenshot(mobilePage, `${APP_BASE}/daily`, '04-daily-mobile.webp');

    // 05 - Challenges List
    console.log('--- 05: Challenges ---');
    await screenshot(desktopPage, `${APP_BASE}/challenges`, '05-challenges-desktop.webp');
    await screenshot(mobilePage, `${APP_BASE}/challenges`, '05-challenges-mobile.webp');

    // 06 - Create Challenge Step 1 (template picker)
    console.log('--- 06: Create Challenge Step 1 ---');
    await screenshot(desktopPage, `${APP_BASE}/challenges/new`, '06-new-challenge-step1-desktop.webp');
    await screenshot(mobilePage, `${APP_BASE}/challenges/new`, '06-new-challenge-step1-mobile.webp');

    // 07 - Create Challenge Step 2 (click first template)
    console.log('--- 07: Create Challenge Step 2 ---');
    await desktopPage.goto(`${APP_BASE}/challenges/new`, { waitUntil: 'networkidle' });
    await desktopPage.waitForTimeout(800);
    // Click the first template button (skip the "from scratch" dashed button)
    const templateButtonsDesktop = await desktopPage.$$('button.bg-white.border');
    if (templateButtonsDesktop.length > 0) {
      await templateButtonsDesktop[0].click();
      await desktopPage.waitForTimeout(500);
    }
    const buf07d = await desktopPage.screenshot({ fullPage: false });
    await saveWebP(buf07d, '07-new-challenge-step2-desktop.webp');

    await mobilePage.goto(`${APP_BASE}/challenges/new`, { waitUntil: 'networkidle' });
    await mobilePage.waitForTimeout(800);
    const templateButtonsMobile = await mobilePage.$$('button.bg-white.border');
    if (templateButtonsMobile.length > 0) {
      await templateButtonsMobile[0].click();
      await mobilePage.waitForTimeout(500);
    }
    const buf07m = await mobilePage.screenshot({ fullPage: false });
    await saveWebP(buf07m, '07-new-challenge-step2-mobile.webp');

    // 08 - Challenge Detail
    console.log('--- 08: Challenge Detail ---');
    const detailId = instanceIds.length > 0 ? instanceIds[0] : 1;
    await screenshot(desktopPage, `${APP_BASE}/challenges/${detailId}`, '08-challenge-detail-desktop.webp', 1000);
    await screenshot(mobilePage, `${APP_BASE}/challenges/${detailId}`, '08-challenge-detail-mobile.webp', 1000);

    // 09 - Reports
    console.log('--- 09: Reports ---');
    await screenshot(desktopPage, `${APP_BASE}/reports`, '09-reports-desktop.webp', 1000);
    await screenshot(mobilePage, `${APP_BASE}/reports`, '09-reports-mobile.webp', 1000);

    // 10 - Challenge Report
    console.log('--- 10: Challenge Report ---');
    const reportId = instanceIds.length > 0 ? instanceIds[0] : 1;
    await screenshot(desktopPage, `${APP_BASE}/reports/challenge/${reportId}`, '10-challenge-report-desktop.webp', 1000);
    await screenshot(mobilePage, `${APP_BASE}/reports/challenge/${reportId}`, '10-challenge-report-mobile.webp', 1000);

    // 11 - Settings
    console.log('--- 11: Settings ---');
    await screenshot(desktopPage, `${APP_BASE}/settings`, '11-settings-desktop.webp');
    await screenshot(mobilePage, `${APP_BASE}/settings`, '11-settings-mobile.webp');

    // ── User B: Empty states ──────────────────────────────────────────────────
    console.log('--- User B: Empty states ---');
    const emptyCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const emptyPage = await emptyCtx.newPage();

    await loginInBrowser(emptyPage, 'design-brief-empty@example.com', 'DesignBrief123');

    console.log('--- 12: Dashboard Empty ---');
    await screenshot(emptyPage, `${APP_BASE}/`, '12-dashboard-empty-desktop.webp');

    console.log('--- 13: Daily Empty ---');
    await screenshot(emptyPage, `${APP_BASE}/daily`, '13-daily-empty-desktop.webp');

    console.log('--- 14: Challenges Empty ---');
    await screenshot(emptyPage, `${APP_BASE}/challenges`, '14-challenges-empty-desktop.webp');

    await emptyPage.close();
    await emptyCtx.close();

  } finally {
    await desktopPage.close();
    await mobilePage.close();
    await desktopCtx.close();
    await mobileCtx.close();
    await browser.close();
  }

  console.log('');
  console.log(`All screenshots saved to: ${SCREENSHOTS_DIR}`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
