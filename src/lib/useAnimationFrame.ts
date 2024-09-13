import { useCallback, useEffect, useRef } from "react";

export const useAnimationFrame = (callback = () => {}) => {
  const id = useRef<number>();
  const request = useCallback(() => {
    id.current = requestAnimationFrame(request);
    callback();
  }, [callback]);
  useEffect(() => {
    id.current = requestAnimationFrame(request);
    return () => {
      if (id.current !== undefined) cancelAnimationFrame(id.current);
    };
  }, [request]);
};
