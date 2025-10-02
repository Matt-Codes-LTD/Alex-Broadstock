// site-loader/state.js - State management
export function createState() {
  return {
    progress: { value: 0 },
    heroResumeTimeout: null,
    heroReadyListener: null
  };
}