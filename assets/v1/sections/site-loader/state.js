// site-loader/state.js - State management
export function createState() {
  return {
    progress: { value: 0, fps: 24 },
    heroResumeTimeout: null,
    heroReadyListener: null
  };
}