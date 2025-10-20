export const preloadResources = (
    urls: string[],
    onProgress: (percentage: number) => void
): Promise<void> => {
    return new Promise((resolve) => {
        let loadedCount = 0;
        const totalResources = urls.length;

        if (totalResources === 0) {
            onProgress(100);
            resolve();
            return;
        }

        urls.forEach((url) => {
            const onResourceProcessed = () => {
                loadedCount++;
                const percentage = Math.round((loadedCount / totalResources) * 100);
                onProgress(percentage);
                if (loadedCount === totalResources) {
                    resolve();
                }
            };

            if (url.toLowerCase().endsWith('.mp4')) {
                const video = document.createElement('video');
                video.addEventListener('canplaythrough', onResourceProcessed, { once: true });
                video.addEventListener('error', onResourceProcessed, { once: true });
                video.src = url;
            } else {
                const img = new Image();
                img.onload = onResourceProcessed;
                img.onerror = onResourceProcessed; // Count errors as "processed" to not block the app
                img.src = url;
            }
        });
    });
};