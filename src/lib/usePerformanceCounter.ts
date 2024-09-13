import { useState } from "react";
import { useAnimationFrame } from "./useAnimationFrame";

export const usePerformanceCounter = () => {
  const [count, setCount] = useState<number | undefined>(undefined);

  useAnimationFrame(() => {
    setCount(performance.now());
  });

  return count === undefined ? performance.now() : count;
}
