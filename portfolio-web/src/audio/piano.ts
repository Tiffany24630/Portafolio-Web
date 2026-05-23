import * as Tone from "tone";

const synth = new Tone.Synth().toDestination();

export async function playNote(note: string) {
  await Tone.start();
  synth.triggerAttackRelease(note, "8n");
}