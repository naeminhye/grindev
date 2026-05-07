"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface UseTimerOptions {
  initialSeconds: number;
  onExpire?: () => void;
}

export function useTimer({ initialSeconds, onExpire }: UseTimerOptions) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const elapsedRef = useRef(0);

  const start = useCallback(() => {
    if (isRunning || isExpired) return;
    startTimeRef.current = Date.now();
    setIsRunning(true);
  }, [isRunning, isExpired]);

  const stop = useCallback(() => {
    setIsRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  const getElapsedSeconds = useCallback(() => {
    return initialSeconds - secondsLeft;
  }, [initialSeconds, secondsLeft]);

  useEffect(() => {
    if (!isRunning) return;

    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          clearInterval(intervalRef.current!);
          setIsRunning(false);
          setIsExpired(true);
          onExpire?.();
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, onExpire]);

  const toggleVisibility = useCallback(() => {
    setIsVisible((v) => !v);
  }, []);

  const reset = useCallback(
    (newSeconds?: number) => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setIsRunning(false);
      setIsExpired(false);
      setSecondsLeft(newSeconds ?? initialSeconds);
    },
    [initialSeconds],
  );

  return {
    secondsLeft,
    isRunning,
    isExpired,
    isVisible,
    start,
    stop,
    toggleVisibility,
    getElapsedSeconds,
    reset,
  };
}
