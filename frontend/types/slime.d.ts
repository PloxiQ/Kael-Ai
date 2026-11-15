import type { SlimeApi } from "../lib/slime";

declare global {
  interface Window {
    Slime?: SlimeApi;
  }
}

export {};
