import '@testing-library/jest-dom';

(globalThis as any).requestAnimationFrame = (callback: FrameRequestCallback) => {
  return setTimeout(() => callback(Date.now()), 16);
};

(globalThis as any).cancelAnimationFrame = (id: number) => {
  clearTimeout(id);
};