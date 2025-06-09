import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export const BACKEND_URL = "https://kiwi-direct-wholly.ngrok-free.app";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// lib/fetcher.ts
export async function customFetch(url: string, options: RequestInit = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      "ngrok-skip-browser-warning": "true",
    },
  });

  if (!res.ok) throw new Error("Fetch failed");
  return res;
}
