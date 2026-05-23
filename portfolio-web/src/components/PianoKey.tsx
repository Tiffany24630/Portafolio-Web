import { motion } from "framer-motion";

interface Props {
  note: string;
  active: boolean;
  type: "white" | "black";
  x: number;
  width: number;
}

export default function PianoKey({
  note,
  active,
  type,
  x,
  width,
}: Props) {
  return (
    <motion.div
      className={`key ${type}`}
      animate={{
        y: active ? 8 : 0,
        scale: active ? 0.98 : 1,
        boxShadow: active
          ? type === "white"
            ? "0 0 35px rgba(255,255,255,0.95)"
            : "0 0 35px rgba(0,255,255,0.9)"
          : "0 0 0px rgba(0,0,0,0)",
      }}
      transition={{
        duration: 0.08,
      }}
      style={{
        left: `${x}px`,
        width: `${width}px`,
      }}
    >
      <span>{note}</span>
    </motion.div>
  );
}