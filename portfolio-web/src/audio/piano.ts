import * as Tone from "tone";

const synth = new Tone.Synth({
  oscillator: {
    type: "triangle",
  },

  envelope: {
    attack: 0.001,
    decay: 0.08,
    sustain: 0,
    release: 0.05,
  },
}).toDestination();

export async function playNote(
  note: string
) {
  await Tone.start();
  synth.triggerRelease();

  synth.triggerAttackRelease(
    note,
    0.08
  );
}