import playerImg from "../assets/player.png";

interface Props {
  x: number;
  y: number;
  direction: "left" | "right";
}

export default function Player({
  x,
  y,
  direction,
}: Props) {

  return (
    <img
      src={playerImg}
      alt="player"
      className="player"
      style={{
        left: `${x}px`,
        bottom: `${y}px`,
        transform:
          direction === "left"
            ? "scaleX(-1)"
            : "scaleX(1)",
      }}
    />
  );
}