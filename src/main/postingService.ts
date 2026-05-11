import { chromium } from 'playwright';

export type PublishTextPostPayload = {
    text: string;
    debug: boolean;
    imagePath?: string;
    okProfilePath: string;
};

export type PublishTextPostResult = {
    success: boolean;
    message: string;
};

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

    const context = await chromium.launchPersistentContext(payload.okProfilePath, {
        headless: !payload.debug,
    });

    const page = await context.newPage();

    try {
        await page.goto('https://ok.ru/', {
            waitUntil: 'domcontentloaded',
            timeout: 30000,
        });

        await page.waitForTimeout(3000);

        const publishTrigger = page.locator('text=Опубликовать').first();

        await publishTrigger.click({
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

        if (payload.imagePath) {
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
                .setInputFiles(payload.imagePath, {
                    timeout: 15000,
                });

            await page.waitForTimeout(5000);

            const addPhotoButton = page
                .locator('button:has-text("Добавить"), text=Добавить')
                .last();

            const addVisible = await addPhotoButton
                .isVisible({ timeout: 5000 })
                .catch(() => false);

            if (addVisible) {
                await addPhotoButton.click({
                    timeout: 10000,
                });

                await page.waitForTimeout(3000);
            }


        }

        const sendButton = page
            .locator('text=Поделиться')
            .last();

        await sendButton.click({
            timeout: 10000,
        });

        await page.waitForTimeout(3000);

        return {
            success: true,
            message: 'Пост отправлен в OK.',
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