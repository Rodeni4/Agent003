type OkResult = {
    success: boolean;
    message: string;
    profileName?: string;
    profileUrl?: string;
};

type OkGroupResult = {
    success: boolean;
    message: string;
    groupId?: string;
    groupName?: string;
    groupUrl?: string;
};

type OkAPI = {
    getGroupInfo: (groupValue: string) => Promise<OkGroupResult>;
    openLogin: (url?: string) => Promise<OkResult>;
    checkSession: () => Promise<OkResult>;
    resetSession: () => Promise<OkResult>;
};

function initOkRenderer() {
    const appWindow = window as Window & {
        okAPI?: OkAPI;
    };

    const openOkBtn = document.getElementById('openOkBtn') as HTMLButtonElement | null;
    const resetOkBtn = document.getElementById('resetOkBtn') as HTMLButtonElement | null;
    const okGroupField = document.getElementById('okGroupField');
    const okGroupInput = document.getElementById('okGroupInput') as HTMLInputElement | null;
    const okGroupNameRow = document.getElementById('okGroupNameRow');
    const okGroupName = document.getElementById('okGroupName');
    const OK_GROUP_STORAGE_KEY = 'agent003.okGroupValue';

    let okGroupProgressTimer: number | undefined;
let okGroupProgressValue = 0;

function startOkGroupProgress() {
    window.clearInterval(okGroupProgressTimer);

    okGroupProgressValue = 3;
    okGroupNameRow?.classList.add('loading-border');

    const nameBox = okGroupNameRow?.querySelector('.profile-name-input') as HTMLElement | null;
    nameBox?.style.setProperty('--group-progress-deg', `${okGroupProgressValue * 3.6}deg`);

    okGroupProgressTimer = window.setInterval(() => {
        if (okGroupProgressValue < 92) {
            okGroupProgressValue += Math.max(1, (92 - okGroupProgressValue) * 0.08);

            nameBox?.style.setProperty(
                '--group-progress-deg',
                `${okGroupProgressValue * 3.6}deg`
            );
        }
    }, 180);
}

function finishOkGroupProgress() {
    window.clearInterval(okGroupProgressTimer);

    const nameBox = okGroupNameRow?.querySelector('.profile-name-input') as HTMLElement | null;
    nameBox?.style.setProperty('--group-progress-deg', '360deg');

    window.setTimeout(() => {
        okGroupNameRow?.classList.remove('loading-border');
        nameBox?.style.removeProperty('--group-progress-deg');
        okGroupProgressValue = 0;
    }, 350);
}

    const okStatusBadge = document.getElementById('okStatusBadge');
    const okCard = okStatusBadge?.closest('.card') as HTMLElement | null;
    const statusBox = document.getElementById('statusBox');

    const okProgressBar = document.createElement('div');
    okProgressBar.className = 'card-progress';

    if (okCard) {
        okCard.appendChild(okProgressBar);
    }

    let okProgressTimer: number | undefined;
    let okProgressValue = 0;

    function startOkProgress() {
        window.clearInterval(okProgressTimer);

        okProgressValue = 3;
        okProgressBar.style.width = `${okProgressValue}%`;
        okCard?.classList.add('loading');

        okProgressTimer = window.setInterval(() => {
            if (okProgressValue < 92) {
                okProgressValue += Math.max(1, (92 - okProgressValue) * 0.08);
                okProgressBar.style.width = `${okProgressValue}%`;
            }
        }, 180);
    }

    function finishOkProgress() {
        window.clearInterval(okProgressTimer);

        okProgressBar.style.width = '100%';

        window.setTimeout(() => {
            okCard?.classList.remove('loading');
            okProgressBar.style.width = '0';
            okProgressValue = 0;
        }, 350);
    }

    const okProfileBox = document.getElementById('okProfileBox');
    const okProfileName = document.getElementById('okProfileName');
    const okProfileLink = document.getElementById('okProfileLink') as HTMLButtonElement | null;

    const authTabBtn = document.getElementById('authTabBtn') as HTMLButtonElement | null;
    const publishTabBtn = document.getElementById('publishTabBtn') as HTMLButtonElement | null;
    const authTabView = document.getElementById('authTabView');
    const publishTabView = document.getElementById('publishTabView');

    function setActiveTab(tab: 'auth' | 'publish') {
        authTabBtn?.classList.toggle('active', tab === 'auth');
        publishTabBtn?.classList.toggle('active', tab === 'publish');

        authTabView?.classList.toggle('active', tab === 'auth');
        publishTabView?.classList.toggle('active', tab === 'publish');
    }

    authTabBtn?.addEventListener('click', () => {
        setActiveTab('auth');
    });

    publishTabBtn?.addEventListener('click', () => {
        setActiveTab('publish');
    });

    function getErrorMessage(error: unknown, fallbackMessage: string) {
        return error instanceof Error ? error.message : fallbackMessage;
    }

    function showStatus(message: string) {
        if (!statusBox) return;

        statusBox.textContent = message;
        statusBox.classList.remove('hidden');
    }

    function hideStatus() {
        if (!statusBox) return;

        statusBox.textContent = '';
        statusBox.classList.add('hidden');
    }

    function hideProfile() {
        okProfileBox?.classList.add('hidden');

        if (okProfileName) {
            okProfileName.textContent = '';
        }

        if (okProfileLink) {
            delete okProfileLink.dataset.profileUrl;
        }
    }

async function loadOkGroupName() {
    const groupValue = okGroupInput?.value.trim();

    if (!groupValue) {
        okGroupNameRow?.classList.add('hidden');
        finishOkGroupProgress();

        if (okGroupName) {
            okGroupName.textContent = 'не проверена';
        }

        return;
    }

    okGroupNameRow?.classList.remove('hidden');
    startOkGroupProgress();

    if (okGroupName) {
        okGroupName.textContent = 'проверяем...';
    }

    try {
        const result = await appWindow.okAPI?.getGroupInfo(groupValue);

        if (result?.success) {
            if (okGroupName) {
                okGroupName.textContent = result.groupName || 'Группа OK';
            }

            return;
        }

        if (okGroupName) {
            okGroupName.textContent = 'не удалось проверить';
        }
    } catch {
        if (okGroupName) {
            okGroupName.textContent = 'не удалось проверить';
        }
    } finally {
        finishOkGroupProgress();
    }
}

    if (okGroupInput) {
        okGroupInput.value = localStorage.getItem(OK_GROUP_STORAGE_KEY) || '';

        okGroupInput.addEventListener('input', () => {
            localStorage.setItem(OK_GROUP_STORAGE_KEY, okGroupInput.value);

            if (okGroupInput.value.trim()) {
                okGroupNameRow?.classList.remove('hidden');

                if (okGroupName) {
                    okGroupName.textContent = 'не проверена';
                }
            } else {
                okGroupNameRow?.classList.add('hidden');

                if (okGroupName) {
                    okGroupName.textContent = 'не проверена';
                }
            }
        });

        const clearOkGroupBtn = document.createElement('button');
        clearOkGroupBtn.type = 'button';
        clearOkGroupBtn.className = 'clear-input-btn';
        clearOkGroupBtn.title = 'Очистить группу';
        clearOkGroupBtn.textContent = '🗑';

        const openOkGroupBtn = document.createElement('button');
        openOkGroupBtn.type = 'button';
        openOkGroupBtn.className = 'clear-input-btn open-group-btn';
        openOkGroupBtn.title = 'Открыть группу OK';
        openOkGroupBtn.textContent = '↗';

        okGroupInput.insertAdjacentElement('afterend', clearOkGroupBtn);
        clearOkGroupBtn.insertAdjacentElement('beforebegin', openOkGroupBtn);

        okGroupInput.parentElement?.classList.add('input-with-clear');

        openOkGroupBtn.addEventListener('click', async () => {
            const groupValue = okGroupInput.value.trim();

            if (!groupValue) {
                showStatus('Укажите ID или ссылку группы OK.');
                return;
            }

            const groupIdMatch = groupValue.match(/group\/(\d+)/);
            const groupId = groupIdMatch?.[1] || groupValue.match(/^\d+$/)?.[0];

            if (!groupId) {
                showStatus('Некорректная группа OK.');
                return;
            }

            try {
                await appWindow.okAPI?.openLogin(`https://ok.ru/group/${groupId}`);
            } catch (error) {
                showStatus(getErrorMessage(error, 'Ошибка открытия группы OK.'));
            }
        });

        clearOkGroupBtn.addEventListener('click', () => {
            okGroupInput.value = '';
            localStorage.removeItem(OK_GROUP_STORAGE_KEY);

            okGroupNameRow?.classList.add('hidden');

            if (okGroupName) {
                okGroupName.textContent = 'не проверена';
            }

            okGroupInput.focus();
        });
    }

    function showProfile(profileName?: string, profileUrl?: string) {
        if (!profileName && !profileUrl) {
            hideProfile();
            return;
        }

        okProfileBox?.classList.remove('hidden');

        if (okProfileName) {
            okProfileName.textContent = profileName ? `${profileName}` : 'Аккаунт OK';
        }

        if (okProfileLink && profileUrl) {
            okProfileLink.dataset.profileUrl = profileUrl;
            okProfileLink.classList.remove('hidden');
        } else {
            okProfileLink?.classList.add('hidden');
        }
    }

    function setOkConnected(result?: OkResult) {
        finishOkProgress();

        if (okGroupInput) {
            okGroupInput.value = localStorage.getItem(OK_GROUP_STORAGE_KEY) || '';
        }

        okGroupField?.classList.remove('hidden');
        okGroupNameRow?.classList.toggle('hidden', !okGroupInput?.value.trim());
        void loadOkGroupName();

        if (okStatusBadge) {
            okStatusBadge.textContent = 'OK подключён';
            okStatusBadge.className = 'badge connected';
        }

        openOkBtn?.classList.add('hidden');
        resetOkBtn?.classList.remove('hidden');

        showProfile(result?.profileName, result?.profileUrl);
        hideStatus();
    }

    function setOkDisconnected(message?: string) {
        finishOkProgress();

        okGroupField?.classList.add('hidden');
        okGroupNameRow?.classList.add('hidden');

        if (okStatusBadge) {
            okStatusBadge.textContent = 'OK не подключён';
            okStatusBadge.className = 'badge disconnected';
        }

        openOkBtn?.classList.remove('hidden');
        resetOkBtn?.classList.add('hidden');

        hideProfile();

        if (message) {
            showStatus(message);
        } else {
            hideStatus();
        }
    }

    function setOkChecking() {
        startOkProgress();

        if (okStatusBadge) {
            okStatusBadge.textContent = 'Проверяем OK...';
            okStatusBadge.className = 'badge pending';
        }

        hideStatus();
    }

    async function checkOkSessionOnStart() {
        setOkChecking();

        try {
            const result = await appWindow.okAPI?.checkSession();

            if (result?.success) {
                setOkConnected(result);
            } else {
                setOkDisconnected();
            }
        } catch {
            setOkDisconnected('Не удалось проверить сессию OK.');
        }
    }

    openOkBtn?.addEventListener('click', async () => {
        try {
            setOkChecking();
            showStatus('Открываем OK. После входа закройте окно браузера...');

            const result = await appWindow.okAPI?.openLogin();

            if (result?.success) {
                setOkConnected(result);
            } else {
                setOkDisconnected(result?.message || 'OK не подключён.');
            }
        } catch (error) {
            setOkDisconnected(getErrorMessage(error, 'Ошибка открытия OK.'));
        }
    });

    okProfileLink?.addEventListener('click', async () => {
        try {
            await appWindow.okAPI?.openLogin();
        } catch (error) {
            showStatus(getErrorMessage(error, 'Ошибка открытия OK.'));
        }
    });

    resetOkBtn?.addEventListener('click', async () => {
        try {
            setOkChecking();
            showStatus('Сбрасываем сессию OK...');

            const result = await appWindow.okAPI?.resetSession();

            if (result?.success) {
                setOkDisconnected('Сессия OK сброшена. Нажмите “Подключение OK” и войдите заново.');
            } else {
                setOkDisconnected(result?.message || 'Не удалось сбросить сессию OK.');
            }
        } catch (error) {
            setOkDisconnected(getErrorMessage(error, 'Ошибка сброса сессии OK.'));
        }
    });

    checkOkSessionOnStart();
}

const okRendererWindow = window as Window & {
    initOkRenderer?: () => void;
};

okRendererWindow.initOkRenderer = initOkRenderer;