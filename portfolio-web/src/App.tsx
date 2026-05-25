import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import "./App.css";
import Player from "./components/Player";
import Piano from "./components/Piano";
import { playMelody, playNote } from "./audio/piano";
import { pianoKeys } from "./data/pianoKeys";
import { useKeyboard } from "./hooks/useKeyboard";

const PLAYER_WIDTH = 64;
const MOVEMENT_SPEED = 8;
const JUMP_FORCE = 18;
const GRAVITY = 0.9;
const PIANO_SOURCE_WIDTH = 1260;
const PIANO_SOURCE_HEIGHT = 260;
const STAFF_TOP = 46;
const STAFF_LINE_GAP = 24;
const STAFF_STEP = STAFF_LINE_GAP / 2;
const STAFF_BOTTOM = STAFF_TOP + STAFF_LINE_GAP * 4;
const NOTE_HEAD_CENTER = 40;
const NOTE_START_X = 166;
const NOTE_SPACING = 72;
const MEASURE_START_X = 112;
const SHEET_MIN_WIDTH = 1120;

type SectionName =
  | "Sobre mi"
  | "Skills"
  | "Proyecto 01"
  | "Proyecto 02"
  | "Proyecto 03"
  | "Proyecto 04"
  | "Portafolio"
  | "Contacto";

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
  icon: "profile" | "star" | "folder" | "contact";
}

interface SectionContent {
  lead: string;
  highlights: string[];
  links?: {
    label: string;
    href: string;
  }[];
}

interface StaffNote {
  y: number;
  hasFlat: boolean;
  stemDown: boolean;
  ledgerLines: number[];
}

const LETTER_INDEX: Record<string, number> = {
  C: 0,
  D: 1,
  E: 2,
  F: 3,
  G: 4,
  A: 5,
  B: 6,
};

const MIDDLE_LINE_Y =
  STAFF_BOTTOM - (LETTER_INDEX.B - LETTER_INDEX.E) * STAFF_STEP;

const PORTFOLIO_CONTENT: Record<SectionName, SectionContent> = {
  "Sobre mi": {
    lead:
      "Mi nombre es Tiffany Salazar y me dedico al desarrollo enfocado en crear experiencias interactivas mezclando diferentes tecnologías para el desarrollo de frontend buscando adquirir nuevos conocimientos conforme más progrese.",
    highlights: ["UI interactiva", "Audio reactivo", "Experiencias web cinematicas", "Aprendizaje constante", "Videojuegos", "Tests"],
  },
  Skills: {
    lead:
      "Trabajo con herramientas modernas para construir interfaces fluidas, tipadas y faciles de mantener, además de la búsqueda de aprendizaje constante para el desarrollo de nuevas habilidades.",
    highlights: ["React", "TypeScript", "Docker", "Framer Motion", "Tone.js", "UX/UI"],
  },
  "Proyecto 01": {
    lead:
      "Un juego de Snake que desafía la agilidad mental desarrollado como un reto en el cual se utiliza solamente React.",
    highlights: ["React", "Videojuego", "Experiencia interactiva"],
    links: [
      {label: "Juego de Snake", href: "https://github.com/Tiffany24630/Lab7-Snake-con-React"}
    ],
  },
  "Proyecto 02": {
    lead:
      "Manejo de tests en proyecto para la parte de front-end.",
    highlights: ["Tests", "Front-end"],
    links: [
      {label: "Tests", href: "https://github.com/Tiffany24630/Lab8--Password-Meter-"}
    ],
  },
  "Proyecto 03": {
    lead:
      "Desarrollo de una aplicación web con gatitos que muestra aleatoriamente imagen y descripción.",
    highlights: ["Imagenes", "React"],
    links: [
      {label: "Gatitos", href: "https://github.com/Tiffany24630/App-de-gatitos"}
    ],
  },
  "Proyecto 04": {
    lead:
      "Desarrollo de una imagen (personaje) usando únicamente CSS.",
    highlights: ["Diseños con CSS", "Front"],
    links: [
      {label: "CSS Kirby", href: "https://github.com/Tiffany24630/Lab-4-CSS-only/tree/main"}
    ],
  },
  "Portafolio": {
    lead:
      "Este portafolio aplica tanto tests como uso de React y uso front.",
    highlights: ["Arquitectura React", "Portafolio", "Testing"],
    links: [
      {label: "Portafolio", href: "https://github.com/Tiffany24630/Portafolio-Web"}
    ],
  },
  Contacto: {
    lead:
      "Información de contacto:",
    highlights: ["Disponible para colaborar", "Frontend creativo", "Experiencias interactivas"],
    links: [
      { label: "GitHub", href: "https://github.com/Tiffany24630" },
      { label: "Email", href: "mailto:sal24630@uvg.edu.gt" },
    ],
  },
};

const DISCOVERY_PATTERNS: DiscoveryPattern[] = [
  {
    name: "Sobre mi",
    sequence: ["Gb4", "D5", "E4"],
    icon: "profile",
  },
  {
    name: "Skills",
    sequence: ["Ab4", "C5", "Eb5"],
    icon: "star",
  },
  {
    name: "Proyecto 01",
    sequence: ["D4", "F4", "A4", "Bb4"],
    icon: "folder",
  },
  {
    name: "Proyecto 02",
    sequence: ["Bb4", "Bb4", "Bb4", "A4", "G4"],
    icon: "folder",
  },
  {
    name: "Proyecto 03",
    sequence: ["E5", "Eb5", "E5", "Eb5", "E5", "B4"],
    icon: "folder",
  },
  {
    name: "Proyecto 04",
    sequence: ["D5", "C5", "A4", "C4", "E4", "A4", "B4"],
    icon: "folder",
  },
  {
    name: "Portafolio",
    sequence: ["E4", "E5", "E4"],
    icon: "folder",
  },
  {
    name: "Contacto",
    sequence: ["C4", "E4", "G4"],
    icon: "contact",
  },
];

function formatSequence(sequence: string[]) {
  return sequence.join(" - ");
}

function getStaffNote(note: string): StaffNote {
  const match = /^([A-G])(b?)(\d)$/.exec(note);
  const letter = match?.[1] ?? "C";
  const hasFlat = match?.[2] === "b";
  const octave = Number(match?.[3] ?? 4);
  const diatonicIndex = LETTER_INDEX[letter] + (octave - 4) * 7;
  const e4Index = LETTER_INDEX.E;
  const y = STAFF_BOTTOM - (diatonicIndex - e4Index) * STAFF_STEP;
  const ledgerLines: number[] = [];

  for (let lineY = STAFF_BOTTOM + STAFF_LINE_GAP; y >= lineY; lineY += STAFF_LINE_GAP) {
    ledgerLines.push(lineY);
  }

  for (let lineY = STAFF_TOP - STAFF_LINE_GAP; y <= lineY; lineY -= STAFF_LINE_GAP) {
    ledgerLines.push(lineY);
  }

  return {
    y,
    hasFlat,
    stemDown: y <= MIDDLE_LINE_Y,
    ledgerLines,
  };
}

export default function App() {
  const keys = useKeyboard();
  const stageRef = useRef<HTMLDivElement>(null);
  const sheetScrollRef = useRef<HTMLDivElement>(null);
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
  const blackLaneY = pianoHeight - 16;
  const baseLaneY = lane === "black" ? blackLaneY : whiteLaneY;
  const playerY = baseLaneY + velocityY * 4;
  const sheetContentWidth = Math.max(
    SHEET_MIN_WIDTH,
    NOTE_START_X + playedNotes.length * NOTE_SPACING + 120
  );
  const measureCount = Math.max(
    1,
    Math.ceil((sheetContentWidth - MEASURE_START_X) / (NOTE_SPACING * 4))
  );
  const openedContent = openedSection ? PORTFOLIO_CONTENT[openedSection] : null;
  const openedPattern = openedSection
    ? DISCOVERY_PATTERNS.find((pattern) => pattern.name === openedSection)
    : null;

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

  useEffect(() => {
    const sheet = sheetScrollRef.current;
    if (!sheet) return;

    sheet.scrollTo({
      left: sheet.scrollWidth,
      behavior: "smooth",
    });
  }, [playedNotes.length]);

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

  const reviewMelody = useCallback(() => {
    const sequence = playedNotes.map((note) => note.note);

    if (audioEnabled && sequence.length > 0) {
      void playMelody(sequence);
    }

    checkMelody();
  }, [audioEnabled, checkMelody, playedNotes]);

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

      if (event.code === "Enter" && !event.repeat) {
        reviewMelody();
      }

      if ((event.code === "Backspace" || event.code === "Delete") && !event.repeat) {
        deleteLastNote();
      }
    };

    window.addEventListener("keydown", keyDown);

    return () => {
      window.removeEventListener("keydown", keyDown);
    };
  }, [deleteLastNote, reviewMelody]);

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
                <span className="mission-copy">
                  <span className="mission-title">{item.name}</span>
                  <span className="mission-sequence">{formatSequence(item.sequence)}</span>
                </span>
                {!unlocked && <span className="lock-icon" aria-hidden="true" />}
              </button>
            );
          })}
        </div>

        <div className="sidebar-divider" />

        <button className="sidebar-button settings" onClick={() => setShowSettings(true)}>
          <span className="nav-icon gear" aria-hidden="true" />
          <span className="mission-copy">
            <span className="mission-title">Configuracion</span>
          </span>
        </button>
      </aside>

      <main className="stage-shell">
        <section className="top-ui" aria-label="Partitura">
          <motion.h1 initial={{ opacity: 0, y: -24 }} animate={{ opacity: 1, y: 0 }}>
            PLAY TO DISCOVER
          </motion.h1>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <span>&larr; &rarr;</span> Moverse
            <span>&uarr; &darr;</span> Negro / Blanco
            <span>SPACE</span> Saltar
            <span>ENTER</span> Reproducir Melodía
            <span>DELETE</span> Eliminar última nota
          </motion.p>

          <div className="sheet-wrapper" ref={sheetScrollRef}>
            <div
              className="sheet-music"
              style={{
                width: `${sheetContentWidth}px`,
              }}
            >
              <div className="treble-clef" aria-hidden="true">
                &#119070;
              </div>

              {Array.from({ length: measureCount }).map((_, index) => (
                <div
                  key={index}
                  className="measure-bar"
                  style={{
                    left: `${MEASURE_START_X + index * NOTE_SPACING * 4}px`,
                  }}
                />
              ))}

              {[0, 1, 2, 3, 4].map((line) => (
                <div
                  key={line}
                  className="staff-line"
                  style={{
                    top: `${STAFF_TOP + line * STAFF_LINE_GAP}px`,
                  }}
                />
              ))}

              {playedNotes.map((note, index) => {
                const staffNote = getStaffNote(note.note);
                const left = NOTE_START_X + index * NOTE_SPACING;

                return (
                  <motion.div
                    key={note.id}
                    className={`music-note ${staffNote.stemDown ? "stem-down" : "stem-up"}`}
                    initial={{ opacity: 0, scale: 0, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    style={{
                      left: `${left}px`,
                      top: `${staffNote.y - NOTE_HEAD_CENTER}px`,
                    }}
                    aria-label={note.note}
                  >
                    {staffNote.hasFlat && (
                      <span className="accidental" aria-hidden="true">
                        &#9837;
                      </span>
                    )}

                    {staffNote.ledgerLines.map((lineY) => (
                      <span
                        key={lineY}
                        className="ledger-line"
                        style={{
                          top: `${lineY - staffNote.y + NOTE_HEAD_CENTER}px`,
                        }}
                      />
                    ))}

                    <div className="note-head" />
                    <div className="note-stick" />
                  </motion.div>
                );
              })}
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
        {openedSection && openedContent && openedPattern && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="modal-card portfolio-card"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <button className="close-button" onClick={() => setOpenedSection(null)}>
                &times;
              </button>
              <span className="card-kicker">Mision desbloqueada</span>
              <h2>{openedSection}</h2>
              <p>{openedContent.lead}</p>

              <div className="melody-badge">Melodia: {formatSequence(openedPattern.sequence)}</div>

              <div className="portfolio-grid">
                {openedContent.highlights.map((item) => (
                  <span key={item} className="portfolio-chip">
                    {item}
                  </span>
                ))}
              </div>

              {openedContent.links && (
                <div className="social-links">
                  {openedContent.links.map((link) => (
                    <a key={link.label} href={link.href} target="_blank" rel="noreferrer">
                      {link.label}
                    </a>
                  ))}
                </div>
              )}
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
              <p>&uarr; &darr; Cambiar entre teclas negras y blancas</p>
              <p>SPACE Saltar</p>
              <p>ENTER Revisar y reproducir melodia</p>
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
