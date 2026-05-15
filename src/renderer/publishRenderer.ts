type PublishOkResult = {
    success: boolean;
    message: string;
};

type PublishOkAPI = {
    publishTextPost: (payload: {
        text: string;
        debug: boolean;
        imagePaths?: string[];
        publishToWall: boolean;
        publishToGroup: boolean;
        groupValue?: string;
    }) => Promise<PublishOkResult>;
};

type PublishVkAPI = {
    publishTextPost: (payload: {
        text: string;
        debug: boolean;
        imagePaths?: string[];
        publishToWall: boolean;
        publishToGroup: boolean;
        groupValue?: string;
    }) => Promise<PublishOkResult>;
};

function initPublishRenderer() {
    const appWindow = window as Window & {
        okAPI?: PublishOkAPI;
        vkAPI?: PublishVkAPI;
    };

    const publishBtn = document.getElementById('publishOkBtn') as HTMLButtonElement | null;
    const postText = document.getElementById('postText') as HTMLTextAreaElement | null;
    const postImage = document.getElementById('postImage') as HTMLInputElement | null;
    const debugMode = document.getElementById('debugMode') as HTMLInputElement | null;
    const statusBox = document.getElementById('statusBox');

    const publishToWall = document.getElementById('publishToWall') as HTMLInputElement | null;
    const publishToGroup = document.getElementById('publishToGroup') as HTMLInputElement | null;
    const publishToVkWall = document.getElementById('publishToVkWall') as HTMLInputElement | null;
    const publishToVkGroup = document.getElementById('publishToVkGroup') as HTMLInputElement | null;

    const okGroupInput = document.getElementById('okGroupInput') as HTMLInputElement | null;
    const vkGroupInput = document.getElementById('vkGroupInput') as HTMLInputElement | null;

    const PUBLISH_TARGETS_STORAGE_KEY = 'agent003.publishTargets';

    if (postImage) {
        const clearPostImageBtn = document.createElement('button');
        clearPostImageBtn.type = 'button';
        clearPostImageBtn.className = 'clear-input-btn';
        clearPostImageBtn.title = 'Очистить картинку';
        clearPostImageBtn.textContent = '🗑';

        postImage.insertAdjacentElement('afterend', clearPostImageBtn);
        postImage.parentElement?.classList.add('input-with-clear');

        clearPostImageBtn.addEventListener('click', () => {
            postImage.value = '';
        });
    }

    function showStatus(message: string) {
        if (!statusBox) return;

        statusBox.textContent = message;
        statusBox.classList.remove('hidden');
    }

    function restorePublishTargets() {
        const savedValue = localStorage.getItem(PUBLISH_TARGETS_STORAGE_KEY);

        if (!savedValue) {
            return;
        }

        try {
            const savedTargets = JSON.parse(savedValue) as {
                okWall?: boolean;
                okGroup?: boolean;
                vkWall?: boolean;
                vkGroup?: boolean;
            };

            if (publishToWall) publishToWall.checked = Boolean(savedTargets.okWall);
            if (publishToGroup) publishToGroup.checked = Boolean(savedTargets.okGroup);
            if (publishToVkWall) publishToVkWall.checked = Boolean(savedTargets.vkWall);
            if (publishToVkGroup) publishToVkGroup.checked = Boolean(savedTargets.vkGroup);
        } catch {
            localStorage.removeItem(PUBLISH_TARGETS_STORAGE_KEY);
        }
    }

    function savePublishTargets() {
        localStorage.setItem(
            PUBLISH_TARGETS_STORAGE_KEY,
            JSON.stringify({
                okWall: Boolean(publishToWall?.checked),
                okGroup: Boolean(publishToGroup?.checked),
                vkWall: Boolean(publishToVkWall?.checked),
                vkGroup: Boolean(publishToVkGroup?.checked),
            })
        );
    }

    function getImagePaths() {
        return Array.from(postImage?.files || [])
            .map((file) => (file as File & { path?: string }).path)
            .filter((path): path is string => Boolean(path));
    }

    restorePublishTargets();

    publishToWall?.addEventListener('change', savePublishTargets);
    publishToGroup?.addEventListener('change', savePublishTargets);
    publishToVkWall?.addEventListener('change', savePublishTargets);
    publishToVkGroup?.addEventListener('change', savePublishTargets);

    publishBtn?.addEventListener('click', async () => {
        const text = postText?.value.trim() || '';

        if (!text) {
            showStatus('Введите текст поста.');
            return;
        }

        const okSelected = Boolean(publishToWall?.checked || publishToGroup?.checked);
        const vkSelected = Boolean(publishToVkWall?.checked || publishToVkGroup?.checked);

        if (!okSelected && !vkSelected) {
            showStatus('Выберите, куда публиковать пост.');
            return;
        }

        if (publishToGroup?.checked && !okGroupInput?.value.trim()) {
            showStatus('Укажите ID или ссылку группы OK.');
            return;
        }

        if (publishToVkGroup?.checked && !vkGroupInput?.value.trim()) {
            showStatus('Укажите ID или ссылку группы VK.');
            return;
        }

        if (publishBtn) {
            publishBtn.disabled = true;
        }

        try {
            showStatus('Публикуем пост...');

            const results: string[] = [];

            if (okSelected) {
                try {
                    results.push('OK: начинаем публикацию...');
                    showStatus(results.join('\n'));

                    const result = await appWindow.okAPI?.publishTextPost({
                        text,
                        debug: Boolean(debugMode?.checked),
                        imagePaths: getImagePaths(),
                        publishToWall: Boolean(publishToWall?.checked),
                        publishToGroup: Boolean(publishToGroup?.checked),
                        groupValue: okGroupInput?.value.trim() || undefined,
                    });

                    results[results.length - 1] = result?.message || 'OK: ответ не получен.';
                    showStatus(results.join('\n'));
                } catch (error) {
                    results[results.length - 1] = error instanceof Error
                        ? `OK: ошибка — ${error.message}`
                        : 'OK: ошибка публикации.';

                    showStatus(results.join('\n'));
                }
            }

            if (vkSelected) {
                try {
                    results.push('VK: начинаем публикацию...');
                    showStatus(results.join('\n'));

                    const result = await appWindow.vkAPI?.publishTextPost({
                        text,
                        debug: Boolean(debugMode?.checked),
                        imagePaths: getImagePaths(),
                        publishToWall: Boolean(publishToVkWall?.checked),
                        publishToGroup: Boolean(publishToVkGroup?.checked),
                        groupValue: vkGroupInput?.value.trim() || undefined,
                    });

                    results[results.length - 1] = result?.message || 'VK: ответ не получен.';
                    showStatus(results.join('\n'));
                } catch (error) {
                    results[results.length - 1] = error instanceof Error
                        ? `VK: ошибка — ${error.message}`
                        : 'VK: ошибка публикации.';

                    showStatus(results.join('\n'));
                }
            }

            showStatus(results.join('\n'));
        } finally {
            if (publishBtn) {
                publishBtn.disabled = false;
            }
        }
    });
}

initPublishRenderer();