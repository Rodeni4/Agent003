import { chromium, Page } from 'playwright';

export type PublishTextPostPayload = {
  text: string;
  debug: boolean;
  imagePaths?: string[];
  publishToWall: boolean;
  publishToGroup: boolean;
  groupValue?: string;
  okProfilePath: string;
};

export type PublishTextPostResult = {
  success: boolean;
  message: string;
};

function extractOkGroupId(groupValue?: string) {
  if (!groupValue) {
    return null;
  }

  const trimmed = groupValue.trim();

  const fromUrl = trimmed.match(/group\/(\d+)/);
  if (fromUrl?.[1]) {
    return fromUrl[1];
  }

  const onlyDigits = trimmed.match(/^\d+$/);
  if (onlyDigits) {
    return trimmed;
  }

  return null;
}

async function fillPostForm(page: Page, text: string, imagePaths?: string[]) {
  const editor = page
    .locator('div[contenteditable="true"][data-module="postingForm/mediaText"]')
    .first();

  await editor.click({
    timeout: 10000,
  });

  await page.waitForTimeout(300);
  await page.keyboard.insertText(text);
  await page.waitForTimeout(300);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1000);

  if (imagePaths && imagePaths.length > 0) {
    await page
      .locator('[data-module="postingForm/mediaPhotosAddButton"]')
      .first()
      .click({
        timeout: 10000,
      });

    await page.waitForTimeout(1000);

    await page
      .locator('input[type="file"][aria-label="Загрузить фото"]')
      .first()
      .setInputFiles(imagePaths, {
        timeout: 15000,
      });

    await page.waitForTimeout(10000);
  }

  const sendButton = page
    .locator('#mtLayer button.posting_submit.js-publish-btn, #mtLayer button[data-action="submit"]')
    .first();

  await sendButton.click({
    timeout: 10000,
    force: true,
  });

  await page.waitForTimeout(4000);
}

async function publishToOwnWall(page: Page, text: string, imagePaths?: string[]) {
  await page.goto('https://ok.ru/', {
    waitUntil: 'domcontentloaded',
    timeout: 30000,
  });

  await page.waitForTimeout(3000);

  await page
    .locator('text=Опубликовать')
    .first()
    .click({
      timeout: 10000,
    });

  await page.waitForTimeout(1000);

  await page
    .locator('text=Запись')
    .first()
    .click({
      timeout: 10000,
    });

  await page.waitForTimeout(1500);

  await fillPostForm(page, text, imagePaths);
}

async function publishToOkGroup(page: Page, groupId: string, text: string, imagePaths?: string[]) {
  await page.goto(`https://ok.ru/group/${groupId}`, {
    waitUntil: 'domcontentloaded',
    timeout: 30000,
  });

  await page.waitForTimeout(3000);

  await page
    .locator('.pf-head_itx_a[href*="/group/"][href*="/post"]')
    .first()
    .click({
      timeout: 10000,
      force: true,
    });

  await page.waitForTimeout(2000);

  await fillPostForm(page, text, imagePaths);
}

export async function publishOkTextPost(
  payload: PublishTextPostPayload
): Promise<PublishTextPostResult> {
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
      message: 'Выберите, куда публиковать: на стену OK или в группу OK.',
    };
  }

  const groupId = extractOkGroupId(payload.groupValue);

  if (payload.publishToGroup && !groupId) {
    return {
      success: false,
      message: 'Укажите корректный ID или ссылку группы OK.',
    };
  }

  const context = await chromium.launchPersistentContext(payload.okProfilePath, {
    headless: !payload.debug,
  });

  const page = await context.newPage();
  const publishedTargets: string[] = [];

  try {
    if (payload.publishToWall) {
      await publishToOwnWall(page, text, payload.imagePaths);
      publishedTargets.push('стена OK');
    }

    if (payload.publishToGroup && groupId) {
      await publishToOkGroup(page, groupId, text, payload.imagePaths);
      publishedTargets.push('группа OK');
    }

    return {
      success: true,
      message: `Пост опубликован: ${publishedTargets.join(', ')}.`,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error
        ? `Ошибка публикации OK: ${error.message}`
        : 'Ошибка публикации OK.',
    };
  } finally {
    await context.close().catch(() => undefined);
  }
}