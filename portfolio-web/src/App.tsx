import {useCallback, useEffect, useRef, useState,} from "react";
import Player from "./components/Player";
import Piano from "./components/Piano";
import { useKeyboard } from "./hooks/useKeyboard";
import { usePhysics, calculateDiagonalMovement } from "./hooks/usePhysics";
import { useGameEngine } from "./hooks/useGameEngine";
import { playNote } from "./audio/piano";
import { pianoKeys } from "./data/pianoKeys";

const PLAYER_WIDTH = 74;

export default function App() {
  const keys = useKeyboard();

  const [physicsState, physicsActions] = usePhysics({
    gravity: 0.8,
    jumpForce: -18,
    friction: 0.85,
    maxVelocity: { x: 6, y: 25 },
    acceleration: 0.4,
    deceleration: 0.88
  });

  const pianoRef = useRef<HTMLDivElement>(null);

  const [pianoWidth, setPianoWidth] = useState(1260);

  const [xPercent, setXPercent] = useState(0.05);

  const [direction, setDirection] = useState<"left" | "right">("right");

  const [lane, setLane] = useState<"white" | "black">("white");

  const [activeNote, setActiveNote] = useState<string | null>(null);

  const [wasInAir, setWasInAir] = useState(false);

  useEffect(() => {
    const updateSize = () => {
      if (pianoRef.current) {
        setPianoWidth(
          pianoRef.current.offsetWidth
        );
      }
    };

    updateSize();

    window.addEventListener(
      "resize",
      updateSize
    );

    return () => {
      window.removeEventListener(
        "resize",
        updateSize
      );
    };
  }, []);

  const getPressedKey = useCallback(() => {
    const playerX = xPercent * pianoWidth;

    return pianoKeys.find((key) => {
      const keyStart = (key.x / 1260) * pianoWidth;
      const keyEnd = ((key.x + key.width) / 1260) * pianoWidth;

      return (
        key.type === lane &&
        playerX + PLAYER_WIDTH / 2 >= keyStart &&
        playerX + PLAYER_WIDTH / 2 <= keyEnd
      );
    });
  }, [xPercent, pianoWidth, lane]);

  // Handle physics-based movement and input
  const handleGameUpdate = useCallback((deltaTime: number) => {
    // Calculate movement input with diagonal support
    const movement = calculateDiagonalMovement(
      keys["ArrowLeft"],
      keys["ArrowRight"],
      false, // up not used for horizontal movement
      false  // down not used for horizontal movement
    );

    // Apply horizontal movement force
    if (movement.x !== 0) {
      physicsActions.applyForce({ x: movement.x, y: 0 });
      setDirection(movement.x > 0 ? "right" : "left");
    }

    // Handle lane switching
    if (keys["ArrowUp"]) {
      setLane("black");
    }
    if (keys["ArrowDown"]) {
      setLane("white");
    }

    // Handle jumping
    if (keys["Space"]) {
      physicsActions.jump();
      if (physicsState.isGrounded) {
        setWasInAir(true);
      }
    }

    // Update physics
    physicsActions.update(deltaTime / 16.67); // Normalize to 60fps

    // Convert physics position to percentage for responsive design
    const newXPercent = Math.max(0, Math.min(0.94, 
      0.05 + (physicsState.position.x / pianoWidth) * 0.89
    ));
    setXPercent(newXPercent);

    // Handle landing detection
    if (physicsState.isGrounded && wasInAir) {
      const pressedKey = getPressedKey();
      if (pressedKey) {
        setActiveNote(pressedKey.note);
        playNote(pressedKey.note);
        setTimeout(() => {
          setActiveNote(null);
        }, 70);
      }
      setWasInAir(false);
    }

    // Update grounded state based on jump position
    if (physicsState.position.y <= 0) {
      physicsActions.setGrounded(true);
    } else {
      physicsActions.setGrounded(false);
    }
  }, [keys, physicsState, physicsActions, pianoWidth, lane, wasInAir, getPressedKey]);

  // Game engine with 60fps loop
  const [gameState, , metrics] = useGameEngine(handleGameUpdate);

  return (
    <div className="scene">

      <div className="background-glow" />

      {/* UI */}

      <div className="top-ui">

        <h1>
          PLAY TO DISCOVER
        </h1>

        <p>
          ↑ Black Keys
          &nbsp;&nbsp;
          ↓ White Keys
          &nbsp;&nbsp;
          SPACE Jump
        </p>

        {/* Performance monitoring */}
        <div className="performance-info" style={{ 
          position: 'absolute', 
          top: '10px', 
          right: '10px', 
          fontSize: '12px', 
          color: '#666',
          background: 'rgba(0,0,0,0.5)',
          padding: '5px',
          borderRadius: '3px'
        }}>
          FPS: {Math.round(gameState.frameRate)} | Avg: {Math.round(metrics.averageFrameRate)}
        </div>

      </div>

      {/* CONTENEDOR */}

      <div
        className="game-area"
        ref={pianoRef}
      >

        {/* PLAYER */}

        <Player
          x={xPercent * pianoWidth}
          y={
            lane === "black"
              ? 360 + physicsState.position.y
              : 235 + physicsState.position.y
          }
          direction={direction}
        />  
        <Piano
          activeNote={activeNote}
        />
      </div>
    </div>
  );
}