import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useGameEngine, getPerformanceGrade, shouldReduceQuality } from './useGameEngine';

(globalThis as any).requestAnimationFrame = vi.fn((callback) => {
  return setTimeout(() => callback(Date.now()), 16);
});

(globalThis as any).cancelAnimationFrame = vi.fn((id) => {
  clearTimeout(id);
});

describe('useGameEngine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.clearAllTimers();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should initialize with correct default state', () => {
    const { result } = renderHook(() => useGameEngine());
    const [state] = result.current;

    expect(state.isRunning).toBe(true); // Auto-starts
    expect(state.currentPhase).toBe('intro');
    expect(state.deltaTime).toBe(0);
    expect(state.frameRate).toBe(0);
    expect(state.lastFrameTime).toBe(0);
  });

  it('should start and stop the game engine', () => {
    const { result } = renderHook(() => useGameEngine());
    const [, actions] = result.current;

    act(() => {
      actions.pause();
    });

    expect(result.current[0].isRunning).toBe(false);

    act(() => {
      actions.start();
    });

    expect(result.current[0].isRunning).toBe(true);
  });

  it('should change game phases correctly', () => {
    const { result } = renderHook(() => useGameEngine());
    const [, actions] = result.current;

    act(() => {
      actions.setPhase('playing');
    });

    expect(result.current[0].currentPhase).toBe('playing');

    act(() => {
      actions.setPhase('transitioning');
    });

    expect(result.current[0].currentPhase).toBe('transitioning');
  });

  it('should call onUpdate callback when provided', () => {
    const mockOnUpdate = vi.fn();
    renderHook(() => useGameEngine(mockOnUpdate));

¿    act(() => {
      vi.advanceTimersByTime(16);
    });

    expect(mockOnUpdate).toHaveBeenCalled();
    expect(mockOnUpdate).toHaveBeenCalledWith(expect.any(Number));
  });

  it('should track performance metrics', () => {
    const { result } = renderHook(() => useGameEngine());
    const [, , metrics] = result.current;

    expect(metrics.averageFrameRate).toBe(0);
    expect(metrics.frameTimeHistory).toEqual([]);
    expect(metrics.droppedFrames).toBe(0);
    expect(metrics.totalFrames).toBe(0);
  });

  it('should resume from pause correctly', () => {
    const { result } = renderHook(() => useGameEngine());
    const [, actions] = result.current;

    act(() => {
      actions.pause();
    });

    expect(result.current[0].isRunning).toBe(false);

    act(() => {
      actions.resume();
    });

    expect(result.current[0].isRunning).toBe(true);
  });

  it('should handle cleanup on unmount', () => {
    const cancelSpy = vi.spyOn(globalThis as any, 'cancelAnimationFrame');
    const { unmount } = renderHook(() => useGameEngine());
    
    unmount();

    expect(cancelSpy).toHaveBeenCalled();
    cancelSpy.mockRestore();
  });
});

describe('Performance utilities', () => {
  describe('getPerformanceGrade', () => {
    it('should return excellent for high performance', () => {
      const metrics = {
        averageFrameRate: 60,
        frameTimeHistory: [],
        droppedFrames: 1,
        totalFrames: 1000
      };

      expect(getPerformanceGrade(metrics)).toBe('excellent');
    });

    it('should return good for decent performance', () => {
      const metrics = {
        averageFrameRate: 55,
        frameTimeHistory: [],
        droppedFrames: 30,
        totalFrames: 1000
      };

      expect(getPerformanceGrade(metrics)).toBe('good');
    });

    it('should return fair for mediocre performance', () => {
      const metrics = {
        averageFrameRate: 45,
        frameTimeHistory: [],
        droppedFrames: 80,
        totalFrames: 1000
      };

      expect(getPerformanceGrade(metrics)).toBe('fair');
    });

    it('should return poor for bad performance', () => {
      const metrics = {
        averageFrameRate: 30,
        frameTimeHistory: [],
        droppedFrames: 200,
        totalFrames: 1000
      };

      expect(getPerformanceGrade(metrics)).toBe('poor');
    });

    it('should handle zero total frames', () => {
      const metrics = {
        averageFrameRate: 60,
        frameTimeHistory: [],
        droppedFrames: 0,
        totalFrames: 0
      };

      expect(getPerformanceGrade(metrics)).toBe('excellent');
    });
  });

  describe('shouldReduceQuality', () => {
    it('should return false for excellent performance', () => {
      const metrics = {
        averageFrameRate: 60,
        frameTimeHistory: [],
        droppedFrames: 1,
        totalFrames: 1000
      };

      expect(shouldReduceQuality(metrics)).toBe(false);
    });

    it('should return false for good performance', () => {
      const metrics = {
        averageFrameRate: 55,
        frameTimeHistory: [],
        droppedFrames: 30,
        totalFrames: 1000
      };

      expect(shouldReduceQuality(metrics)).toBe(false);
    });

    it('should return true for fair performance', () => {
      const metrics = {
        averageFrameRate: 45,
        frameTimeHistory: [],
        droppedFrames: 80,
        totalFrames: 1000
      };

      expect(shouldReduceQuality(metrics)).toBe(true);
    });

    it('should return true for poor performance', () => {
      const metrics = {
        averageFrameRate: 30,
        frameTimeHistory: [],
        droppedFrames: 200,
        totalFrames: 1000
      };

      expect(shouldReduceQuality(metrics)).toBe(true);
    });
  });
});