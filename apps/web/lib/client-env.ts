"use client";

export function getClientEnv(key: string) {
  if (typeof window === "undefined") return process.env[key];
  return (
    (window as { __ENV?: Record<string, string> }).__ENV?.[key] ||
    process.env[key]
  );
}
