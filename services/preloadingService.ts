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

        const onResourceProcessed = () => {
            loadedCount++;
            const percentage = Math.round((loadedCount / totalResources) * 100);
            onProgress(percentage);
            if (loadedCount === totalResources) {
                resolve();
            }
        };

        urls.forEach((url) => {
            if (url.toLowerCase().endsWith('.mp4')) {
                const video = document.createElement('video');
                let processed = false;

                const processOnce = () => {
                    if (!processed) {
                        processed = true;
                        // Clean up listeners to prevent memory leaks
                        video.removeEventListener('canplaythrough', onCanPlay);
                        video.removeEventListener('error', onError);
                        onResourceProcessed();
                    }
                };
                
                const timeoutId = setTimeout(() => {
                    console.warn(`Preloading timed out for video: ${url}`);
                    processOnce();
                }, 15000); // 15-second timeout for each video

                const onCanPlay = () => {
                    clearTimeout(timeoutId);
                    processOnce();
                };

                const onError = () => {
                    console.warn(`Error preloading video: ${url}`);
                    clearTimeout(timeoutId);
                    processOnce();
                };

                video.addEventListener('canplaythrough', onCanPlay, { once: true });
                video.addEventListener('error', onError, { once: true });
                
                video.src = url;

            } else {
                const img = new Image();
                img.onload = onResourceProcessed;
                img.onerror = () => { // Count errors as "processed" to not block the app
                    console.warn(`Error preloading image: ${url}`);
                    onResourceProcessed();
                };
                img.src = url;
            }
        });
    });
};
