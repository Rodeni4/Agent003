type VkResult = {
    success: boolean;
    message: string;
    profileName?: string;
    groupName?: string;
};

type VkAPI = {
    openLogin: (url?: string) => Promise<VkResult>;
    checkSession: () => Promise<VkResult>;
    resetSession: () => Promise<VkResult>;
    getGroupInfo: (groupValue: string) => Promise<VkResult>;
};

function initVkRenderer() {
    const appWindow = window as Window & {
        vkAPI?: VkAPI;
    };

    const openVkBtn = document.getElementById('openVkBtn') as HTMLButtonElement | null;
    const resetVkBtn = document.getElementById('resetVkBtn') as HTMLButtonElement | null;
    const vkStatusBadge = document.getElementById('vkStatusBadge');
    const vkCard = vkStatusBadge?.closest('.card') as HTMLElement | null;

    const vkProgressBar = document.createElement('div');
    vkProgressBar.className = 'card-progress';

    if (vkCard) {
        vkCard.appendChild(vkProgressBar);
    }

    let vkProgressTimer: number | undefined;
    let vkProgressValue = 0;

    function startVkProgress() {
        window.clearInterval(vkProgressTimer);

        vkProgressValue = 3;
        vkProgressBar.style.width = `${vkProgressValue}%`;
        vkCard?.classList.add('loading');

        vkProgressTimer = window.setInterval(() => {
            if (vkProgressValue < 92) {
                vkProgressValue += Math.max(1, (92 - vkProgressValue) * 0.08);
                vkProgressBar.style.width = `${vkProgressValue}%`;
            }
        }, 180);
    }

    function finishVkProgress() {
        window.clearInterval(vkProgressTimer);

        vkProgressBar.style.width = '100%';

        window.setTimeout(() => {
            vkCard?.classList.remove('loading');
            vkProgressBar.style.width = '0';
            vkProgressValue = 0;
        }, 350);
    }

    const vkProfileBox = document.getElementById('vkProfileBox');
    const vkProfileName = document.getElementById('vkProfileName');
    const vkProfileLink = document.getElementById('vkProfileLink') as HTMLButtonElement | null;

    const vkGroupField = document.getElementById('vkGroupField');
    const vkGroupNameRow = document.getElementById('vkGroupNameRow');
    const vkGroupName = document.getElementById('vkGroupName');

    const vkGroupInput = document.getElementById('vkGroupInput') as HTMLInputElement | null;
    const VK_GROUP_STORAGE_KEY = 'agent003.vkGroupValue';

    const vkGroupProgressBar = document.createElement('div');
    vkGroupProgressBar.className = 'field-progress';
    vkGroupNameRow?.insertAdjacentElement('afterend', vkGroupProgressBar);

    let vkGroupProgressTimer: number | undefined;
    let vkGroupProgressValue = 0;

    function startVkGroupProgress() {
        window.clearInterval(vkGroupProgressTimer);

        vkGroupProgressValue = 3;
        vkGroupNameRow?.classList.add('loading-border');

        const nameBox = vkGroupNameRow?.querySelector('.profile-name-input') as HTMLElement | null;
        nameBox?.style.setProperty('--group-progress-deg', `${vkGroupProgressValue * 3.6}deg`);

        vkGroupProgressTimer = window.setInterval(() => {
            if (vkGroupProgressValue < 92) {
                vkGroupProgressValue += Math.max(1, (92 - vkGroupProgressValue) * 0.08);

                nameBox?.style.setProperty(
                    '--group-progress-deg',
                    `${vkGroupProgressValue * 3.6}deg`
                );
            }
        }, 180);
    }

    function finishVkGroupProgress() {
        window.clearInterval(vkGroupProgressTimer);

        const nameBox = vkGroupNameRow?.querySelector('.profile-name-input') as HTMLElement | null;
        nameBox?.style.setProperty('--group-progress-deg', '360deg');

        window.setTimeout(() => {
            vkGroupNameRow?.classList.remove('loading-border');
            nameBox?.style.removeProperty('--group-progress-deg');
            vkGroupProgressValue = 0;
        }, 350);
    }



    if (vkGroupInput) {
        vkGroupInput.value = localStorage.getItem(VK_GROUP_STORAGE_KEY) || '';

        vkGroupInput.addEventListener('input', () => {
            localStorage.setItem(VK_GROUP_STORAGE_KEY, vkGroupInput.value);

            if (vkGroupName) {
                vkGroupName.textContent = 'не проверена';
            }

            if (vkGroupInput.value.trim()) {
                vkGroupNameRow?.classList.remove('hidden');
            } else {
                vkGroupNameRow?.classList.add('hidden');
            }
        });

        const clearVkGroupBtn = document.createElement('button');
        clearVkGroupBtn.type = 'button';
        clearVkGroupBtn.className = 'clear-input-btn';
        clearVkGroupBtn.title = 'Очистить группу VK';
        clearVkGroupBtn.textContent = '🗑';

        const openVkGroupBtn = document.createElement('button');
        openVkGroupBtn.type = 'button';
        openVkGroupBtn.className = 'clear-input-btn open-group-btn';
        openVkGroupBtn.title = 'Открыть группу VK';
        openVkGroupBtn.textContent = '↗';

        vkGroupInput.insertAdjacentElement('afterend', clearVkGroupBtn);
        clearVkGroupBtn.insertAdjacentElement('beforebegin', openVkGroupBtn);

        vkGroupInput.parentElement?.classList.add('input-with-clear');

        openVkGroupBtn.addEventListener('click', async () => {
            const groupValue = vkGroupInput.value.trim();

            if (!groupValue) {
                return;
            }

            const cleanValue = groupValue
                .replace('https://vk.com/', '')
                .replace('http://vk.com/', '')
                .replace('vk.com/', '')
                .trim();

            await appWindow.vkAPI?.openLogin(`https://vk.com/${cleanValue}`);
        });

        clearVkGroupBtn.addEventListener('click', () => {
            vkGroupInput.value = '';
            localStorage.removeItem(VK_GROUP_STORAGE_KEY);
            vkGroupNameRow?.classList.add('hidden');
            finishVkGroupProgress();

            if (vkGroupName) {
                vkGroupName.textContent = 'не проверена';
            }

            vkGroupInput.focus();
        });
    }

    async function loadVkGroupName() {
        const groupValue = vkGroupInput?.value.trim();

        if (!groupValue) {
            vkGroupNameRow?.classList.add('hidden');
            finishVkGroupProgress();
            return;
        }

        vkGroupNameRow?.classList.remove('hidden');
        startVkGroupProgress();

        if (vkGroupName) {
            vkGroupName.textContent = 'проверяем...';
        }

        try {
            const result = await appWindow.vkAPI?.getGroupInfo(groupValue);

            if (vkGroupName) {
                vkGroupName.textContent = result?.success && result.groupName
                    ? result.groupName
                    : 'не проверена';
            }
        } catch {
            if (vkGroupName) {
                vkGroupName.textContent = 'не проверена';
            }
        } finally {
            finishVkGroupProgress();
        }
    }

    function hideVkProfile() {
        vkProfileBox?.classList.add('hidden');
        vkGroupField?.classList.add('hidden');
        vkGroupNameRow?.classList.add('hidden');

        if (vkProfileName) {
            vkProfileName.textContent = '';
        }

        if (vkGroupName) {
            vkGroupName.textContent = 'не проверена';
        }
    }

    function showVkProfile(profileName?: string) {
        vkProfileBox?.classList.remove('hidden');
        vkGroupField?.classList.remove('hidden');

        if (vkProfileName) {
            vkProfileName.textContent = profileName || 'имя пока не получено';
        }

        vkProfileLink?.classList.remove('hidden');
    }

    function setVkChecking(text = 'Проверяем VK...') {
        startVkProgress();

        if (vkStatusBadge) {
            vkStatusBadge.textContent = text;
            vkStatusBadge.className = 'badge pending';
        }
    }

    function setVkConnected(result?: VkResult) {
        finishVkProgress();

        if (vkStatusBadge) {
            vkStatusBadge.textContent = 'VK подключён';
            vkStatusBadge.className = 'badge connected';
        }

        openVkBtn?.classList.add('hidden');
        resetVkBtn?.classList.remove('hidden');

        showVkProfile(result?.profileName);
        void loadVkGroupName();
    }

    function setVkDisconnected(message?: string) {
        finishVkProgress();

        if (vkStatusBadge) {
            vkStatusBadge.textContent = message || 'VK не подключён';
            vkStatusBadge.className = 'badge disconnected';
        }

        openVkBtn?.classList.remove('hidden');
        resetVkBtn?.classList.add('hidden');

        hideVkProfile();
    }

    async function checkVkSessionOnStart() {
        try {
            setVkChecking();

            const result = await appWindow.vkAPI?.checkSession();

            if (result?.success) {
                setVkConnected(result);
            } else {
                setVkDisconnected();
            }
        } catch {
            setVkDisconnected('Не удалось проверить VK.');
        }
    }

    openVkBtn?.addEventListener('click', async () => {
        try {
            setVkChecking('Открываем VK...');

            const result = await appWindow.vkAPI?.openLogin();

            if (result?.success) {
                setVkConnected(result);
            } else {
                setVkDisconnected(result?.message || 'VK не подключён.');
            }
        } catch {
            setVkDisconnected('Ошибка открытия VK.');
        }
    });

    resetVkBtn?.addEventListener('click', async () => {
        try {
            setVkChecking('Сбрасываем VK...');

            const result = await appWindow.vkAPI?.resetSession();

            if (result?.success) {
                setVkDisconnected('Сессия VK сброшена.');
            } else {
                setVkDisconnected(result?.message || 'Не удалось сбросить VK.');
            }
        } catch {
            setVkDisconnected('Ошибка сброса VK.');
        }
    });

    vkProfileLink?.addEventListener('click', async () => {
        try {
            setVkChecking('Открываем VK...');

            const result = await appWindow.vkAPI?.openLogin();

            if (result?.success) {
                setVkConnected(result);
            } else {
                finishVkProgress();
            }
        } catch {
            setVkDisconnected('Ошибка открытия VK.');
        }
    });

    checkVkSessionOnStart();
}

initVkRenderer();