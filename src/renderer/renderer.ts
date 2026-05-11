type OkResult = {
  success: boolean;
  message: string;
  profileName?: string;
  profileUrl?: string;
};

type OkAPI = {
  openLogin: () => Promise<OkResult>;
  checkSession: () => Promise<OkResult>;
  resetSession: () => Promise<OkResult>;
  publishTextPost: (payload: { text: string; debug: boolean; imagePath?: string }) => Promise<OkResult>;
};

interface Window {
  okAPI?: OkAPI;
}

document.addEventListener('DOMContentLoaded', () => {
  const openOkBtn = document.getElementById('openOkBtn') as HTMLButtonElement | null;
  const resetOkBtn = document.getElementById('resetOkBtn') as HTMLButtonElement | null;
  const publishOkBtn = document.getElementById('publishOkBtn') as HTMLButtonElement | null;
  const postText = document.getElementById('postText') as HTMLTextAreaElement | null;
  const debugMode = document.getElementById('debugMode') as HTMLInputElement | null;
  const postImage = document.getElementById('postImage') as HTMLInputElement | null;

  const okStatusBadge = document.getElementById('okStatusBadge');
  const statusBox = document.getElementById('statusBox');

  const okProfileBox = document.getElementById('okProfileBox');
  const okProfileName = document.getElementById('okProfileName');
  const okProfileLink = document.getElementById('okProfileLink') as HTMLAnchorElement | null;

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
      okProfileLink.href = '#';
    }
  }

  function showProfile(profileName?: string, profileUrl?: string) {
    if (!profileName && !profileUrl) {
      hideProfile();
      return;
    }

    okProfileBox?.classList.remove('hidden');

    if (okProfileName) {
      okProfileName.textContent = profileName ? `Аккаунт: ${profileName}` : 'Аккаунт OK';
    }

    if (okProfileLink && profileUrl) {
      okProfileLink.href = profileUrl;
      okProfileLink.classList.remove('hidden');
    } else {
      okProfileLink?.classList.add('hidden');
    }
  }

  function setOkConnected(result?: OkResult) {
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
      const result = await window.okAPI?.checkSession();

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
      showStatus('Открываем OK...');

      const result = await window.okAPI?.openLogin();

      if (result?.success) {
        hideStatus();
      } else {
        setOkDisconnected(result?.message || 'Не удалось открыть OK.');
      }
    } catch (error) {
      setOkDisconnected(error instanceof Error ? error.message : 'Ошибка открытия OK.');
    }
  });

  resetOkBtn?.addEventListener('click', async () => {
    try {
      showStatus('Сбрасываем сессию OK...');

      const result = await window.okAPI?.resetSession();

      if (result?.success) {
        setOkDisconnected('Сессия OK сброшена. Нажмите “Подключение OK” и войдите заново.');
      } else {
        setOkDisconnected(result?.message || 'Не удалось сбросить сессию OK.');
      }
    } catch (error) {
      setOkDisconnected(error instanceof Error ? error.message : 'Ошибка сброса сессии OK.');
    }
  });

  publishOkBtn?.addEventListener('click', async () => {
    const text = postText?.value.trim() || '';

    if (!text) {
      showStatus('Введите текст поста.');
      return;
    }

    try {
      publishOkBtn.disabled = true;
      showStatus('Публикуем текстовый пост в OK...');

      const imageFile = postImage?.files?.[0] as File & { path?: string } | undefined;
      const imagePath = imageFile?.path;

      const result = await window.okAPI?.publishTextPost({
        text,
        debug: Boolean(debugMode?.checked),
        imagePath,
      });

      if (result?.success) {
        showStatus(result.message || 'Пост опубликован.');
      } else {
        showStatus(result?.message || 'Не удалось опубликовать пост.');
      }
    } catch (error) {
      showStatus(error instanceof Error ? error.message : 'Ошибка публикации.');
    } finally {
      publishOkBtn.disabled = false;
    }
  });

  checkOkSessionOnStart();
});