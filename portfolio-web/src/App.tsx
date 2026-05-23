import {
  useEffect,
  useRef,
  useState,
} from "react";

import Player from "./components/Player";
import Piano from "./components/Piano";

import { useKeyboard } from "./hooks/useKeyboard";

import { playNote } from "./audio/piano";

import { pianoKeys } from "./data/pianoKeys";

const PLAYER_WIDTH = 74;

export default function App() {

  const keys = useKeyboard();

  // referencia al piano real
  const pianoRef =
    useRef<HTMLDivElement>(null);

  // ancho renderizado REAL
  const [pianoWidth, setPianoWidth] =
    useState(1260);

  // posición relativa
  const [xPercent, setXPercent] =
    useState(0.05);

  // salto
  const [jumpY, setJumpY] =
    useState(0);

  const [velocityY, setVelocityY] =
    useState(0);

  // dirección
  const [direction, setDirection] =
    useState<"left" | "right">("right");

  // lane
  const [lane, setLane] =
    useState<"white" | "black">(
      "white"
    );

  // nota activa
  const [activeNote, setActiveNote] =
    useState<string | null>(null);

  // detectar si estaba en el aire
  const [wasInAir, setWasInAir] =
    useState(false);

  // detectar ancho real
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

  // obtener tecla actual
  function getPressedKey() {

    const playerX =
      xPercent * pianoWidth;

    return pianoKeys.find((key) => {

      const keyStart =
        (key.x / 1260) * pianoWidth;

      const keyEnd =
        ((key.x + key.width) / 1260) *
        pianoWidth;

      return (
        key.type === lane &&
        playerX + PLAYER_WIDTH / 2 >=
          keyStart &&
        playerX + PLAYER_WIDTH / 2 <=
          keyEnd
      );
    });
  }

  // GAME LOOP
  useEffect(() => {

    const interval = setInterval(() => {

      // movimiento horizontal
      setXPercent((prev) => {

        let next = prev;

        if (keys["ArrowRight"]) {

          next += 0.006;

          setDirection("right");
        }

        if (keys["ArrowLeft"]) {

          next -= 0.006;

          setDirection("left");
        }

        // límites responsive
        if (next < 0) next = 0;

        if (next > 0.94) next = 0.94;

        return next;
      });

      // cambiar lane
      if (keys["ArrowUp"]) {
        setLane("black");
      }

      if (keys["ArrowDown"]) {
        setLane("white");
      }

      // gravedad
      setVelocityY((prev) => prev + 1);

      // salto
      setJumpY((prev) => {

        const next =
          prev - velocityY;

        // aterrizaje
        if (next <= 0) {

          // SOLO si cayó desde salto
          if (wasInAir) {

            const pressedKey =
              getPressedKey();

            if (pressedKey) {

              setActiveNote(
                pressedKey.note
              );

              playNote(
                pressedKey.note
              );

              setTimeout(() => {
                setActiveNote(null);
              }, 70);
            }
          }

          setVelocityY(0);

          setWasInAir(false);

          return 0;
        }

        return next;
      });

      // iniciar salto
      if (
        keys["Space"] &&
        jumpY === 0 &&
        !wasInAir
      ) {

        setVelocityY(-22);

        setWasInAir(true);
      }

    }, 16);

    return () =>
      clearInterval(interval);

  }, [
    keys,
    velocityY,
    jumpY,
    wasInAir,
    lane,
    pianoWidth,
  ]);

  // posición real player
  const playerX =
    xPercent * pianoWidth;

  // alturas base
  const WHITE_Y = 235;

  const BLACK_Y = 360;

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

      </div>

      {/* CONTENEDOR */}

      <div
        className="game-area"
        ref={pianoRef}
      >

        {/* PLAYER */}

        <Player
          x={playerX}
          y={
            lane === "black"
              ? BLACK_Y + jumpY
              : WHITE_Y + jumpY
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