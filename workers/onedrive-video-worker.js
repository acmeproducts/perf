self.onmessage = async (event) => {
  const { type, url, mimeType, fileName } = event.data || {};
  if (type !== 'start' || !url) {
    return;
  }

  const controller = new AbortController();
  let aborted = false;

  const abortHandler = (messageEvent) => {
    if (messageEvent.data?.type === 'abort') {
      aborted = true;
      controller.abort();
    }
  };

  self.addEventListener('message', abortHandler);

  try {
    const response = await fetch(url, { signal: controller.signal, cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Download failed with status ${response.status}`);
    }

    const totalBytes = Number(response.headers.get('content-length') || 0);
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Readable stream unavailable in worker');
    }

    let downloadedBytes = 0;
    self.postMessage({ type: 'meta', totalBytes, mimeType, fileName });

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      if (!value) {
        continue;
      }
      downloadedBytes += value.byteLength;
      self.postMessage(
        {
          type: 'chunk',
          chunk: value.buffer,
          downloadedBytes,
          totalBytes
        },
        [value.buffer]
      );
    }

    self.postMessage({ type: 'done', downloadedBytes, totalBytes, mimeType, fileName });
  } catch (error) {
    if (aborted || error?.name === 'AbortError') {
      self.postMessage({ type: 'aborted' });
    } else {
      self.postMessage({ type: 'error', message: error?.message || 'Background download failed' });
    }
  } finally {
    self.removeEventListener('message', abortHandler);
  }
};
