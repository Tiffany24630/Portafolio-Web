import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import "./App.css";
import Player from "./components/Player";
import Piano from "./components/Piano";

import { playNote } from "./audio/piano";
import { pianoKeys } from "./data/pianoKeys";
import { useKeyboard } from "./hooks/useKeyboard";

const PLAYER_WIDTH = 64;
const MOVEMENT_SPEED = 8;
const JUMP_FORCE = 18;
const GRAVITY = 0.9;
const PIANO_SOURCE_WIDTH = 1260;
const PIANO_SOURCE_HEIGHT = 260;

type SectionName = "Sobre mi" | "Skills" | "Proyectos";

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

interface DiscoveryPattern {
  name: SectionName;
  sequence: string[];
  icon: "profile" | "star" | "folder";
}

const NOTE_TO_STAFF: Record<string, number> = {
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

const PORTFOLIO_CONTENT: Record<SectionName, string> = {
  "Sobre mi":
    "Desarrollador enfocado en crear experiencias interactivas mezclando videojuegos, musica y diseno frontend.",
  Skills:
    "React, TypeScript, Docker, animaciones, UX/UI, audio interactivo y construccion de interfaces modernas.",
  Proyectos:
    "Videojuegos musicales, sistemas interactivos, aplicaciones frontend y mundos pequenos con animaciones.",
};

const DISCOVERY_PATTERNS: DiscoveryPattern[] = [
  {
    name: "Sobre mi",
    sequence: ["C4", "E4", "G4"],
    icon: "profile",
  },
  {
    name: "Skills",
    sequence: ["D4", "F4", "A4"],
    icon: "star",
  },
  {
    name: "Proyectos",
    sequence: ["C4", "D4", "G4", "A4"],
    icon: "folder",
  },
];

export default function App() {
  const keys = useKeyboard();
  const stageRef = useRef<HTMLDivElement>(null);
  const hasCenteredPlayer = useRef(false);
  const noteIdRef = useRef(0);

  const [stageSize, setStageSize] = useState({
    width: PIANO_SOURCE_WIDTH,
    height: 380,
  });
  const [x, setX] = useState(0);
  const [velocityY, setVelocityY] = useState(0);
  const [isJumping, setIsJumping] = useState(false);
  const [direction, setDirection] = useState<"left" | "right">("right");
  const [lane, setLane] = useState<"white" | "black">("white");
  const [activeNote, setActiveNote] = useState<string | null>(null);
  const [playedNotes, setPlayedNotes] = useState<PlayedNote[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [discoveredSections, setDiscoveredSections] = useState<SectionName[]>(
    []
  );
  const [openedSection, setOpenedSection] = useState<SectionName | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [rainEnabled, setRainEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);

  const pianoHeight = (stageSize.width / PIANO_SOURCE_WIDTH) * PIANO_SOURCE_HEIGHT;
  const whiteLaneY = pianoHeight - 8;
  const blackLaneY = pianoHeight + 34;
  const baseLaneY = lane === "black" ? blackLaneY : whiteLaneY;
  const playerY = baseLaneY + velocityY * 4;

  useEffect(() => {
    const updateSize = () => {
      if (!stageRef.current) return;

      const nextSize = {
        width: stageRef.current.offsetWidth,
        height: stageRef.current.offsetHeight,
      };

      setStageSize(nextSize);

      if (!hasCenteredPlayer.current) {
        setX(Math.max(0, nextSize.width / 2 - PLAYER_WIDTH / 2));
        hasCenteredPlayer.current = true;
        return;
      }

      setX((prev) => Math.max(0, Math.min(nextSize.width - PLAYER_WIDTH, prev)));
    };

    updateSize();
    window.addEventListener("resize", updateSize);

    return () => {
      window.removeEventListener("resize", updateSize);
    };
  }, []);

  const rainDrops = useMemo(
    () =>
      Array.from({ length: 78 }).map((_, i) => ({
        id: i,
        left: `${(i * 17) % 100}%`,
        delay: `${(i % 11) * 0.18}s`,
        duration: `${0.85 + ((i * 19) % 10) * 0.08}s`,
      })),
    []
  );

  const motes = useMemo(
    () =>
      Array.from({ length: 42 }).map((_, i) => ({
        id: i,
        left: `${(i * 29) % 100}%`,
        top: `${18 + ((i * 41) % 70)}%`,
        delay: `${(i % 9) * 0.4}s`,
      })),
    []
  );

  const getPressedKey = useCallback(() => {
    const playerCenter = x + PLAYER_WIDTH / 2;

    return pianoKeys.find((key) => {
      const keyStart = (key.x / PIANO_SOURCE_WIDTH) * stageSize.width;
      const keyEnd = ((key.x + key.width) / PIANO_SOURCE_WIDTH) * stageSize.width;

      return key.type === lane && playerCenter >= keyStart && playerCenter <= keyEnd;
    });
  }, [lane, stageSize.width, x]);

  const triggerNote = useCallback(
    (note: string) => {
      setActiveNote(note);

      if (audioEnabled) {
        void playNote(note);
      }

      setPlayedNotes((prev) => [
        ...prev,
        {
          id: noteIdRef.current++,
          note,
        },
      ]);

      const particleBaseX = x + PLAYER_WIDTH / 2;
      const particleBaseY = stageSize.height - baseLaneY + 8;
      const newParticles = Array.from({ length: 10 }).map((_, i) => ({
        id: Date.now() + i + Math.random(),
        x: particleBaseX,
        y: particleBaseY,
        driftX: (i - 4.5) * 18,
      }));

      setParticles((prev) => [...prev, ...newParticles]);

      window.setTimeout(() => {
        setParticles((prev) =>
          prev.filter((particle) => !newParticles.some((item) => item.id === particle.id))
        );
      }, 900);

      window.setTimeout(() => {
        setActiveNote(null);
      }, 140);
    },
    [audioEnabled, baseLaneY, stageSize.height, x]
  );

  const checkMelody = useCallback(() => {
    const current = playedNotes.map((note) => note.note).join("-");

    DISCOVERY_PATTERNS.forEach((pattern) => {
      if (!current.includes(pattern.sequence.join("-"))) return;

      setDiscoveredSections((prev) =>
        prev.includes(pattern.name) ? prev : [...prev, pattern.name]
      );
    });
  }, [playedNotes]);

  const deleteLastNote = useCallback(() => {
    setPlayedNotes((prev) => prev.slice(0, -1));
  }, []);

  useEffect(() => {
    const movementInterval = window.setInterval(() => {
      setX((prev) => {
        let next = prev;

        if (keys.ArrowLeft) {
          next -= MOVEMENT_SPEED;
          setDirection("left");
        }

        if (keys.ArrowRight) {
          next += MOVEMENT_SPEED;
          setDirection("right");
        }

        return Math.max(0, Math.min(stageSize.width - PLAYER_WIDTH, next));
      });

      if (keys.ArrowUp) {
        setLane("black");
      }

      if (keys.ArrowDown) {
        setLane("white");
      }

      if (keys.Space && !isJumping) {
        setIsJumping(true);
        setVelocityY(JUMP_FORCE);
      }
    }, 16);

    return () => {
      window.clearInterval(movementInterval);
    };
  }, [isJumping, keys, stageSize.width]);

  useEffect(() => {
    const physicsLoop = window.setInterval(() => {
      if (!isJumping) return;

      setVelocityY((current) => {
        const next = current - GRAVITY;

        if (next <= -JUMP_FORCE) {
          setIsJumping(false);

          const pressedKey = getPressedKey();
          if (pressedKey) {
            triggerNote(pressedKey.note);
          }

          return 0;
        }

        return next;
      });
    }, 16);

    return () => {
      window.clearInterval(physicsLoop);
    };
  }, [getPressedKey, isJumping, triggerNote]);

  useEffect(() => {
    const keyDown = (event: KeyboardEvent) => {
      if (
        event.code === "Space" ||
        event.code === "ArrowLeft" ||
        event.code === "ArrowRight" ||
        event.code === "ArrowUp" ||
        event.code === "ArrowDown"
      ) {
        event.preventDefault();
      }

      if (event.code === "Enter") {
        checkMelody();
      }

      if (event.code === "Backspace" || event.code === "Delete") {
        deleteLastNote();
      }
    };

    window.addEventListener("keydown", keyDown);

    return () => {
      window.removeEventListener("keydown", keyDown);
    };
  }, [checkMelody, deleteLastNote]);

  return (
    <div className="scene">
      <div className="background-glow" />
      <div className="dream-overlay" />
      <div className="floor-glow" />

      {rainEnabled && (
        <div className="rain-layer" aria-hidden="true">
          {rainDrops.map((drop) => (
            <span
              key={drop.id}
              className="rain-drop"
              style={{
                left: drop.left,
                animationDelay: drop.delay,
                animationDuration: drop.duration,
              }}
            />
          ))}
        </div>
      )}

      <div className="mote-layer" aria-hidden="true">
        {motes.map((mote) => (
          <span
            key={mote.id}
            className="mote"
            style={{
              left: mote.left,
              top: mote.top,
              animationDelay: mote.delay,
            }}
          />
        ))}
      </div>

      <aside className="sidebar" aria-label="Secciones desbloqueables">
        <div className="sidebar-logo" aria-hidden="true">
          &#9835;
        </div>

        <div className="sidebar-menu">
          {DISCOVERY_PATTERNS.map((item) => {
            const unlocked = discoveredSections.includes(item.name);

            return (
              <button
                key={item.name}
                className={`sidebar-button ${unlocked ? "unlocked" : "locked"}`}
                disabled={!unlocked}
                onClick={() => setOpenedSection(item.name)}
              >
                <span className={`nav-icon ${item.icon}`} aria-hidden="true" />
                <span>{item.name}</span>
                {!unlocked && (
                  <span className="lock-icon" aria-hidden="true">
                    &#128274;
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="sidebar-divider" />

        <button className="sidebar-button settings" onClick={() => setShowSettings(true)}>
          <span className="nav-icon gear" aria-hidden="true" />
          <span>Configuracion</span>
        </button>
      </aside>

      <main className="stage-shell">
        <section className="top-ui" aria-label="Partitura">
          <motion.h1 initial={{ opacity: 0, y: -24 }} animate={{ opacity: 1, y: 0 }}>
            PLAY TO DISCOVER
          </motion.h1>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <span>&larr; &rarr;</span> Move
            <span>SPACE</span> Jump
            <span>ENTER</span> Check Melody
          </motion.p>

          <div className="sheet-wrapper">
            <div className="sheet-music">
              <div className="treble-clef" aria-hidden="true">
                &#119070;
              </div>

              <div className="measure-bar" />

              {[0, 1, 2, 3, 4].map((line) => (
                <div
                  key={line}
                  className="staff-line"
                  style={{
                    top: `${46 + line * 24}px`,
                  }}
                />
              ))}

              {playedNotes.map((note, index) => (
                <motion.div
                  key={note.id}
                  className="music-note"
                  initial={{ opacity: 0, scale: 0, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  style={{
                    left: `${150 + (index % 18) * 56}px`,
                    top: `${NOTE_TO_STAFF[note.note] ?? 90}px`,
                  }}
                >
                  <div className="note-head" />
                  <div className="note-stick" />
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="game-area" aria-label="Piano interactivo">
          <div className="play-stage" ref={stageRef}>
            <Player x={x} y={playerY} direction={direction} isJumping={isJumping} />

            <AnimatePresence>
              {particles.map((particle) => (
                <motion.div
                  key={particle.id}
                  className="music-particle"
                  initial={{
                    opacity: 1,
                    scale: 0.8,
                    x: particle.x,
                    y: particle.y,
                  }}
                  animate={{
                    opacity: 0,
                    scale: 0,
                    x: particle.x + particle.driftX,
                    y: particle.y - 120,
                  }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              ))}
            </AnimatePresence>

            <Piano activeNote={activeNote} />
          </div>
        </section>
      </main>

      <AnimatePresence>
        {openedSection && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="modal-card"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <button className="close-button" onClick={() => setOpenedSection(null)}>
                &times;
              </button>
              <h2>{openedSection}</h2>
              <p>{PORTFOLIO_CONTENT[openedSection]}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSettings && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="modal-card"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <button className="close-button" onClick={() => setShowSettings(false)}>
                &times;
              </button>
              <h2>Configuracion</h2>
              <p>&larr; &rarr; Movimiento</p>
              <p>SPACE Saltar</p>
              <p>ENTER Revisar melodia</p>
              <p>DELETE Eliminar ultima nota</p>

              <button className="toggle-button" onClick={() => setRainEnabled((prev) => !prev)}>
                Lluvia: {rainEnabled ? "ON" : "OFF"}
              </button>
              <button className="toggle-button" onClick={() => setAudioEnabled((prev) => !prev)}>
                Audio: {audioEnabled ? "ON" : "OFF"}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
