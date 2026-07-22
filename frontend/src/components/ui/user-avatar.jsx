import { useEffect, useState } from "react";
import { assetUrl } from "@/lib/api";
import { initialsFromName } from "@/lib/candidates";

// Circular user avatar — shows the uploaded photo when present, else initials
// on the accent tint. `user` is the client-shape user ({ fullName, avatarUrl }).
// If the image fails to load (broken/missing file), fall back to initials.
export default function UserAvatar({ user, size = 34, className = "" }) {
  const url = assetUrl(user?.avatarUrl);
  const [broken, setBroken] = useState(false);

  // Reset the error state whenever the photo URL changes (e.g. after upload).
  useEffect(() => {
    setBroken(false);
  }, [url]);

  if (url && !broken) {
    return (
      <img
        src={url}
        alt={user?.fullName || "Avatar"}
        onError={() => setBroken(true)}
        className={`shrink-0 rounded-full object-cover ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-accent-soft font-bold text-accent ${className}`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }}
    >
      {initialsFromName(user?.fullName)}
    </div>
  );
}
