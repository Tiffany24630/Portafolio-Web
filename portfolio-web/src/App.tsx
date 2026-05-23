import { useEffect, useState } from "react";
import Player from "./components/Player";
import Piano from "./components/Piano";
import { useKeyboard } from "./hooks/useKeyboard";
import { playNote } from "./audio/piano";
import { pianoKeys } from "./data/pianoKeys";

function getPressedKey(playerX: number) {
  return pianoKeys.find((key) => {
    return (
      playerX >= key.x &&
      playerX <= key.x + key.width
    );
  });
}

export default function App() {
  const keys = useKeyboard();
  const [x, setX] = useState(200);
  const [y, setY] = useState(0);
  const [velocityY, setVelocityY] = useState(0);
  const [activeNote, setActiveNote] = useState<string | null>(null);
  const [direction, setDirection] = useState<"left" | "right">("right");

  useEffect(() => {
    const interval = setInterval(() => {
      setX((prev) => {
        let next = prev;

        if (keys["ArrowRight"]) {
          next += 8;
          setDirection("right");
        }

        if (keys["ArrowLeft"]) {
          next -= 8;
          setDirection("left");
        }

        if (next < 0) next = 0;

        if (next > 1180) next = 1180;

        return next;
      });
      setVelocityY((prev) => prev + 1);

      setY((prev) => {
        const next = prev + velocityY;

        if (next >= 0) {
          setVelocityY(0);
          
          const pressedKey = getPressedKey(x + 36);

          if (pressedKey) {
            setActiveNote(pressedKey.note);
            playNote(pressedKey.note);

            setTimeout(() => {
              setActiveNote(null);
            }, 120);
          }
          return 0;
        }
        return next;
      });

      if (keys["Space"] && y === 0) {
        setVelocityY(-20);
      }
    }, 16);
    return () => clearInterval(interval);
  }, [keys, velocityY, x, y]);

  return (
    <div className="scene">
      <div className="score">
        PLAY TO DISCOVER
      </div>

      <Player
        x={x}
        y={y}
        direction={direction}
      />
      <Piano activeNote={activeNote} />
    </div>
  );
}