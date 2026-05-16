export type PublishPlatform = 'OK' | 'VK';

export function getPublishErrorMessage(error: unknown, platform: PublishPlatform) {
    const message = error instanceof Error ? error.message : String(error);

    if (
        message.includes('net::ERR_NAME_NOT_RESOLVED') // ||
    //    message.includes('net::ERR_INTERNET_DISCONNECTED') ||
    //    message.includes('net::ERR_NETWORK_CHANGED') ||
    //    message.includes('net::ERR_CONNECTION_TIMED_OUT') ||
    //    message.includes('net::ERR_CONNECTION_RESET') ||
    //    message.includes('Timeout')
    ) {
        return `Ошибка публикации ${platform}: проверьте интернет-соединение.`;
    }

    return `Ошибка публикации ${platform}: ${message}`;
}