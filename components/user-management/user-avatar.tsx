"use client";

import type { User } from "@/types/users";

import { useAvatarUrl } from "@/hooks/use-avatar-url";
import { getUserInitials } from "@/lib/user/display";

function initialsFromUser(user: User): string {
  return getUserInitials(user);
}

export function UserAvatar({
  user,
  size = 32,
  avatarFileId,
}: {
  user: User;
  size?: number;
  avatarFileId?: string | null;
}) {
  const resolvedFileId = avatarFileId ?? user.preferences?.avatar_file_id ?? null;
  const imageUrl = useAvatarUrl(resolvedFileId);

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt=""
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          objectFit: "cover",
          flexShrink: 0,
        }}
      />
    );
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "#F5E6D0",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.34,
        fontWeight: 500,
        color: "#D4A96A",
        flexShrink: 0,
      }}
    >
      {initialsFromUser(user)}
    </div>
  );
}
