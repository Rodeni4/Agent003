document.addEventListener('DOMContentLoaded', () => {
  const appWindow = window as Window & {
    initOkRenderer?: () => void;
  };

  appWindow.initOkRenderer?.();
});