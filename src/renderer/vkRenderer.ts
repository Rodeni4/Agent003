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

    const vkProfileBox = document.getElementById('vkProfileBox');
    const vkProfileName = document.getElementById('vkProfileName');
    const vkProfileLink = document.getElementById('vkProfileLink') as HTMLButtonElement | null;

    const vkGroupField = document.getElementById('vkGroupField');
    const vkGroupNameRow = document.getElementById('vkGroupNameRow');
    const vkGroupName = document.getElementById('vkGroupName');

    const vkGroupInput = document.getElementById('vkGroupInput') as HTMLInputElement | null;
    const VK_GROUP_STORAGE_KEY = 'agent003.vkGroupValue';

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
            return;
        }

        vkGroupNameRow?.classList.remove('hidden');

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

    function setVkConnected(result?: VkResult) {
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
            if (vkStatusBadge) {
                vkStatusBadge.textContent = 'Проверяем VK...';
                vkStatusBadge.className = 'badge pending';
            }

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
            if (vkStatusBadge) {
                vkStatusBadge.textContent = 'Открываем VK...';
                vkStatusBadge.className = 'badge pending';
            }

            await appWindow.vkAPI?.openLogin();

            if (vkStatusBadge) {
                vkStatusBadge.textContent = 'VK открыт. После входа закройте окно и перезапустите приложение.';
                vkStatusBadge.className = 'badge connected';
            }
        } catch {
            setVkDisconnected('Ошибка открытия VK.');
        }
    });

    resetVkBtn?.addEventListener('click', async () => {
        try {
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
            await appWindow.vkAPI?.openLogin();
        } catch {
            setVkDisconnected('Ошибка открытия VK.');
        }
    });

    checkVkSessionOnStart();
}

initVkRenderer();