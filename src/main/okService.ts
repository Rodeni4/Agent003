import { app } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { chromium, BrowserContext } from 'playwright';

export type OkSessionResult = {
  success: boolean;
  message: string;
  profileName?: string;
  profileUrl?: string;
};

let okContext: BrowserContext | null = null;

export function getOkProfilePath() {
  return path.join(app.getPath('userData'), 'ok-profile');
}

async function createOkContext(headless: boolean) {
  const context = await chromium.launchPersistentContext(getOkProfilePath(), {
    headless,
  });

  context.on('close', () => {
    if (okContext === context) {
      okContext = null;
    }
  });

  return context;
}

async function getVisibleOkContext() {
  if (okContext) {
    try {
      await okContext.newPage();
      return okContext;
    } catch {
      okContext = null;
    }
  }

  okContext = await createOkContext(false);
  return okContext;
}

async function getOkSessionInfo(context: BrowserContext): Promise<OkSessionResult> {
  const page = await context.newPage();

  try {
    await page.goto('https://ok.ru/', {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });

    await page.waitForTimeout(3000);

    const publishButtonVisible = await page
      .locator('text=Опубликовать')
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    const currentUrl = page.url();

    if (!publishButtonVisible || currentUrl.includes('anonym')) {
      return {
        success: false,
        message: 'OK не подключён.',
      };
    }

    const profileLink = await page
      .locator('a[href*="/profile/"], a[href*="/dk?st.cmd=userMain"]')
      .first()
      .getAttribute('href')
      .catch(() => null);

    const profileName = await page
      .locator('a[href*="/profile/"], a[href*="/dk?st.cmd=userMain"]')
      .first()
      .innerText({ timeout: 3000 })
      .catch(() => '');

    const normalizedProfileUrl = profileLink
      ? new URL(profileLink, 'https://ok.ru').toString()
      : undefined;

    return {
      success: true,
      message: 'OK подключён.',
      profileName: profileName.trim() || undefined,
      profileUrl: normalizedProfileUrl,
    };
  } finally {
    await page.close().catch(() => undefined);
  }
}

export async function openOkLogin(): Promise<OkSessionResult> {
  const context = await getVisibleOkContext();
  const page = await context.newPage();

  await page.goto('https://ok.ru/', {
    waitUntil: 'domcontentloaded',
    timeout: 30000,
  });

  await page.waitForEvent('close', {
    timeout: 0,
  });

  return await checkOkSession();
}

export async function checkOkSession(): Promise<OkSessionResult> {
  let context: BrowserContext | null = null;

  try {
    context = await createOkContext(true);
    return await getOkSessionInfo(context);
  } catch {
    return {
      success: false,
      message: 'OK не подключён.',
    };
  } finally {
    if (context) {
      await context.close().catch(() => undefined);
    }
  }
}

export async function resetOkSession(): Promise<OkSessionResult> {
  try {
    if (okContext) {
      await okContext.close().catch(() => undefined);
      okContext = null;
    }

    const profilePath = getOkProfilePath();

    if (fs.existsSync(profilePath)) {
      fs.rmSync(profilePath, {
        recursive: true,
        force: true,
      });
    }

    return {
      success: true,
      message: 'Сессия OK сброшена.',
    };
  } catch {
    return {
      success: false,
      message: 'Не удалось сбросить сессию OK.',
    };
  }
}

export async function closeOkContext() {
  if (okContext) {
    await okContext.close().catch(() => undefined);
    okContext = null;
  }
}