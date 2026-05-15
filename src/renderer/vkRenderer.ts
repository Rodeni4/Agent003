type VkResult = {
  success: boolean;
  message: string;
  profileName?: string;
};

type VkAPI = {
  openLogin: () => Promise<VkResult>;
  checkSession: () => Promise<VkResult>;
  resetSession: () => Promise<VkResult>;
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

  function hideVkProfile() {
    vkProfileBox?.classList.add('hidden');
    vkGroupField?.classList.add('hidden');
    vkGroupNameRow?.classList.add('hidden');

    if (vkProfileName) {
      vkProfileName.textContent = '';
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