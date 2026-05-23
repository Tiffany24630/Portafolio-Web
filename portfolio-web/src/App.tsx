import { useEffect, useState } from "react";
import Player from "./components/Player";
import Piano from "./components/Piano";
import { useKeyboard } from "./hooks/useKeyboard";
import { playNote } from "./audio/piano";
import { pianoKeys } from "./data/pianoKeys";

function getPressedKey(
  playerX: number,
  lane: "white" | "black"
) {
  return pianoKeys.find((key) => {
    return (
      key.type === lane &&
      playerX >= key.x &&
      playerX <= key.x + key.width
    );
  });
}

export default function App() {
  const keys = useKeyboard();
  const [x, setX] = useState(240);
  const [jumpY, setJumpY] = useState(0);
  const [velocityY, setVelocityY] = useState(0);
  const [direction, setDirection] = useState<"left" | "right">("right");
  const [activeNote, setActiveNote] = useState<string | null>(null);
  const [lane, setLane] = useState<"white" | "black">("white");
  const [isFalling, setIsFalling] = useState(false);
  const [hasLanded, setHasLanded] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setX((prev) => {
        let next = prev;

        if (keys["ArrowRight"]) {
          next += 7;
          setDirection("right");
        }

        if (keys["ArrowLeft"]) {
          next -= 7;
          setDirection("left");
        }

        if (next < 0) next = 0;

        if (next > 1180) next = 1180;

        return next;
      });

      if (keys["ArrowUp"]) {
        setLane("black");
      }

      if (keys["ArrowDown"]) {
        setLane("white");
      }

      setVelocityY((prev) => prev + 1);

      if (velocityY > 0) {
        setIsFalling(true);
      }

      setJumpY((prev) => {
        const next = prev + velocityY;

        if (next >= 0) {
          if (
            isFalling &&
            !hasLanded
          ) {
            const pressedKey =
              getPressedKey(
                x + 36,
                lane
              );

            if (pressedKey) {
              setActiveNote(
                pressedKey.note
              );

              playNote(
                pressedKey.note
              );

              setTimeout(() => {
                setActiveNote(null);
              }, 120);
            }
            setHasLanded(true);
          }
          setVelocityY(0);
          setIsFalling(false);
          
          return 0;
        }
        return next;
      });

      if (
        keys["Space"] &&
        jumpY === 0
      ) {
        setVelocityY(-22);
        setHasLanded(false);
      }
    }, 16);
    return () => clearInterval(interval);
  }, [
    keys,
    velocityY,
    jumpY,
    x,
    lane,
    isFalling,
    hasLanded,
  ]);

  return (
    <div className="scene">
      <div className="background-glow" />
      <div className="particles" />

      <div className="top-ui">
        <h1>
          PLAY TO DISCOVER
        </h1>

        <p>
          ↑ Black Keys
          &nbsp;&nbsp;↓ White Keys
          &nbsp;&nbsp;SPACE Jump
        </p>
      </div>
      <Player
        x={x}
        y={
          lane === "black"
            ? jumpY - 130
            : jumpY
        }
        direction={direction}
      />
      <Piano
        activeNote={activeNote}
      />
    </div>
  );
}