import { chromium, Page } from 'playwright';

export type PublishVkTextPostPayload = {
  text: string;
  debug: boolean;
  imagePaths?: string[];
  publishToWall: boolean;
  publishToGroup: boolean;
  groupValue?: string;
  vkProfilePath: string;
};

export type PublishVkTextPostResult = {
  success: boolean;
  message: string;
};

function normalizeVkGroupValue(groupValue?: string) {
  if (!groupValue) {
    return null;
  }

  const cleanValue = groupValue
    .trim()
    .replace('https://vk.com/', '')
    .replace('http://vk.com/', '')
    .replace('vk.com/', '')
    .replace(/^\/+/, '')
    .trim();

  return cleanValue || null;
}

async function openVkFeed(page: Page) {
  await page.goto('https://vk.com/feed', {
    waitUntil: 'domcontentloaded',
    timeout: 30000,
  });
}

async function openVkProfile(page: Page) {
  const profileMenuItem = page.locator('[data-testid="leftmenuitem-text"]', {
    hasText: 'Профиль',
  }).first();

  await profileMenuItem.waitFor({
    state: 'visible',
    timeout: 30000,
  });

  await profileMenuItem.click({
    timeout: 30000,
  });
}

async function fillAndPublishVkPost(page: Page, text: string, imagePaths?: string[]) {
  const createButton = page
    .locator('button:has-text("Создать"), span.vkuiButton__content:has-text("Создать")')
    .first();

  const createPostButton = page
    .locator('button:has-text("Создать пост"), span.vkuiButton__content:has-text("Создать пост")')
    .first();

  const createPostVisible = await createPostButton
    .isVisible({ timeout: 3000 })
    .catch(() => false);

  if (!createPostVisible) {
    await createButton.waitFor({
      state: 'visible',
      timeout: 30000,
    });

    await createButton.click({
      timeout: 30000,
    });

    const postMenuItem = page
      .locator('text=Пост')
      .first();

    await postMenuItem.waitFor({
      state: 'visible',
      timeout: 30000,
    });

    await postMenuItem.click({
      timeout: 30000,
    });
  } else {
    await createPostButton.click({
      timeout: 30000,
    });
  }

  const editor = page
    .locator('[data-testid="posting_base_screen_input_message"]')
    .first();

  await editor.waitFor({
    state: 'visible',
    timeout: 30000,
  });

  await editor.click({
    timeout: 30000,
  });

  await page.keyboard.insertText(text);

if (imagePaths && imagePaths.length > 0) {
  const fileInput = page
    .locator('input[type="file"][data-testid="posting_base_screen_download_from_device"]')
    .first();

  await fileInput.waitFor({
    state: 'attached',
    timeout: 30000,
  });

  await page.waitForFunction(() => {
    const input = document.querySelector<HTMLInputElement>(
      'input[type="file"][data-testid="posting_base_screen_download_from_device"]'
    );

    return Boolean(input && input.isConnected);
  }, undefined, {
    timeout: 30000,
  });

  await fileInput.setInputFiles(imagePaths, {
    timeout: 30000,
  });

  await page.waitForTimeout(10000);
}

  const nextButton = page
    .locator('button:has-text("Далее")')
    .first();

  await nextButton.waitFor({
    state: 'visible',
    timeout: 30000,
  });

  await nextButton.click({
    timeout: 30000,
  });

  const publishButton = page
    .locator('button:has-text("Опубликовать")')
    .first();

  await publishButton.waitFor({
    state: 'visible',
    timeout: 30000,
  });

  await publishButton.click({
    timeout: 30000,
  });

  await page.waitForTimeout(3000);
}

async function publishToVkWall(page: Page, text: string, imagePaths?: string[]) {
  await openVkFeed(page);
  await openVkProfile(page);
  await fillAndPublishVkPost(page, text, imagePaths);
}

async function publishToVkGroup(page: Page, groupValue: string, text: string, imagePaths?: string[]) {
  const cleanValue = normalizeVkGroupValue(groupValue);

  if (!cleanValue) {
    throw new Error('Укажите ID или ссылку группы VK.');
  }

  await page.goto(`https://vk.com/${cleanValue}`, {
    waitUntil: 'domcontentloaded',
    timeout: 30000,
  });

  const groupName = page.locator('[data-testid="group-name"]').first();

  await groupName.waitFor({
    state: 'visible',
    timeout: 30000,
  });

  await fillAndPublishVkPost(page, text, imagePaths);
}

export async function publishVkTextPost(
  payload: PublishVkTextPostPayload
): Promise<PublishVkTextPostResult> {
  const text = payload.text.trim();

  if (!text) {
    return {
      success: false,
      message: 'Текст поста пустой.',
    };
  }

  if (!payload.publishToWall && !payload.publishToGroup) {
    return {
      success: false,
      message: 'Выберите, куда публиковать: на стену VK или в группу VK.',
    };
  }

  const context = await chromium.launchPersistentContext(payload.vkProfilePath, {
    headless: !payload.debug,
  });

  const page = await context.newPage();
  const publishedTargets: string[] = [];

  try {
    if (payload.publishToWall) {
      await publishToVkWall(page, text, payload.imagePaths);
      publishedTargets.push('стена VK');
    }

    if (payload.publishToGroup) {
      await publishToVkGroup(page, payload.groupValue || '', text, payload.imagePaths);
      publishedTargets.push('группа VK');
    }

    return {
      success: true,
      message: `Пост опубликован: ${publishedTargets.join(', ')}.`,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error
        ? `Ошибка публикации VK: ${error.message}`
        : 'Ошибка публикации VK.',
    };
  } finally {
    await context.close().catch(() => undefined);
  }
}