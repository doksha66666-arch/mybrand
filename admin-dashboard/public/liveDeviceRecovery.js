(() => {
  const mediaDevices = navigator.mediaDevices;
  if (!mediaDevices?.getUserMedia || mediaDevices.getUserMedia.__mybrandRecovery) return;

  const originalGetUserMedia = mediaDevices.getUserMedia.bind(mediaDevices);
  const recoverable = (error) => {
    const name = String(error?.name || '');
    const message = String(error?.message || '').toLowerCase();
    return ['NotFoundError', 'NotReadableError', 'OverconstrainedError'].includes(name)
      || /device (was )?removed|could not start|not available|not found/.test(message);
  };

  const simplifyVideo = (constraints) => {
    if (constraints?.video === false) return constraints;
    return { ...constraints, video: true };
  };

  const recoveredGetUserMedia = async (constraints) => {
    try {
      return await originalGetUserMedia(constraints);
    } catch (firstError) {
      if (!recoverable(firstError)) throw firstError;

      // A missing/removed microphone must not prevent the camera from opening.
      if (constraints?.video && constraints?.audio) {
        try {
          return await originalGetUserMedia({ ...constraints, audio: false });
        } catch (_) {}
      }

      // A stale capability constraint can make an otherwise valid camera fail.
      if (constraints?.video) {
        try {
          return await originalGetUserMedia(simplifyVideo(constraints));
        } catch (_) {}
      }

      throw new DOMException(
        'تعذر الوصول إلى الكاميرا. تأكد من أن الكاميرا متصلة وغير مستخدمة بواسطة برنامج آخر، ثم حاول مرة أخرى.',
        'NotReadableError',
      );
    }
  };

  recoveredGetUserMedia.__mybrandRecovery = true;
  mediaDevices.getUserMedia = recoveredGetUserMedia;
})();
