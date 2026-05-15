import { app } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { chromium, BrowserContext, Page } from 'playwright';

export type VkSessionResult = {
  success: boolean;
  message: string;
  profileName?: string;
};

type VkProfileInfo = {
  profileName?: string;
};

let vkContext: BrowserContext | null = null;

export function getVkProfilePath() {
  return path.join(app.getPath('userData'), 'vk-profile');
}

async function createVkContext(headless: boolean) {
  const context = await chromium.launchPersistentContext(getVkProfilePath(), {
    headless,
  });

  context.on('close', () => {
    if (vkContext === context) {
      vkContext = null;
    }
  });

  return context;
}

async function getVisibleVkContext() {
  if (vkContext) {
    try {
      await vkContext.newPage();
      return vkContext;
    } catch {
      vkContext = null;
    }
  }

  vkContext = await createVkContext(false);
  return vkContext;
}

async function openVkFeed(page: Page) {
  await page.goto('https://vk.com/feed', {
    waitUntil: 'domcontentloaded',
    timeout: 30000,
  });
}

async function isVkAuthorized(page: Page) {
  const profileMenuItem = page.locator('[data-testid="leftmenuitem-text"]', {
    hasText: 'Профиль',
  }).first();

  await profileMenuItem.waitFor({
    state: 'visible',
    timeout: 30000,
  });

  return true;
}

async function getVkProfileInfo(page: Page): Promise<VkProfileInfo> {
  const profileMenuItem = page.locator('[data-testid="leftmenuitem-text"]', {
    hasText: 'Профиль',
  }).first();

  await profileMenuItem.click({
    timeout: 30000,
  });

  const profileNameBlock = page.locator('#owner_page_name').first();

  await profileNameBlock.waitFor({
    state: 'visible',
    timeout: 10000,
  });

  const rawProfileName = await profileNameBlock.innerText({
    timeout: 5000,
  });

  const profileName = rawProfileName
    .replace(/\s+онлайн\s*$/i, '')
    .trim();

  return {
    profileName: profileName || undefined,
  };
}

async function getVkSessionInfo(context: BrowserContext): Promise<VkSessionResult> {
  const page = await context.newPage();

  try {
    await openVkFeed(page);

    const authorized = await isVkAuthorized(page).catch(() => false);

    if (!authorized) {
      return {
        success: false,
        message: 'VK не подключён.',
      };
    }

    const profileInfo = await getVkProfileInfo(page).catch(() => ({
      profileName: undefined,
    }));

    return {
      success: true,
      message: 'VK подключён.',
      profileName: profileInfo.profileName,
    };
  } finally {
    await page.close().catch(() => undefined);
  }
}

export async function openVkLogin(): Promise<VkSessionResult> {
  const context = await getVisibleVkContext();
  const page = await context.newPage();

  await openVkFeed(page);

  return {
    success: true,
    message: 'VK открыт.',
  };
}

export async function checkVkSession(): Promise<VkSessionResult> {
  let context: BrowserContext | null = null;

  try {
    context = await createVkContext(true);
    return await getVkSessionInfo(context);
  } catch {
    return {
      success: false,
      message: 'VK не подключён.',
    };
  } finally {
    if (context) {
      await context.close().catch(() => undefined);
    }
  }
}

export async function resetVkSession(): Promise<VkSessionResult> {
  try {
    if (vkContext) {
      await vkContext.close().catch(() => undefined);
      vkContext = null;
    }

    const profilePath = getVkProfilePath();

    if (fs.existsSync(profilePath)) {
      fs.rmSync(profilePath, {
        recursive: true,
        force: true,
      });
    }

    return {
      success: true,
      message: 'Сессия VK сброшена.',
    };
  } catch {
    return {
      success: false,
      message: 'Не удалось сбросить сессию VK.',
    };
  }
}

export async function closeVkContext() {
  if (vkContext) {
    await vkContext.close().catch(() => undefined);
    vkContext = null;
  }
}