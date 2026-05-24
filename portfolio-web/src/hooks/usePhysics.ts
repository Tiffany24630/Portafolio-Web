import { useCallback, useMemo, useRef, useState } from 'react';

export interface Vector2D {
  x: number;
  y: number;
}

export interface PhysicsState {
  position: Vector2D;
  velocity: Vector2D;
  acceleration: Vector2D;
  isGrounded: boolean;
  isJumping: boolean;
}

export interface PhysicsConfig {
  gravity: number;
  jumpForce: number;
  friction: number;
  maxVelocity: Vector2D;
  acceleration: number;
  deceleration: number;
}

export interface PhysicsActions {
  applyForce: (force: Vector2D) => void;
  jump: () => void;
  setGrounded: (grounded: boolean) => void;
  reset: () => void;
  update: (deltaTime: number) => void;
}

const DEFAULT_CONFIG: PhysicsConfig = {
  gravity: 0.8,
  jumpForce: -18,
  friction: 0.85,
  maxVelocity: { x: 8, y: 25 },
  acceleration: 0.5,
  deceleration: 0.92
};

export function usePhysics(
  config: Partial<PhysicsConfig> = {}
): [PhysicsState, PhysicsActions] {
  const finalConfig = useMemo(
    () => ({
      ...DEFAULT_CONFIG,
      ...config,
    }),
    [config]
  );
  
  const [state, setState] = useState<PhysicsState>({
    position: { x: 0, y: 0 },
    velocity: { x: 0, y: 0 },
    acceleration: { x: 0, y: 0 },
    isGrounded: true,
    isJumping: false
  });

  const inputForces = useRef<Vector2D>({ x: 0, y: 0 });

  const applyForce = useCallback((force: Vector2D) => {
    inputForces.current.x += force.x;
    inputForces.current.y += force.y;
  }, []);

  const jump = useCallback(() => {
    if (state.isGrounded && !state.isJumping) {
      setState(prev => ({
        ...prev,
        velocity: { ...prev.velocity, y: finalConfig.jumpForce },
        isJumping: true,
        isGrounded: false
      }));
    }
  }, [state.isGrounded, state.isJumping, finalConfig.jumpForce]);

  const setGrounded = useCallback((grounded: boolean) => {
    setState(prev => ({
      ...prev,
      isGrounded: grounded,
      isJumping: grounded ? false : prev.isJumping,
      velocity: grounded ? { ...prev.velocity, y: 0 } : prev.velocity
    }));
  }, []);

  const reset = useCallback(() => {
    setState({
      position: { x: 0, y: 0 },
      velocity: { x: 0, y: 0 },
      acceleration: { x: 0, y: 0 },
      isGrounded: true,
      isJumping: false
    });
    inputForces.current = { x: 0, y: 0 };
  }, []);

  const update = useCallback((deltaTime: number) => {
    setState(prev => {
      const newState = { ...prev };

      if (inputForces.current.x !== 0) {
        newState.acceleration.x = inputForces.current.x * finalConfig.acceleration;
      } else {
        newState.acceleration.x = 0;
      }

      if (!newState.isGrounded) {
        newState.acceleration.y = finalConfig.gravity;
      } else {
        newState.acceleration.y = 0;
      }

      newState.velocity.x += newState.acceleration.x * deltaTime;
      newState.velocity.y += newState.acceleration.y * deltaTime;

      if (inputForces.current.x === 0) {
        newState.velocity.x *= finalConfig.deceleration;
      }

      newState.velocity.x = Math.max(
        -finalConfig.maxVelocity.x,
        Math.min(finalConfig.maxVelocity.x, newState.velocity.x)
      );
      newState.velocity.y = Math.max(
        -finalConfig.maxVelocity.y,
        Math.min(finalConfig.maxVelocity.y, newState.velocity.y)
      );

      newState.position.x += newState.velocity.x * deltaTime;
      newState.position.y += newState.velocity.y * deltaTime;

      if (newState.position.y <= 0 && newState.velocity.y >= 0) {
        newState.position.y = 0;
        newState.velocity.y = 0;
        newState.isGrounded = true;
        newState.isJumping = false;
      }

      return newState;
    });

    inputForces.current = { x: 0, y: 0 };
  }, [finalConfig]);

  return [state, { applyForce, jump, setGrounded, reset, update }];
}

export function calculateDiagonalMovement(
  left: boolean,
  right: boolean,
  up: boolean,
  down: boolean
): Vector2D {
  const movement = { x: 0, y: 0 };

  if (left) movement.x -= 1;
  if (right) movement.x += 1;
  if (up) movement.y += 1;
  if (down) movement.y -= 1;

  const magnitude = Math.sqrt(movement.x * movement.x + movement.y * movement.y);
  if (magnitude > 0) {
    movement.x /= magnitude;
    movement.y /= magnitude;
  }

  return movement;
}