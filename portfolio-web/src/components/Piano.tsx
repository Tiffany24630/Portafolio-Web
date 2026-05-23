import PianoKey from "./PianoKey";
import { pianoKeys } from "../data/pianoKeys";

interface Props {
  activeNote: string | null;
}

export default function Piano({
  activeNote,
}: Props) {

  const whiteKeys = pianoKeys.filter(
    (k) => k.type === "white"
  );

  const blackKeys = pianoKeys.filter(
    (k) => k.type === "black"
  );

  return (
    <div className="piano-container">
      <div className="white-keys">
        {whiteKeys.map((key) => (
          <PianoKey
            key={key.note}
            note={key.note}
            active={activeNote === key.note}
            type={key.type}
            x={key.x}
            width={key.width}
          />
        ))}
      </div>

      <div className="black-keys">
        {blackKeys.map((key) => (
          <PianoKey
            key={key.note}
            note={key.note}
            active={activeNote === key.note}
            type={key.type}
            x={key.x}
            width={key.width}
          />
        ))}
      </div>
    </div>
  );
}