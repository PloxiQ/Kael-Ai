// Global Telegram WebApp types. No imports/exports: this is an ambient file.

interface TelegramWebApp {
  initData: string;
  initDataUnsafe?: {
    user?: {
      id: number;
      first_name?: string;
      last_name?: string;
      username?: string;
      photo_url?: string;
    };
  };
  ready(): void;
  expand(): void;
  close?(): void;
  setHeaderColor?(color: string): void;
  setBackgroundColor?(color: string): void;
  setBottomBarColor?(color: string): void;
  disableVerticalSwipes?(): void;
  HapticFeedback?: {
    impactOccurred(
      style: "light" | "medium" | "heavy" | "rigid" | "soft",
    ): void;
    notificationOccurred(type: "error" | "success" | "warning"): void;
  };
}

interface Window {
  Telegram?: { WebApp?: TelegramWebApp };
}
