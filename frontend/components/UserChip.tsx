"use client";

import { useUser } from "@clerk/react";
import { useI18n } from "../lib/i18n";
import { useKaelAuth } from "./auth/KaelAuthProvider";

/** Clerk avatar and display name. Used in the header. */
export function UserChip({
  compact = false,
  className = "",
}: {
  compact?: boolean;
  className?: string;
}) {
  const { user } = useUser();
  const { role } = useKaelAuth();
  const { t } = useI18n();

  if (!user) {
    return null;
  }

  const label =
    user.fullName ||
    user.username ||
    user.primaryEmailAddress?.emailAddress ||
    "KAEL";
  const initial = label.slice(0, 1).toUpperCase();
  const roleLabel = role === "user" ? null : t(`auth.role.${role}`);

  return (
    <div
      className={`flex min-w-0 items-center gap-2.5 ${className}`}
      title={label}
    >
      <div className="shrink-0 rounded-full ring-1 ring-[#262626]">
        {user.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.imageUrl}
            alt=""
            className="h-8 w-8 rounded-full bg-[#161616] object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#161616] text-sm font-semibold text-[#10B981]">
            {initial}
          </div>
        )}
      </div>
      {!compact && (
        <div className="min-w-0 leading-tight">
          <div className="truncate text-sm font-medium text-[#F5F5F0]">
            {label}
          </div>
          {roleLabel && (
            <div className="truncate text-xs text-[#8E8E8A]">{roleLabel}</div>
          )}
        </div>
      )}
    </div>
  );
}
