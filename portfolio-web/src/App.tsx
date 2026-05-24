import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

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

const NOTE_TO_STAFF: Record<
  string,
  number
> = {
  C4: 128,
  Db4: 123,
  D4: 118,
  Eb4: 113,
  E4: 108,
  F4: 103,
  Gb4: 98,
  G4: 93,
  Ab4: 88,
  A4: 83,
  Bb4: 78,
  B4: 73,

  C5: 68,
  Db5: 63,
  D5: 58,
  Eb5: 53,
  E5: 48,
  F5: 43,
  Gb5: 38,
  G5: 33,
  Ab5: 28,
  A5: 23,
  Bb5: 18,
  B5: 13,
};

const PORTFOLIO_CONTENT = {
  "Sobre mí":
    "Desarrollador enfocado en crear experiencias interactivas mezclando videojuegos, música y diseño frontend.",

  Skills:
    "React, TypeScript, Haskell, Docker, animaciones, diseño UX/UI, audio interactivo y desarrollo de interfaces modernas.",

  Proyectos:
    "Sistemas interactivos, videojuegos musicales, aplicaciones frontend avanzadas y proyectos creativos con animaciones.",
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
    sequence: [
      "C4",
      "D4",
      "G4",
      "A4",
    ],
  },
];

export default function App() {
  const keys = useKeyboard();

  const pianoRef =
    useRef<HTMLDivElement>(null);

  const [pianoWidth, setPianoWidth] =
    useState(1260);

  const [x, setX] = useState(120);

  const [velocityY, setVelocityY] =
    useState(0);

  const [isJumping, setIsJumping] =
    useState(false);

  const [direction, setDirection] =
    useState<"left" | "right">(
      "right"
    );

  const [lane, setLane] = useState<
    "white" | "black"
  >("white");

  const [activeNote, setActiveNote] =
    useState<string | null>(null);

  const [playedNotes, setPlayedNotes] =
    useState<PlayedNote[]>([]);

  const [particles, setParticles] =
    useState<Particle[]>([]);

  const [
    discoveredSections,
    setDiscoveredSections,
  ] = useState<string[]>([]);

  const [
    openedSection,
    setOpenedSection,
  ] = useState<string | null>(null);

  const [
    showSettings,
    setShowSettings,
  ] = useState(false);

  const [rainEnabled, setRainEnabled] =
    useState(true);

  const [
    audioEnabled,
    setAudioEnabled,
  ] = useState(true);

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
    return Array.from({
      length: 60,
    }).map((_, i) => ({
      id: i,
      left: `${(i * 13) % 100}%`,
      delay: `${(i % 7) * 0.2}s`,
      duration: `${
        0.8 +
        ((i * 17) % 10) * 0.08
      }s`,
    }));
  }, []);

  const getPressedKey =
    useCallback(() => {
      const playerCenter =
        x + PLAYER_WIDTH / 2;

      return pianoKeys.find((key) => {
        const keyStart =
          (key.x / 1260) * pianoWidth;

        const keyEnd =
          ((key.x + key.width) /
            1260) *
          pianoWidth;

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

      if (!audioEnabled) return;

      await playNote(note);

      setPlayedNotes((prev) => [
        ...prev,
        {
          id: noteIdRef.current++,
          note,
        },
      ]);

      const particleBaseX =
        x + PLAYER_WIDTH / 2;

      const newParticles =
        Array.from({
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

          driftX: (i - 4) * 18,
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
                (np) =>
                  np.id === p.id
              )
          )
        );
      }, 900);

      setTimeout(() => {
        setActiveNote(null);
      }, 55);
    },
    [lane, x, audioEnabled]
  );

  const checkMelody =
    useCallback(() => {
      const sequence =
        playedNotes.map(
          (n) => n.note
        );

      for (const pattern of DISCOVERY_PATTERNS) {
        const target =
          pattern.sequence.join("-");

        const current =
          sequence.join("-");

        if (
          current.includes(target)
        ) {
          setDiscoveredSections(
            (prev) => {
              if (
                prev.includes(
                  pattern.name
                )
              ) {
                return prev;
              }

              return [
                ...prev,
                pattern.name,
              ];
            }
          );
        }
      }
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

        if (keys["ArrowUp"]) {
          setLane("black");
        }

        if (keys["ArrowDown"]) {
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
          return prev - GRAVITY;
        });

        if (
          velocityY <=
          -JUMP_FORCE
        ) {
          setIsJumping(false);

          const pressedKey =
            getPressedKey();

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
      if (e.code === "Enter") {
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
      : 230) +
    velocityY * 4;

  return (
    <div className="scene">
      <div className="background-glow" />

      <div className="dream-overlay" />

      {rainEnabled && (
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
      )}

      <aside className="sidebar">
        <div className="sidebar-logo">
          ♪
        </div>

        <div className="sidebar-menu">
          {DISCOVERY_PATTERNS.map(
            (item) => {
              const unlocked =
                discoveredSections.includes(
                  item.name
                );

              return (
                <button
                  key={item.name}
                  disabled={!unlocked}
                  className={`sidebar-button ${
                    unlocked
                      ? "unlocked"
                      : "locked"
                  }`}
                  onClick={() =>
                    setOpenedSection(
                      item.name
                    )
                  }
                >
                  {item.name}
                </button>
              );
            }
          )}

          <button
            className="sidebar-button settings"
            onClick={() =>
              setShowSettings(true)
            }
          >
            Configuración
          </button>
        </div>
      </aside>

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
        >
          ← → Move
          &nbsp;&nbsp;
          SPACE Jump
          &nbsp;&nbsp;
          ENTER Check Melody
        </motion.p>

        <div className="sheet-wrapper">
          <div className="sheet-music">
            {[0, 1, 2, 3, 4].map(
              (line) => (
                <div
                  key={line}
                  className="staff-line"
                  style={{
                    top: `${
                      45 +
                      line * 24
                    }px`,
                  }}
                />
              )
            )}

            <div className="treble-clef">
              𝄞
            </div>

            {playedNotes.map(
              (note, index) => (
                <motion.div
                  key={note.id}
                  className="music-note"
                  initial={{
                    opacity: 0,
                    scale: 0,
                  }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                  }}
                  style={{
                    left: `${
                      150 +
                      index * 60
                    }px`,
                    top: `${
                      NOTE_TO_STAFF[
                        note.note
                      ]
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
                transition={{
                  duration: 0.8,
                }}
              />
            )
          )}
        </AnimatePresence>

        <Piano
          activeNote={activeNote}
        />
      </div>

      <AnimatePresence>
        {openedSection && (
          <motion.div
            className="modal-overlay"
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            exit={{
              opacity: 0,
            }}
          >
            <motion.div
              className="modal-card"
              initial={{
                scale: 0.8,
                opacity: 0,
              }}
              animate={{
                scale: 1,
                opacity: 1,
              }}
              exit={{
                scale: 0.8,
                opacity: 0,
              }}
            >
              <button
                className="close-button"
                onClick={() =>
                  setOpenedSection(
                    null
                  )
                }
              >
                ✕
              </button>

              <h2>
                {openedSection}
              </h2>

              <p>
                {
                  PORTFOLIO_CONTENT[
                    openedSection as keyof typeof PORTFOLIO_CONTENT
                  ]
                }
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSettings && (
          <motion.div
            className="modal-overlay"
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            exit={{
              opacity: 0,
            }}
          >
            <motion.div
              className="modal-card"
              initial={{
                scale: 0.8,
                opacity: 0,
              }}
              animate={{
                scale: 1,
                opacity: 1,
              }}
              exit={{
                scale: 0.8,
                opacity: 0,
              }}
            >
              <button
                className="close-button"
                onClick={() =>
                  setShowSettings(false)
                }
              >
                ✕
              </button>

              <h2>
                Configuración
              </h2>

              <p>
                ← → Movimiento
              </p>

              <p>
                SPACE Saltar
              </p>

              <p>
                ENTER Revisar
                melodía
              </p>

              <button
                className="toggle-button"
                onClick={() =>
                  setRainEnabled(
                    !rainEnabled
                  )
                }
              >
                Lluvia:
                {" "}
                {rainEnabled
                  ? "ON"
                  : "OFF"}
              </button>

              <button
                className="toggle-button"
                onClick={() =>
                  setAudioEnabled(
                    (prev) =>
                      !prev
                  )
                }
              >
                Audio:
                {" "}
                {audioEnabled
                  ? "ON"
                  : "OFF"}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}