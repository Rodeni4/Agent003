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

export type OkGroupResult = {
  success: boolean;
  message: string;
  groupId?: string;
  groupName?: string;
  groupUrl?: string;
};

let okContext: BrowserContext | null = null;

export function getOkProfilePath() {
  return path.join(app.getPath('userData'), 'ok-profile');
}

function extractOkGroupId(groupValue?: string) {
  if (!groupValue) return null;

  const value = groupValue.trim();

  const fromUrl = value.match(/group\/(\d+)/);
  if (fromUrl?.[1]) return fromUrl[1];

  const fromDigits = value.match(/^\d+$/);
  if (fromDigits) return value;

  return null;
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

    const profileData = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll<HTMLAnchorElement>('a[href]'));

      const profileLink = links.find((link) => {
        return /\/profile\/\d+/.test(link.href);
      });

      if (!profileLink) {
        return {
          profileName: undefined,
          profileUrl: undefined,
        };
      }

      const idMatch = profileLink.href.match(/\/profile\/(\d+)/);
      const profileId = idMatch?.[1];

      return {
        profileName: profileLink.textContent?.trim() || undefined,
        profileUrl: profileId ? `https://ok.ru/profile/${profileId}` : profileLink.href,
      };
    });

    return {
      success: true,
      message: 'OK подключён.',
      profileName: profileData.profileName || undefined,
      profileUrl: profileData.profileUrl || undefined,
    };
  } finally {
    await page.close().catch(() => undefined);
  }
}

export async function openOkLogin(url?: string): Promise<OkSessionResult> {
  const context = await getVisibleOkContext();
  const page = await context.newPage();

  if (url && url.includes('/group/')) {
    await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });

    return {
      success: true,
      message: 'Группа OK открыта.',
    };
  }

  await page.goto('https://ok.ru/', {
    waitUntil: 'domcontentloaded',
    timeout: 30000,
  });

  return {
    success: true,
    message: 'OK открыт.',
  };
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

export async function getOkGroupInfo(groupValue: string): Promise<OkGroupResult> {
  const groupId = extractOkGroupId(groupValue);

  if (!groupId) {
    return {
      success: false,
      message: 'Некорректный ID группы OK.',
    };
  }

  let context: BrowserContext | null = null;

  try {
    context = await createOkContext(true);
    const page = await context.newPage();

    await page.goto(`https://ok.ru/group/${groupId}`, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });

    await page.waitForTimeout(3000);

    const groupName = await page.evaluate(() => {
      const ogTitle = document
        .querySelector<HTMLMetaElement>('meta[property="og:title"]')
        ?.content
        ?.trim();

      if (ogTitle) return ogTitle;

      const h1 = document.querySelector('h1')?.textContent?.trim();
      if (h1) return h1;

      const title = document.title?.trim();
      if (title) return title.replace(/\s*\|.*$/, '').trim();

      return undefined;
    });

    await page.close().catch(() => undefined);

    return {
      success: true,
      message: 'Группа OK найдена.',
      groupId,
      groupName: groupName || `Группа ${groupId}`,
      groupUrl: `https://ok.ru/group/${groupId}`,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error
        ? `Не удалось получить группу OK: ${error.message}`
        : 'Не удалось получить группу OK.',
    };
  } finally {
    if (context) {
      await context.close().catch(() => undefined);
    }
  }
}

export async function closeOkContext() {
  if (okContext) {
    await okContext.close().catch(() => undefined);
    okContext = null;
  }
}