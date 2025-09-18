// site-loader/state.js - State management
export function createState() {
  const state = {
    progress: { value: 0, fps: 24 },
    videoStarted: false,
    morphStarted: false,
    heroResumeTimeout: null,
    handlers: []
  };

  return {
    ...state,
    cleanup() {
      if (state.heroResumeTimeout) {
        clearTimeout(state.heroResumeTimeout);
      }
      state.handlers.forEach(fn => fn());
      state.handlers = [];
    }
  };
}