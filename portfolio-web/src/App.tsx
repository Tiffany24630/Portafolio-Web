import {useCallback, useEffect, useMemo, useRef, useState,} from "react";
import { AnimatePresence, motion } from "framer-motion";
import Player from "./components/Player";
import Piano from "./components/Piano";
import { useKeyboard } from "./hooks/useKeyboard";
import { playNote } from "./audio/piano";
import { pianoKeys } from "./data/pianoKeys";

const PLAYER_WIDTH = 74;
const MOVEMENT_SPEED = 8;
const JUMP_FORCE = 18;
const GRAVITY = 0.9;

interface PlayedNote {
  id: number;
  note: string;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  driftX: number;
}

const NOTE_TO_STAFF: Record<string, number> = {
  C4: 74,
  Db4: 71,
  D4: 68,
  Eb4: 65,
  E4: 62,
  F4: 59,
  Gb4: 56,
  G4: 53,
  Ab4: 50,
  A4: 47,
  Bb4: 44,
  B4: 41,

  C5: 38,
  Db5: 35,
  D5: 32,
  Eb5: 29,
  E5: 26,
  F5: 23,
  Gb5: 20,
  G5: 17,
  Ab5: 14,
  A5: 11,
  Bb5: 8,
  B5: 5,
};

const DISCOVERY_PATTERNS = [
  {
    name: "Sobre mí",
    sequence: ["C4", "E4", "G4"],
  },
  {
    name: "Skills",
    sequence: ["D4", "F4", "A4"],
  },
  {
    name: "Proyectos",
    sequence: ["C4", "D4", "G4", "A4"],
  },
];

export default function App() {
  const keys = useKeyboard();
  const pianoRef = useRef<HTMLDivElement>(null);
  const [pianoWidth, setPianoWidth] = useState(1260);
  const [x, setX] = useState(120);
  const [velocityY, setVelocityY] = useState(0);
  const [isJumping, setIsJumping] = useState(false);
  const [direction, setDirection] = useState<"left" | "right">("right");
  const [lane, setLane] = useState<"white" | "black">("white");
  const [activeNote, setActiveNote] = useState<string | null>(null);
  const [playedNotes, setPlayedNotes] = useState<PlayedNote[]>([]);
  const [particles, setParticles] = useState<Particle[]>(([]));
  const [discoveredSection, setDiscoveredSection] = useState<string | null>(null);
  const noteIdRef = useRef(0);

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

  const rainDrops = useMemo(() => {
    return Array.from({ length: 60 }).map(
      (_, i) => ({
        id: i,
        left: `${(i * 13) % 100}%`,
        delay: `${(i % 7) * 0.2}s`,
        duration: `${
          0.8 + ((i * 17) % 10) * 0.08
        }s`,
      })
    );
  }, []);

  const getPressedKey = useCallback(() => {
    const playerCenter = x + PLAYER_WIDTH / 2;

    return pianoKeys.find((key) => {
      const keyStart = (key.x / 1260) * pianoWidth;
      const keyEnd = ((key.x + key.width) / 1260) * pianoWidth;

      return (
        key.type === lane &&
        playerCenter >= keyStart &&
        playerCenter <= keyEnd
      );
    });
  }, [x, pianoWidth, lane]);

  const triggerNote = useCallback(
    async (note: string) => {
      setActiveNote(note);
      await playNote(note);

      setPlayedNotes((prev) => [
        ...prev,
        {
          id: noteIdRef.current++,
          note,
        },
      ]);

      const particleBaseX = x + PLAYER_WIDTH / 2;

      const newParticles = Array.from({
        length: 8,
      }).map((_, i) => ({
        id:
          Date.now() +
          i +
          Math.random(),
        x: particleBaseX,
        y:
          lane === "black"
            ? 320
            : 420,
        driftX:
          (i - 4) * 18,
      }));

      setParticles((prev) => [
        ...prev,
        ...newParticles,
      ]);

      setTimeout(() => {
        setParticles((prev) =>
          prev.filter(
            (p) =>
              !newParticles.some(
                (np) => np.id === p.id
              )
          )
        );
      }, 900);
      setTimeout(() => {
        setActiveNote(null);
      }, 55);
    },
    [lane, x]
  );

  const checkMelody = useCallback(() => {
    const sequence = playedNotes.map(
      (n) => n.note
    );

    for (const pattern of DISCOVERY_PATTERNS) {
      const target = pattern.sequence.join("-");
      const current = sequence.join("-");

      if (
        current.includes(target)
      ) {
        setDiscoveredSection(
          pattern.name
        );
      }
    }

    sequence.forEach(
      (note, index) => {
        setTimeout(() => {
          playNote(note);
        }, index * 120);
      }
    );
  }, [playedNotes]);

  const deleteLastNote =
    useCallback(() => {
      setPlayedNotes((prev) =>
        prev.slice(0, -1)
      );
    }, []);

  useEffect(() => {
    const movementInterval =
      setInterval(() => {
        setX((prev) => {
          let next = prev;

          if (keys["ArrowLeft"]) {
            next -= MOVEMENT_SPEED;
            setDirection("left");
          }

          if (keys["ArrowRight"]) {
            next += MOVEMENT_SPEED;
            setDirection("right");
          }

          return Math.max(
            0,
            Math.min(
              pianoWidth -
                PLAYER_WIDTH,
              next
            )
          );
        });

        if (
          keys["ArrowUp"]
        ) {
          setLane("black");
        }

        if (
          keys["ArrowDown"]
        ) {
          setLane("white");
        }

        if (
          keys["Space"] &&
          !isJumping
        ) {
          setIsJumping(true);
          setVelocityY(JUMP_FORCE);
        }
      }, 16);

    return () =>
      clearInterval(
        movementInterval
      );
  }, [
    keys,
    isJumping,
    pianoWidth,
  ]);

  useEffect(() => {
    const physicsLoop =
      setInterval(() => {
        if (!isJumping) return;

        setVelocityY((prev) => {
          const next =
            prev - GRAVITY;

          return next;
        });

        setX((prev) => prev);

        if (
          velocityY <=
          -JUMP_FORCE
        ) {
          setIsJumping(false);
          const pressedKey = getPressedKey();

          if (pressedKey) {
            triggerNote(
              pressedKey.note
            );
          }
          setVelocityY(0);
        }
      }, 16);

    return () =>
      clearInterval(
        physicsLoop
      );
  }, [
    velocityY,
    isJumping,
    getPressedKey,
    triggerNote,
  ]);

  useEffect(() => {
    const keyDown = (
      e: KeyboardEvent
    ) => {
      if (
        e.code === "Enter"
      ) {
        checkMelody();
      }

      if (
        e.code === "Backspace" ||
        e.code === "Delete"
      ) {
        deleteLastNote();
      }
    };

    window.addEventListener(
      "keydown",
      keyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        keyDown
      );
    };
  }, [
    checkMelody,
    deleteLastNote,
  ]);

  const playerY =
    (lane === "black"
      ? 355
      : 230) + velocityY * 4;

  return (
    <div className="scene">
      <div className="background-glow" />
      <div className="dream-overlay" />

      <div className="rain-layer">
        {rainDrops.map(
          (drop) => (
            <div
              key={drop.id}
              className="rain-drop"
              style={{
                left: drop.left,
                animationDelay:
                  drop.delay,
                animationDuration:
                  drop.duration,
              }}
            />
          )
        )}
      </div>

      <div className="top-ui">
        <motion.h1
          initial={{
            opacity: 0,
            y: -30,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 1.2,
          }}
        >
          PLAY TO DISCOVER
        </motion.h1>

        <motion.p
          initial={{
            opacity: 0,
          }}
          animate={{
            opacity: 0.7,
          }}
          transition={{
            delay: 0.5,
          }}
        >
          ← → Move
          &nbsp;&nbsp;
          SPACE Jump
          &nbsp;&nbsp;
          ENTER Play Melody
          &nbsp;&nbsp;
          DELETE Undo
        </motion.p>

        <div className="sheet-wrapper">
          <div className="sheet-scroll">
            <div className="sheet-music">
              <div className="treble-clef">
                𝄞
              </div>

              {[0, 1, 2, 3, 4].map(
                (line) => (
                  <div
                    key={line}
                    className="staff-line"
                    style={{
                      top: `${
                        40 +
                        line * 24
                      }px`,
                    }}
                  />
                )
              )}

              {playedNotes.map(
                (
                  note,
                  index
                ) => (
                  <motion.div
                    key={note.id}
                    className="music-note"
                    initial={{
                      opacity: 0,
                      y: -20,
                    }}
                    animate={{
                      opacity: 1,
                      y: NOTE_TO_STAFF[
                        note.note
                      ],
                    }}
                    style={{
                      left: `${
                        120 +
                        index * 52
                      }px`,
                    }}
                  >
                    <div className="note-head" />
                    <div className="note-stick" />
                  </motion.div>
                )
              )}
            </div>
          </div>
        </div>
      </div>

      <div
        className="game-area"
        ref={pianoRef}
      >
        <Player
          x={x}
          y={playerY}
          direction={direction}
          isJumping={isJumping}
        />

        <AnimatePresence>
          {particles.map(
            (particle) => (
              <motion.div
                key={particle.id}
                className="music-particle"
                initial={{
                  opacity: 1,
                  scale: 1,
                  x: particle.x,
                  y: particle.y,
                }}
                animate={{
                  opacity: 0,
                  scale: 0,
                  y:
                    particle.y -
                    120,
                  x:
                    particle.x +
                    particle.driftX,
                }}
                exit={{
                  opacity: 0,
                }}
                transition={{
                  duration: 0.8,
                  ease: "easeOut",
                }}
              />
            )
          )}
        </AnimatePresence>

        <Piano
          activeNote={activeNote}
        />

        <AnimatePresence>
          {discoveredSection && (
            <motion.div
              className="discovery-panel"
              initial={{
                opacity: 0,
                y: 40,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
              }}
            >
              <h2>
                {discoveredSection}
              </h2>

              <p>
                Melody
                discovered
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}