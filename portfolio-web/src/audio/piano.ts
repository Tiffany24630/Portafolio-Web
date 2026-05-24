import * as Tone from "tone";

let audioEnabled = true;

export function setAudioEnabledState(
  value: boolean
) {
  audioEnabled = value;
}

const synth =
  new Tone.PolySynth(
    Tone.Synth,
    {
      oscillator: {
        type: "triangle",
      },

      envelope: {
        attack: 0.001,
        decay: 0.04,
        sustain: 0,
        release: 0.02,
      },
    }
  ).toDestination();

export async function playNote(
  note: string
) {
  if (!audioEnabled) {
    return;
  }

  await Tone.start();

  synth.triggerAttackRelease(
    note,
    "64n"
  );
}