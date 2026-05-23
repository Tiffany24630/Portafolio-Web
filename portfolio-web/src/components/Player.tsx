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
      className="player"
      alt="player"
      style={{
        transform: `
          translate(${x}px, ${y}px)
          scaleX(${direction === "left" ? -1 : 1})
        `,
      }}
    />
  );
}