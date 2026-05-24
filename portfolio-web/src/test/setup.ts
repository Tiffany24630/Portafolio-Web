import '@testing-library/jest-dom';

globalThis.requestAnimationFrame = (callback: FrameRequestCallback) => {
  return setTimeout(() => callback(Date.now()), 16);
};

globalThis.cancelAnimationFrame = (id: number) => {
  clearTimeout(id);
};
