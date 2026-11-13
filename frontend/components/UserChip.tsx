"use client";

import { useTelegramAuth } from "./TelegramAuthProvider";

/** Telegram avatar and name. Used in the header and sidebar. */
export function UserChip({
  compact = false,
  className = "",
}: {
  compact?: boolean;
  className?: string;
}) {
  const { user } = useTelegramAuth();
  if (!user) {
    return null;
  }

  const initial = (user.first_name || "?").slice(0, 1).toUpperCase();
  const label = user.username ? `@${user.username}` : user.first_name;

  return (
    <div
      className={`flex items-center gap-2.5 ${className}`}
      title={label}
    >
      <div className="rounded-full bg-kael-gradient p-[2px] shadow-[0_0_14px_rgba(245,87,108,0.45)]">
        {user.photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.photo_url}
            alt=""
            className="h-8 w-8 rounded-full bg-black object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0b0614] text-sm font-bold text-[#f7a6ba]">
            {initial}
          </div>
        )}
      </div>
      {!compact && (
        <div className="min-w-0 leading-tight">
          <div className="truncate text-sm font-medium text-zinc-100">
            {user.first_name}
          </div>
          {user.username && (
            <div className="truncate text-xs text-[#f7a6ba]/70">
              @{user.username}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
