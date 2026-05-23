import { useCallback, useEffect, useRef, useState } from 'react';

export interface GameEngineState {
  isRunning: boolean;
  currentPhase: 'intro' | 'playing' | 'transitioning' | 'complete';
  deltaTime: number;
  frameRate: number;
  lastFrameTime: number;
}

export interface GameEngineActions {
  start: () => void;
  pause: () => void;
  resume: () => void;
  setPhase: (phase: GameEngineState['currentPhase']) => void;
}

export interface PerformanceMetrics {
  averageFrameRate: number;
  frameTimeHistory: number[];
  droppedFrames: number;
  totalFrames: number;
}

const TARGET_FPS = 60;
const TARGET_FRAME_TIME = 1000 / TARGET_FPS; 
const FRAME_HISTORY_SIZE = 60; 

export function useGameEngine(
  onUpdate?: (deltaTime: number) => void
): [GameEngineState, GameEngineActions, PerformanceMetrics] {
  const [state, setState] = useState<GameEngineState>({
    isRunning: false,
    currentPhase: 'intro',
    deltaTime: 0,
    frameRate: 0,
    lastFrameTime: 0
  });

  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    averageFrameRate: 0,
    frameTimeHistory: [],
    droppedFrames: 0,
    totalFrames: 0
  });

  const animationFrameRef = useRef<number | undefined>(undefined);
  const lastTimeRef = useRef<number>(0);
  const frameTimeHistoryRef = useRef<number[]>([]);
  const totalFramesRef = useRef<number>(0);
  const droppedFramesRef = useRef<number>(0);
  const isRunningRef = useRef<boolean>(false);

  const gameLoop = useCallback((currentTime: number) => {
    if (!isRunningRef.current) {
      return;
    }

    if (!lastTimeRef.current) {
      lastTimeRef.current = currentTime;
    }

    const deltaTime = currentTime - lastTimeRef.current;
    const frameRate = deltaTime > 0 ? 1000 / deltaTime : 0;

    totalFramesRef.current++;
    frameTimeHistoryRef.current.push(deltaTime);
    
    if (frameTimeHistoryRef.current.length > FRAME_HISTORY_SIZE) {
      frameTimeHistoryRef.current.shift();
    }

    if (deltaTime > TARGET_FRAME_TIME * 1.5) {
      droppedFramesRef.current++;
    }

    const averageFrameTime = frameTimeHistoryRef.current.reduce((a, b) => a + b, 0) / 
                            frameTimeHistoryRef.current.length;
    const averageFrameRate = averageFrameTime > 0 ? 1000 / averageFrameTime : 0;

    setState(prev => ({
      ...prev,
      deltaTime,
      frameRate,
      lastFrameTime: currentTime
    }));

    if (totalFramesRef.current % 60 === 0) {
      setMetrics({
        averageFrameRate,
        frameTimeHistory: [...frameTimeHistoryRef.current],
        droppedFrames: droppedFramesRef.current,
        totalFrames: totalFramesRef.current
      });
    }

    if (onUpdate) {
      onUpdate(deltaTime);
    }

    lastTimeRef.current = currentTime;

    if (isRunningRef.current) {
      animationFrameRef.current = requestAnimationFrame(gameLoop);
    }
  }, [onUpdate]);

  const start = useCallback(() => {
    isRunningRef.current = true;
    setState(prev => ({ ...prev, isRunning: true }));
    lastTimeRef.current = 0;
    animationFrameRef.current = requestAnimationFrame(gameLoop);
  }, [gameLoop]);

  const pause = useCallback(() => {
    isRunningRef.current = false;
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setState(prev => ({ ...prev, isRunning: false }));
  }, []);

  const resume = useCallback(() => {
    isRunningRef.current = true;
    setState(prev => ({ ...prev, isRunning: true }));
    lastTimeRef.current = 0; 
    animationFrameRef.current = requestAnimationFrame(gameLoop);
  }, [gameLoop]);

  const setPhase = useCallback((phase: GameEngineState['currentPhase']) => {
    setState(prev => ({ ...prev, currentPhase: phase }));
  }, []);

  useEffect(() => {
    return () => {
      isRunningRef.current = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    start();
    return () => pause();
  }, [start, pause]);

  return [
    state,
    { start, pause, resume, setPhase },
    metrics
  ];
}

export function getPerformanceGrade(metrics: PerformanceMetrics): 'excellent' | 'good' | 'fair' | 'poor' {
  const { averageFrameRate, droppedFrames, totalFrames } = metrics;
  const dropRate = totalFrames > 0 ? droppedFrames / totalFrames : 0;

  if (averageFrameRate >= 58 && dropRate < 0.02) return 'excellent';
  if (averageFrameRate >= 50 && dropRate < 0.05) return 'good';
  if (averageFrameRate >= 40 && dropRate < 0.1) return 'fair';
  return 'poor';
}

export function shouldReduceQuality(metrics: PerformanceMetrics): boolean {
  const grade = getPerformanceGrade(metrics);
  return grade === 'fair' || grade === 'poor';
}