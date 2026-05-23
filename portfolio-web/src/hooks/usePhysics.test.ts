import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { usePhysics, calculateDiagonalMovement, type PhysicsConfig } from './usePhysics';

describe('usePhysics', () => {
  const defaultConfig: PhysicsConfig = {
    gravity: 0.8,
    jumpForce: -18,
    friction: 0.85,
    maxVelocity: { x: 8, y: 25 },
    acceleration: 0.5,
    deceleration: 0.92
  };

  it('should initialize with default state', () => {
    const { result } = renderHook(() => usePhysics());
    const [state] = result.current;

    expect(state.position).toEqual({ x: 0, y: 0 });
    expect(state.velocity).toEqual({ x: 0, y: 0 });
    expect(state.acceleration).toEqual({ x: 0, y: 0 });
    expect(state.isGrounded).toBe(true);
    expect(state.isJumping).toBe(false);
  });

  it('should apply horizontal forces with smooth acceleration', () => {
    const { result } = renderHook(() => usePhysics(defaultConfig));
    const [, actions] = result.current;

    act(() => {
      actions.applyForce({ x: 1, y: 0 });
      actions.update(1);
    });

    const [state] = result.current;
    expect(state.velocity.x).toBeGreaterThan(0);
    expect(state.acceleration.x).toBe(defaultConfig.acceleration);
  });

  it('should apply deceleration when no force is applied', () => {
    const { result } = renderHook(() => usePhysics(defaultConfig));
    const [, actions] = result.current;

    act(() => {
      actions.applyForce({ x: 1, y: 0 });
      actions.update(1);
    });

    const [stateAfterForce] = result.current;
    const initialVelocity = stateAfterForce.velocity.x;

    act(() => {
      actions.update(1);
    });

    const [stateAfterDecel] = result.current;
    expect(stateAfterDecel.velocity.x).toBeLessThan(initialVelocity);
    expect(stateAfterDecel.velocity.x).toBe(initialVelocity * defaultConfig.deceleration);
  });

  it('should handle jumping mechanics correctly', () => {
    const { result } = renderHook(() => usePhysics(defaultConfig));
    const [initialState, actions] = result.current;

    expect(initialState.isGrounded).toBe(true);
    expect(initialState.isJumping).toBe(false);

    act(() => {
      actions.jump();
    });

    const [stateAfterJump] = result.current;
    expect(stateAfterJump.velocity.y).toBe(defaultConfig.jumpForce);
    expect(stateAfterJump.isJumping).toBe(true);
    expect(stateAfterJump.isGrounded).toBe(false);
  });

  it('should prevent jumping when not grounded', () => {
    const { result } = renderHook(() => usePhysics(defaultConfig));
    const [, actions] = result.current;

    act(() => {
      actions.jump();
    });

    const [stateAfterFirstJump] = result.current;
    const velocityAfterFirstJump = stateAfterFirstJump.velocity.y;

    act(() => {
      actions.jump();
    });

    const [stateAfterSecondJump] = result.current;
    expect(stateAfterSecondJump.velocity.y).toBe(velocityAfterFirstJump);
  });

  it('should apply gravity when not grounded', () => {
    const { result } = renderHook(() => usePhysics(defaultConfig));
    const [, actions] = result.current;

    act(() => {
      actions.jump();
      actions.update(1);
    });

    const [state] = result.current;
    expect(state.acceleration.y).toBe(defaultConfig.gravity);
    expect(state.velocity.y).toBeGreaterThan(defaultConfig.jumpForce);
  });

  it('should handle ground collision correctly', () => {
    const { result } = renderHook(() => usePhysics(defaultConfig));
    const [, actions] = result.current;

    act(() => {
      actions.jump();
      for (let i = 0; i < 50; i++) {
        actions.update(1);
      }
    });

    const [state] = result.current;
    expect(state.position.y).toBe(0);
    expect(state.velocity.y).toBe(0);
    expect(state.isGrounded).toBe(true);
    expect(state.isJumping).toBe(false);
  });

  it('should clamp velocity to maximum values', () => {
    const { result } = renderHook(() => usePhysics(defaultConfig));
    const [, actions] = result.current;

    act(() => {
      for (let i = 0; i < 100; i++) {
        actions.applyForce({ x: 10, y: 0 });
        actions.update(1);
      }
    });

    const [state] = result.current;
    expect(Math.abs(state.velocity.x)).toBeLessThanOrEqual(defaultConfig.maxVelocity.x);
  });

  it('should reset state correctly', () => {
    const { result } = renderHook(() => usePhysics(defaultConfig));
    const [, actions] = result.current;

    act(() => {
      actions.applyForce({ x: 5, y: 0 });
      actions.jump();
      actions.update(1);
    });

    act(() => {
      actions.reset();
    });

    const [state] = result.current;
    expect(state.position).toEqual({ x: 0, y: 0 });
    expect(state.velocity).toEqual({ x: 0, y: 0 });
    expect(state.acceleration).toEqual({ x: 0, y: 0 });
    expect(state.isGrounded).toBe(true);
    expect(state.isJumping).toBe(false);
  });
});

describe('calculateDiagonalMovement', () => {
  it('should return zero vector when no keys are pressed', () => {
    const result = calculateDiagonalMovement(false, false, false, false);
    expect(result).toEqual({ x: 0, y: 0 });
  });

  it('should return correct horizontal movement', () => {
    const leftResult = calculateDiagonalMovement(true, false, false, false);
    expect(leftResult).toEqual({ x: -1, y: 0 });

    const rightResult = calculateDiagonalMovement(false, true, false, false);
    expect(rightResult).toEqual({ x: 1, y: 0 });
  });

  it('should return correct vertical movement', () => {
    const upResult = calculateDiagonalMovement(false, false, true, false);
    expect(upResult).toEqual({ x: 0, y: 1 });

    const downResult = calculateDiagonalMovement(false, false, false, true);
    expect(downResult).toEqual({ x: 0, y: -1 });
  });

  it('should normalize diagonal movement to maintain consistent speed', () => {
    const diagonalResult = calculateDiagonalMovement(true, false, true, false);
    const magnitude = Math.sqrt(diagonalResult.x * diagonalResult.x + diagonalResult.y * diagonalResult.y);
    
    expect(magnitude).toBeCloseTo(1, 5);
    expect(diagonalResult.x).toBeCloseTo(-1 / Math.sqrt(2), 5);
    expect(diagonalResult.y).toBeCloseTo(1 / Math.sqrt(2), 5);
  });

  it('should handle opposite directions correctly', () => {
    const horizontalCancel = calculateDiagonalMovement(true, true, false, false);
    expect(horizontalCancel).toEqual({ x: 0, y: 0 });

    const verticalCancel = calculateDiagonalMovement(false, false, true, true);
    expect(verticalCancel).toEqual({ x: 0, y: 0 });
  });

  it('should handle all four directions pressed simultaneously', () => {
    const allDirections = calculateDiagonalMovement(true, true, true, true);
    expect(allDirections).toEqual({ x: 0, y: 0 });
  });
});