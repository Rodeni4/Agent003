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

async function waitForVkPageReady(page: Page) {
    await page.waitForLoadState('domcontentloaded', {
        timeout: 15000,
    });

    await page.waitForTimeout(1200);
}

async function waitForVkClickable(page: Page, selector: string) {
    const element = page.locator(selector).first();

    await element.waitFor({
        state: 'visible',
        timeout: 15000,
    });

    await element.scrollIntoViewIfNeeded({
        timeout: 10000,
    });

    return element;
}

async function openVkFeed(page: Page) {
    await page.goto('https://vk.com/feed', {
        waitUntil: 'domcontentloaded',
        timeout: 15000,
    });

    await waitForVkPageReady(page);
}

async function openVkProfile(page: Page) {
    const profileMenuItem = page.locator('[data-testid="leftmenuitem-text"]', {
        hasText: 'Профиль',
    }).first();

    await profileMenuItem.waitFor({
        state: 'visible',
        timeout: 15000,
    });

    await profileMenuItem.scrollIntoViewIfNeeded({
        timeout: 10000,
    });

    await profileMenuItem.click({
        timeout: 10000,
    });

    await waitForVkPageReady(page);
}

async function waitForVkEditor(page: Page) {
    const editor = page
        .locator('[data-testid="posting_base_screen_input_message"]')
        .first();

    await editor.waitFor({
        state: 'visible',
        timeout: 15000,
    });

    await editor.scrollIntoViewIfNeeded({
        timeout: 10000,
    });

    return editor;
}

async function waitForVkFileInput(page: Page) {
    const fileInput = page
        .locator('input[type="file"][data-testid="posting_base_screen_download_from_device"]')
        .last();

    await fileInput.waitFor({
        state: 'attached',
        timeout: 15000,
    });

    return fileInput;
}

async function waitForVkUploadedImages(page: Page) {
    await page.waitForTimeout(1500);

    await page.waitForFunction(() => {
        const uploadProgress = document.querySelector(
            '[data-testid*="progress"], [class*="Progress"], [class*="progress"]'
        );

        return !uploadProgress;
    }, undefined, {
        timeout: 8000,
    }).catch(() => undefined);
}

async function fillAndPublishVkPost(page: Page, text: string, imagePaths?: string[]) {
    const createButton = page
        .locator('button:has-text("Создать"), span.vkuiButton__content:has-text("Создать")')
        .first();

    const createPostButton = page
        .locator('button:has-text("Создать пост"), span.vkuiButton__content:has-text("Создать пост")')
        .first();

    const createPostVisible = await createPostButton
        .isVisible({ timeout: 5000 })
        .catch(() => false);

    if (!createPostVisible) {
        await createButton.waitFor({
            state: 'visible',
            timeout: 15000,
        });

        await createButton.scrollIntoViewIfNeeded({
            timeout: 10000,
        });

        await createButton.click({
            timeout: 10000,
        });

        const postMenuItem = page
            .locator('text=Пост')
            .first();

        await postMenuItem.waitFor({
            state: 'visible',
            timeout: 15000,
        });

        await postMenuItem.click({
            timeout: 10000,
        });

        await page.waitForTimeout(3000);


    } else {

        await createPostButton.scrollIntoViewIfNeeded({
            timeout: 10000,
        });

        await createPostButton.click({
            timeout: 10000,
        });

        await page.waitForTimeout(3000);
    }

    const editor = await waitForVkEditor(page);

    await editor.click({
        timeout: 10000,
    });

    await page.keyboard.insertText(text);

    if (imagePaths && imagePaths.length > 0) {
        await page.waitForTimeout(3000);

        const fileInput = await waitForVkFileInput(page);

        await fileInput.setInputFiles(imagePaths, {
            timeout: 15000,
        });

        await waitForVkUploadedImages(page);
    }

    const nextButton = page.locator('button:has-text("Далее")').first();

    await nextButton.waitFor({
        state: 'visible',
        timeout: 8000,
    });

    await nextButton.click();

    const publishButton = await waitForVkClickable(page, 'button:has-text("Опубликовать")');

    await publishButton.waitFor({
        state: 'visible',
        timeout: 8000,
    });

    await publishButton.click();

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
        timeout: 15000,
    });

    await waitForVkPageReady(page);

    const groupName = page.locator('[data-testid="group-name"]').first();

    await groupName.waitFor({
        state: 'visible',
        timeout: 15000,
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