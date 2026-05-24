import idlePlayer from "../assets/player.png";
import jumpPlayer from "../assets/jumpPlayer.png";

interface Props {
  x: number;
  y: number;
  direction: "left" | "right";
  isJumping: boolean;
}

export default function Player({
  x,
  y,
  direction,
  isJumping,
}: Props) {
  return (
    <img
      src={
        isJumping
          ? jumpPlayer
          : idlePlayer
      }
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