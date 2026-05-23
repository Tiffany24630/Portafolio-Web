export interface PianoKeyData {
  note: string;
  x: number;
  width: number;
  type: "white" | "black";
}

const WHITE_WIDTH = 90;
const BLACK_WIDTH = 58;

export const pianoKeys: PianoKeyData[] = [
  // OCTAVA 4
  { note: "C4", x: 0, width: WHITE_WIDTH, type: "white" },
  { note: "Db4", x: 61, width: BLACK_WIDTH, type: "black" },
  { note: "D4", x: 90, width: WHITE_WIDTH, type: "white" },
  { note: "Eb4", x: 151, width: BLACK_WIDTH, type: "black" },
  { note: "E4", x: 180, width: WHITE_WIDTH, type: "white" },
  { note: "F4", x: 270, width: WHITE_WIDTH, type: "white" },
  { note: "Gb4", x: 331, width: BLACK_WIDTH, type: "black" },
  { note: "G4", x: 360, width: WHITE_WIDTH, type: "white" },
  { note: "Ab4", x: 421, width: BLACK_WIDTH, type: "black" },
  { note: "A4", x: 450, width: WHITE_WIDTH, type: "white" },
  { note: "Bb4", x: 511, width: BLACK_WIDTH, type: "black" },
  { note: "B4", x: 540, width: WHITE_WIDTH, type: "white" },

  // OCTAVA 5
  { note: "C5", x: 630, width: WHITE_WIDTH, type: "white" },
  { note: "Db5", x: 691, width: BLACK_WIDTH, type: "black" },
  { note: "D5", x: 720, width: WHITE_WIDTH, type: "white" },
  { note: "Eb5", x: 781, width: BLACK_WIDTH, type: "black" },
  { note: "E5", x: 810, width: WHITE_WIDTH, type: "white" },
  { note: "F5", x: 900, width: WHITE_WIDTH, type: "white" },
  { note: "Gb5", x: 961, width: BLACK_WIDTH, type: "black" },
  { note: "G5", x: 990, width: WHITE_WIDTH, type: "white" },
  { note: "Ab5", x: 1051, width: BLACK_WIDTH, type: "black" },
  { note: "A5", x: 1080, width: WHITE_WIDTH, type: "white" },
  { note: "Bb5", x: 1141, width: BLACK_WIDTH, type: "black" },
  { note: "B5", x: 1170, width: WHITE_WIDTH, type: "white" },
];