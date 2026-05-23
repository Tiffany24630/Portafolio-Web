import {useCallback, useEffect, useRef, useState,} from "react";
import { AnimatePresence, motion } from "framer-motion";
import Player from "./components/Player";
import Piano from "./components/Piano";
import { useKeyboard } from "./hooks/useKeyboard";
import {calculateDiagonalMovement, usePhysics,} from "./hooks/usePhysics";
import { useGameEngine } from "./hooks/useGameEngine";
import { playNote } from "./audio/piano";
import { pianoKeys } from "./data/pianoKeys";

const PLAYER_WIDTH = 74;

const DISCOVERY_MELODIES = [
  {
    id: "about",
    label: "ABOUT ME",
    sequence: ["C4", "E4", "G4"],
    color: "#8be9fd",
    description:
      "A lonely room wakes up in the darkness.",
  },

  {
    id: "skills",
    label: "SKILLS",
    sequence: ["D4", "F4", "A4"],
    color: "#bd93f9",
    description:
      "Holographic structures emerge from the piano.",
  },

  {
    id: "projects",
    label: "PROJECTS",
    sequence: ["C4", "D4", "G4", "A4"],
    color: "#50fa7b",
    description:
      "Fragments of digital worlds begin to appear.",
  },

  {
    id: "contact",
    label: "CONTACT",
    sequence: ["F4", "G4", "E4"],
    color: "#ff79c6",
    description:
      "Signals travel through the void searching for connection.",
  },
];

function matchesMelody(
  history: string[],
  melody: string[]
) {
  if (history.length < melody.length) {
    return false;
  }

  const recent = history.slice(
    history.length - melody.length
  );

  return recent.every(
    (note, index) => note === melody[index]
  );
}

interface RainDropData {
  id: number;
  left: number;
  delay: number;
  duration: number;
}

interface ParticleData {
  id: number;
  x: number;
  y: number;
  drift: number;
}

export default function App() {
  const keys = useKeyboard();

  const [physicsState, physicsActions] =
    usePhysics({
      gravity: 0.8,
      jumpForce: -18,
      friction: 0.85,
      maxVelocity: { x: 7, y: 25 },
      acceleration: 0.5,
      deceleration: 0.9,
    });

  const pianoRef = useRef<HTMLDivElement>(null);
  const cameraRef = useRef<HTMLDivElement>(null);
  const [pianoWidth, setPianoWidth] = useState(1260);
  const [xPercent, setXPercent] = useState(0.05);
  const [direction, setDirection] = useState<"left" | "right">("right");
  const [lane, setLane] = useState<"white" | "black">("white");
  const [activeNote, setActiveNote] = useState<string | null>(null);
  const [wasInAir, setWasInAir] = useState(false);
  const [noteHistory, setNoteHistory] = useState<string[]>([]);
  const [discoveredSections, setDiscoveredSections] = useState<string[]>([]);
  const [ambientPulse, setAmbientPulse] = useState(0);
  const [particles, setParticles] = useState<ParticleData[]>([]);
  const [cameraShake, setCameraShake] = useState(false);
  
  const [rainDrops] = useState<RainDropData[]>(
    () =>
      Array.from({
        length: 80,
      }).map((_, index) => ({
        id: index,
        left: Math.random() * 100,
        delay: Math.random() * 2,
        duration:
          0.6 + Math.random() * 0.7,
      }))
  );

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

  const triggerParticles =
    useCallback((x: number) => {
      const newParticles: ParticleData[] =
        Array.from({
          length: 12,
        }).map((_, index) => ({
          id:
            Date.now() + index,
          x,
          y: Math.random() * 120,
          drift:
            Math.random() * 120 - 60,
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
      }, 1500);
    }, []);

  const triggerCameraShake =
    useCallback(() => {
      setCameraShake(true);

      setTimeout(() => {
        setCameraShake(false);
      }, 180);
    }, []);

  const getPressedKey = useCallback(() => {
    const playerX = xPercent * pianoWidth;

    return pianoKeys.find((key) => {
      const keyStart = (key.x / 1260) * pianoWidth;
      const keyEnd = ((key.x + key.width) / 1260) * pianoWidth;

      return (
        key.type === lane &&
        playerX + PLAYER_WIDTH / 2 >=
          keyStart &&
        playerX + PLAYER_WIDTH / 2 <=
          keyEnd
      );
    });
  }, [xPercent, pianoWidth, lane]);

  const handleNoteTriggered =
    useCallback(
      async (note: string) => {
        setActiveNote(note);
        setAmbientPulse((prev) => prev + 1);
        triggerCameraShake();

        triggerParticles(
          xPercent * pianoWidth
        );

        await playNote(note);

        setNoteHistory((prev) => {
          const updated = [
            ...prev,
            note,
          ].slice(-20);

          DISCOVERY_MELODIES.forEach(
            (melody) => {
              const alreadyDiscovered =
                discoveredSections.includes(
                  melody.id
                );

              if (
                !alreadyDiscovered &&
                matchesMelody(
                  updated,
                  melody.sequence
                )
              ) {
                setDiscoveredSections(
                  (current) => [
                    ...current,
                    melody.id,
                  ]
                );
              }
            }
          );

          return updated;
        });

        setTimeout(() => {
          setActiveNote(null);
        }, 120);
      },
      [
        discoveredSections,
        pianoWidth,
        triggerParticles,
        xPercent,
        triggerCameraShake,
      ]
    );

  const handleGameUpdate =
    useCallback(
      (deltaTime: number) => {
        const movement =
          calculateDiagonalMovement(
            keys["ArrowLeft"],
            keys["ArrowRight"],
            false,
            false
          );

        if (movement.x !== 0) {
          physicsActions.applyForce({
            x: movement.x,
            y: 0,
          });

          setDirection(
            movement.x > 0
              ? "right"
              : "left"
          );
        }

        if (keys["ArrowUp"]) {
          setLane("black");
        }

        if (keys["ArrowDown"]) {
          setLane("white");
        }

        if (keys["Space"]) {
          physicsActions.jump();

          if (
            physicsState.isGrounded
          ) {
            setWasInAir(true);
          }
        }

        physicsActions.update(
          deltaTime / 16.67
        );

        const newXPercent =
          Math.max(
            0,
            Math.min(
              0.94,
              0.05 +
                (physicsState.position.x /
                  pianoWidth) *
                  0.89
            )
          );
        setXPercent(newXPercent);

        if (
          physicsState.isGrounded &&
          wasInAir
        ) {
          const pressedKey = getPressedKey();

          if (pressedKey) {
            handleNoteTriggered(
              pressedKey.note
            );
          }
          setWasInAir(false);
        }

        if (
          physicsState.position.y <= 0
        ) {
          physicsActions.setGrounded(
            true
          );
        } else {
          physicsActions.setGrounded(
            false
          );
        }
      },
      [
        keys,
        physicsState,
        physicsActions,
        pianoWidth,
        wasInAir,
        getPressedKey,
        handleNoteTriggered,
      ]
    );

  const [gameState, , metrics] = useGameEngine(handleGameUpdate);

  return (
    <motion.div
      className="scene"
      animate={{
        x: cameraShake
          ? [-6, 6, -3, 3, 0]
          : 0,
      }}
      transition={{
        duration: 0.18,
      }}
      ref={cameraRef}
    >

      <div className="dream-fog" />
      <div className="background-grid" />
      <div className="background-glow" />
      <div className="vignette" />

      <div className="rain-layer">
        {rainDrops.map((drop) => (
          <span
            key={drop.id}
            className="rain-drop"
            style={{
              left: `${drop.left}%`,
              animationDelay: `${drop.delay}s`,
              animationDuration: `${drop.duration}s`,
            }}
          />
        ))}
      </div>

      <div className="particles-layer">
        <AnimatePresence>
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              className="music-particle"
              initial={{
                opacity: 0,
                scale: 0,
                x: particle.x,
                y:
                  window.innerHeight -
                  260,
              }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0, 1, 0.2],
                y:
                  window.innerHeight -
                  560 -
                  particle.y,
                x:
                  particle.x +
                  particle.drift,
              }}
              exit={{
                opacity: 0,
              }}
              transition={{
                duration: 1.2,
                ease: "easeOut",
              }}
            />
          ))}
        </AnimatePresence>
      </div>

      <div className="music-sheet">
        <div className="sheet-lines">
          {Array.from({
            length: 5,
          }).map((_, i) => (
            <span
              key={i}
            />
          ))}
        </div>

        <div className="notes-container">
          {noteHistory.map(
            (note, index) => (
              <motion.div
                key={`${note}-${index}`}
                className="sheet-note"
                initial={{
                  opacity: 0,
                  y: -20,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
              >
                ♪ {note}
              </motion.div>
            )
          )}
        </div>
      </div>

      <div className="top-ui">
        <motion.h1
          animate={{
            opacity: [0.8, 1, 0.8],
          }}
          transition={{
            repeat: Infinity,
            duration: 4,
          }}
        >
          PLAY TO DISCOVER
        </motion.h1>

        <motion.p
          animate={{
            opacity: [
              0.4,
              0.75,
              0.4,
            ],
          }}
          transition={{
            repeat: Infinity,
            duration: 3,
          }}
        >
          Every note reveals a
          story.
        </motion.p>

        <div className="controls">
          ← → MOVE &nbsp; •
          &nbsp; SPACE JUMP
          &nbsp; • &nbsp; ↑ ↓
          SWITCH LAYERS
        </div>
      </div>

      <div className="discoveries">
        {DISCOVERY_MELODIES.map(
          (melody) => {
            const unlocked =
              discoveredSections.includes(
                melody.id
              );

            return (
              <motion.div
                key={melody.id}
                className={`discovery-card ${
                  unlocked
                    ? "unlocked"
                    : ""
                }`}
                animate={{
                  borderColor:
                    unlocked
                      ? melody.color
                      : "rgba(255,255,255,0.08)",
                }}
              >
                <span className="melody-sequence">
                  {melody.sequence.join(
                    " - "
                  )}
                </span>

                <h3>
                  {unlocked
                    ? melody.label
                    : "LOCKED"}
                </h3>

                <p>
                  {unlocked
                    ? melody.description
                    : "Play the correct melody to reveal this memory."}
                </p>
              </motion.div>
            );
          }
        )}
      </div>

      <div className="performance-panel">
        <span>
          FPS{" "}
          {Math.round(
            gameState.frameRate
          )}
        </span>

        <span>
          AVG{" "}
          {Math.round(
            metrics.averageFrameRate
          )}
        </span>

        <span>
          NOTES{" "}
          {noteHistory.length}
        </span>
      </div>

      <motion.div
        className="game-area"
        ref={pianoRef}
        animate={{
          scale:
            activeNote
              ? 1.002
              : 1,
          filter: `brightness(${
            activeNote
              ? 1.08
              : 1
          })`,
        }}
      >
        <motion.div
          className="pulse-light"
          animate={{
            opacity:
              activeNote
                ? [0.1, 0.5, 0.1]
                : 0.08,
            scale:
              activeNote
                ? [1, 1.2, 1]
                : 1,
          }}
          transition={{
            duration: 0.7,
          }}
          key={ambientPulse}
        />

        <Player
          x={xPercent * pianoWidth}
          y={
            lane === "black"
              ? 350 +
                physicsState.position.y
              : 230 +
                physicsState.position.y
          }
          direction={direction}
        />

        <Piano
          activeNote={activeNote}
        />
      </motion.div>

      <AnimatePresence>
        {discoveredSections.length ===
          DISCOVERY_MELODIES.length && (
          <motion.div
            className="final-cinematic"
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
            <motion.h2
              initial={{
                y: 40,
                opacity: 0,
              }}
              animate={{
                y: 0,
                opacity: 1,
              }}
            >
              THE SONG IS COMPLETE
            </motion.h2>

            <motion.p
              initial={{
                opacity: 0,
              }}
              animate={{
                opacity: 1,
              }}
              transition={{
                delay: 0.5,
              }}
            >
              You reconstructed
              every memory hidden
              inside the piano.
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}