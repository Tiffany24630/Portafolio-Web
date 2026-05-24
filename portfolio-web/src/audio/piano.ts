import * as Tone from "tone";

const synth = new Tone.PolySynth(
  Tone.Synth,
  {
    oscillator: {
      type: "triangle",
    },

    envelope: {
      attack: 0.001,
      decay: 0.03,
      sustain: 0,
      release: 0.015,
    },
  }
).toDestination();

function transposeOctave(
  note: string
) {
  const match =
    note.match(
      /^([A-G][b#]?)(\d)$/
    );

  if (!match) return note;

  const [, pitch, octave] = match;

  return `${pitch}${
    Number(octave) + 1
  }`;
}

export async function playNote(
  note: string
) {
  await Tone.start();

  const higherNote = transposeOctave(note);

  synth.triggerAttackRelease(
    higherNote,
    "96n"
  );
}