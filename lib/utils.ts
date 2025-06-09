import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export const BACKEND_URL = "https://kiwi-direct-wholly.ngrok-free.app";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
