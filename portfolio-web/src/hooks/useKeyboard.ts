import { useEffect, useState } from "react";

export function useKeyboard() {
  const [keys, setKeys] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      setKeys((k) => ({ ...k, [e.code]: true }));
    };

    const up = (e: KeyboardEvent) => {
      setKeys((k) => ({ ...k, [e.code]: false }));
    };

    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);

    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  return keys;
}