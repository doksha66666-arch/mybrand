const INSTALL_KEY = '__mybrandMerchantLiveTrackOrderFixInstalled';

if (typeof window !== 'undefined' && !window[INSTALL_KEY]) {
  window[INSTALL_KEY] = true;
  const NativePC = window.RTCPeerConnection;

  if (NativePC) {
    window.RTCPeerConnection = function MyBrandMerchantRTCPeerConnection(...args) {
      const pc = new NativePC(...args);
      const queued = [];
      let remoteDescriptionReady = false;
      const nativeAddTrack = pc.addTrack.bind(pc);
      const nativeSetRemoteDescription = pc.setRemoteDescription.bind(pc);

      pc.addTrack = (track, stream) => {
        if (!remoteDescriptionReady && !pc.remoteDescription) {
          queued.push({ track, stream });
          return {
            getParameters: () => ({ encodings: [{}] }),
            setParameters: async () => {},
            replaceTrack: async () => {},
          };
        }
        return nativeAddTrack(track, stream);
      };

      pc.setRemoteDescription = async (description) => {
        const result = await nativeSetRemoteDescription(description);
        remoteDescriptionReady = true;
        for (const item of queued.splice(0)) {
          try { nativeAddTrack(item.track, item.stream); } catch (_) {}
        }
        return result;
      };

      return pc;
    };
    window.RTCPeerConnection.prototype = NativePC.prototype;
  }
}
