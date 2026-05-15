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
    publishTextPost: (payload: {
        text: string;
        debug: boolean;
        imagePaths?: string[];
        publishToWall: boolean;
        publishToGroup: boolean;
        groupValue?: string;
    }) => Promise<OkResult>;
};



function initOkRenderer() {
    const appWindow = window as Window & {
        okAPI?: OkAPI;
    };

    const openOkBtn = document.getElementById('openOkBtn') as HTMLButtonElement | null;
    const resetOkBtn = document.getElementById('resetOkBtn') as HTMLButtonElement | null;
    const publishOkBtn = document.getElementById('publishOkBtn') as HTMLButtonElement | null;

    const postText = document.getElementById('postText') as HTMLTextAreaElement | null;
    const debugMode = document.getElementById('debugMode') as HTMLInputElement | null;
    const postImage = document.getElementById('postImage') as HTMLInputElement | null;

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

    const publishToWall = document.getElementById('publishToWall') as HTMLInputElement | null;
    const publishToGroup = document.getElementById('publishToGroup') as HTMLInputElement | null;
    const okGroupField = document.getElementById('okGroupField');
    const okGroupInput = document.getElementById('okGroupInput') as HTMLInputElement | null;
    const okGroupNameRow = document.getElementById('okGroupNameRow');
    const okGroupName = document.getElementById('okGroupName');

    const OK_GROUP_STORAGE_KEY = 'agent003.okGroupValue';

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
            okGroupInput.focus();
        });
    }

    const okStatusBadge = document.getElementById('okStatusBadge');
    const statusBox = document.getElementById('statusBox');

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

            if (okGroupName) {
                okGroupName.textContent = 'не проверена';
            }

            return;
        }

        okGroupNameRow?.classList.remove('hidden');

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
        }
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

    async function checkOkSessionOnStart() {
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

    publishOkBtn?.addEventListener('click', async () => {
        const text = postText?.value.trim() || '';

        if (!text) {
            showStatus('Введите текст поста.');
            return;
        }

        if (!publishToWall?.checked && !publishToGroup?.checked) {
            showStatus('Выберите, куда публиковать: на стену OK или в группу OK.');
            return;
        }

        if (publishToGroup?.checked && !okGroupInput?.value.trim()) {
            showStatus('Укажите ID или ссылку группы OK.');
            return;
        }

        try {
            publishOkBtn.disabled = true;
            showStatus('Публикуем пост в OK...');

            const imagePaths = Array.from(postImage?.files || [])
                .map((file) => (file as File & { path?: string }).path)
                .filter((path): path is string => Boolean(path));

            const result = await appWindow.okAPI?.publishTextPost({
                text,
                debug: Boolean(debugMode?.checked),
                imagePaths,
                publishToWall: Boolean(publishToWall?.checked),
                publishToGroup: Boolean(publishToGroup?.checked),
                groupValue: okGroupInput?.value.trim() || undefined,
            });

            if (result?.success) {
                showStatus(result.message || 'Пост опубликован.');
            } else {
                showStatus(result?.message || 'Не удалось опубликовать пост.');
            }
        } catch (error) {
            showStatus(getErrorMessage(error, 'Ошибка публикации.'));
        } finally {
            publishOkBtn.disabled = false;
        }
    });



    checkOkSessionOnStart();
}

const okRendererWindow = window as Window & {
    initOkRenderer?: () => void;
};

okRendererWindow.initOkRenderer = initOkRenderer;