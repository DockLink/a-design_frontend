"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";

import {
  getUserInitials,
  getUserListPrimaryLabel,
  userMatchesSearch,
} from "@/lib/user/display";
import type { User } from "@/types/users";

export function MemberSearchSelect({
  users,
  value,
  onChange,
  placeholder = "Select member…",
  disabled,
  loading,
  id,
}: {
  users: User[];
  value: string;
  onChange: (userId: string) => void;
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
  id?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selected = users.find((u) => u.id === value) ?? null;

  const filtered = useMemo(
    () => users.filter((u) => userMatchesSearch(u, query)),
    [users, query]
  );

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => searchRef.current?.focus(), 0);
    function onDocClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", onDocClick);
    };
  }, [open]);

  function selectUser(userId: string) {
    onChange(userId);
    setOpen(false);
    setQuery("");
  }

  const triggerPrimary = selected
    ? getUserListPrimaryLabel(selected)
    : loading
      ? "Loading members…"
      : placeholder;

  const triggerSecondary = selected?.email ?? null;

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <button
        type="button"
        id={id}
        disabled={disabled || loading}
        onClick={() => setOpen((prev) => !prev)}
        style={{
          width: "100%",
          minHeight: "40px",
          borderRadius: "10px",
          border: "1px solid rgba(90,60,30,0.15)",
          background: "var(--ds-bg)",
          padding: "8px 36px 8px 12px",
          textAlign: "left",
          cursor: disabled || loading ? "not-allowed" : "pointer",
          opacity: disabled || loading ? 0.7 : 1,
          position: "relative",
        }}
      >
        <span style={{ display: "block", fontSize: "var(--ds-text-footnote)", color: selected ? "var(--ds-label)" : "var(--ds-tertiary-label)" }}>
          {triggerPrimary}
        </span>
        {triggerSecondary && (
          <span style={{ display: "block", fontSize: "var(--ds-text-caption-2)", color: "var(--ds-tertiary-label)", marginTop: "1px" }}>
            {triggerSecondary}
          </span>
        )}
        <ChevronDown
          size={16}
          color="var(--ds-tertiary-label)"
          style={{
            position: "absolute",
            right: 12,
            top: "50%",
            transform: `translateY(-50%) rotate(${open ? 180 : 0}deg)`,
            transition: "transform 0.15s ease",
          }}
        />
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            right: 0,
            background: "#FFFFFF",
            border: "1px solid rgba(90,60,30,0.15)",
            borderRadius: "12px",
            boxShadow: "0 12px 32px rgba(0,0,0,0.12)",
            zIndex: 40,
            overflow: "hidden",
          }}
        >
          <div style={{ position: "relative", borderBottom: "1px solid rgba(90,60,30,0.10)" }}>
            <Search
              size={14}
              color="var(--ds-tertiary-label)"
              style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}
            />
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or email…"
              style={{
                width: "100%",
                height: "40px",
                border: "none",
                outline: "none",
                padding: "0 12px 0 34px",
                fontSize: "var(--ds-text-footnote)",
                background: "transparent",
              }}
            />
          </div>

          <div style={{ maxHeight: "240px", overflowY: "auto" }}>
            <button
              type="button"
              onClick={() => selectUser("")}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "10px 12px",
                border: "none",
                background: !value ? "rgba(212,169,106,0.10)" : "transparent",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <span style={{ fontSize: "var(--ds-text-footnote)", color: "var(--ds-tertiary-label)" }}>No project lead</span>
              {!value && <Check size={14} color="var(--ds-accent)" style={{ marginLeft: "auto" }} />}
            </button>

            {filtered.length === 0 ? (
              <div style={{ padding: "14px 12px", fontSize: "var(--ds-text-caption-1)", color: "var(--ds-tertiary-label)" }}>
                No members match your search.
              </div>
            ) : (
              filtered.map((user) => {
                const isSelected = user.id === value;
                const initials = getUserInitials(user);
                return (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => selectUser(user.id)}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "10px 12px",
                      border: "none",
                      borderTop: "1px solid rgba(90,60,30,0.06)",
                      background: isSelected ? "rgba(212,169,106,0.10)" : "transparent",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    <span
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        background: "#E8DDD0",
                        color: "var(--ds-secondary-label)",
                        fontSize: "11px",
                        fontWeight: 600,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      {initials}
                    </span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: "block", fontSize: "var(--ds-text-footnote)", fontWeight: 500, color: "var(--ds-label)" }}>
                        {getUserListPrimaryLabel(user)}
                      </span>
                      <span style={{ display: "block", fontSize: "var(--ds-text-caption-2)", color: "var(--ds-tertiary-label)", marginTop: "1px" }}>
                        {user.email}
                      </span>
                    </span>
                    {isSelected && <Check size={14} color="var(--ds-accent)" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
