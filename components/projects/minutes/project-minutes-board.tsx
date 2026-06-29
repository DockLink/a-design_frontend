"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Mic, Plus, Trash2, Upload, X as XIcon } from "lucide-react";
import { toast } from "sonner";

import { useProjectMeetingMinutes } from "@/hooks/use-project-meeting-minutes";
import { getUserDisplayName } from "@/lib/user/display";
import { useAuthStore } from "@/stores/auth-store";
import type { MeetingActionItem, MeetingMinute } from "@/types/meeting-minutes";

type Mode = "detail" | "create" | "edit";

interface EditAction {
  id: string;
  text: string;
  assignee: string;
  done: boolean;
}

interface EditAudio {
  name: string;
  url: string;
  /** Set for audio already attached to the saved minute. */
  existingId?: string;
  /** Set for a freshly uploaded (floating) file. */
  token?: string;
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function toDateInput(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return new Date().toISOString().slice(0, 10);
  return d.toISOString().slice(0, 10);
}

function audioNameFromUrl(url: string): string {
  try {
    const path = new URL(url, "http://x").pathname;
    const last = path.split("/").filter(Boolean).pop();
    return last ? decodeURIComponent(last) : "Audio recording";
  } catch {
    return "Audio recording";
  }
}

export function ProjectMinutesBoard({ projectId }: { projectId: string }) {
  const {
    minutes,
    isLoading,
    error,
    canManage,
    createMinute,
    updateMinute,
    removeMinute,
    setActionItemStatus,
    uploadAudio,
  } = useProjectMeetingMinutes(projectId);

  const currentUser = useAuthStore((s) => s.session?.user ?? null);
  const currentUserName = currentUser ? getUserDisplayName(currentUser) : "";

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("detail");

  // Editor state
  const [editTitle, setEditTitle] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editAttendees, setEditAttendees] = useState("");
  const [editBody, setEditBody] = useState("");
  const [editActions, setEditActions] = useState<EditAction[]>([]);
  const [editAudio, setEditAudio] = useState<EditAudio | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingAudio, setUploadingAudio] = useState(false);

  useEffect(() => {
    if (mode !== "detail") return;
    if (minutes.length === 0) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !minutes.some((m) => m.id === selectedId)) {
      setSelectedId(minutes[0].id);
    }
  }, [minutes, selectedId, mode]);

  const selected = useMemo(
    () => minutes.find((m) => m.id === selectedId) ?? null,
    [minutes, selectedId]
  );

  function openCreate() {
    setEditTitle("");
    setEditDate(new Date().toISOString().slice(0, 10));
    setEditAttendees(currentUserName);
    setEditBody("");
    setEditActions([]);
    setEditAudio(null);
    setMode("create");
  }

  function openEdit(m: MeetingMinute) {
    setEditTitle(m.title);
    setEditDate(toDateInput(m.meetingDate));
    setEditAttendees(m.attendees.join(", "));
    setEditBody(m.body ?? "");
    setEditActions(
      (m.actionItems ?? []).map((a, i) => ({
        id: `ea-${i}`,
        text: a.text,
        assignee: a.assignee === "Unassigned" ? "" : a.assignee,
        done: a.status === "COMPLETED",
      }))
    );
    const audio = m.audio_files?.[0];
    setEditAudio(audio ? { name: audioNameFromUrl(audio.url), url: audio.url, existingId: audio.id } : null);
    setMode("edit");
  }

  function cancelEditor() {
    setMode("detail");
  }

  async function publish() {
    if (isSaving) return;
    const attendeeList = editAttendees
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (!editTitle.trim()) {
      toast.error("Please enter a meeting title");
      return;
    }

    const meetingIso = new Date(editDate || new Date().toISOString().slice(0, 10)).toISOString();
    const actionItems = editActions
      .filter((a) => a.text.trim())
      .map((a) => ({
        text: a.text.trim(),
        assignee: a.assignee.trim() || "Unassigned",
        dueDate: meetingIso,
        status: (a.done ? "COMPLETED" : "PENDING") as "COMPLETED" | "PENDING",
      }));

    const audioId = editAudio?.existingId ?? editAudio?.token;

    setIsSaving(true);
    try {
      if (mode === "create") {
        const created = await createMinute({
          title: editTitle.trim(),
          meeting_date: meetingIso,
          attendees: attendeeList,
          body: editBody,
          action_items: actionItems,
          audio_files: audioId ? [audioId] : [],
        });
        setSelectedId(created.id);
        toast.success("Meeting minute published");
      } else if (selectedId) {
        await updateMinute(selectedId, {
          title: editTitle.trim(),
          meeting_date: meetingIso,
          attendees: attendeeList,
          body: editBody,
          action_items: actionItems,
          audio_files: audioId ? [{ id: audioId }] : [],
        });
        toast.success("Changes saved");
      }
      setMode("detail");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save meeting minute");
    } finally {
      setIsSaving(false);
    }
  }

  async function toggleActionDone(action: MeetingActionItem, index: number) {
    if (!selected) return;
    const next = action.status === "COMPLETED" ? "PENDING" : "COMPLETED";
    try {
      await setActionItemStatus(selected.id, index, next);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update action item");
    }
  }

  function addEditorAction() {
    setEditActions((prev) => [
      ...prev,
      { id: `ea-${Date.now()}`, text: "", assignee: "", done: false },
    ]);
  }

  function updateEditorAction(id: string, field: "text" | "assignee", value: string) {
    setEditActions((prev) => prev.map((a) => (a.id === id ? { ...a, [field]: value } : a)));
  }

  function removeEditorAction(id: string) {
    setEditActions((prev) => prev.filter((a) => a.id !== id));
  }

  async function handleAudioUpload(file: File) {
    setUploadingAudio(true);
    try {
      const token = await uploadAudio(file);
      setEditAudio({ name: file.name, url: URL.createObjectURL(file), token });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Audio upload failed");
    } finally {
      setUploadingAudio(false);
    }
  }

  async function handleDelete(m: MeetingMinute) {
    if (!window.confirm(`Delete "${m.title}"? This cannot be undone.`)) return;
    try {
      await removeMinute(m.id);
      toast.success("Meeting minute deleted");
      setMode("detail");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete meeting minute");
    }
  }

  return (
    <div style={{ margin: "-28px" }}>
      <div style={{ display: "flex", height: "calc(100vh - 120px)", overflow: "hidden" }}>
        {/* LEFT PANEL */}
        <div
          style={{
            width: "280px",
            flexShrink: 0,
            background: "#FDFAF6",
            borderRight: "1px solid rgba(90,60,30,0.12)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "16px 16px 12px",
              borderBottom: "1px solid rgba(90,60,30,0.10)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexShrink: 0,
            }}
          >
            <span style={{ fontSize: "14px", fontWeight: 500, color: "#1A1410" }}>
              Meeting minutes
            </span>
            {canManage && (
              <button
                onClick={openCreate}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  background: "#D4A96A",
                  border: "none",
                  borderRadius: "6px",
                  height: "26px",
                  padding: "0 10px",
                  fontSize: "12px",
                  color: "white",
                  cursor: "pointer",
                  fontWeight: 500,
                }}
              >
                <Plus size={13} />
                New
              </button>
            )}
          </div>

          <div style={{ overflowY: "auto", flex: 1 }}>
            {isLoading && (
              <div style={{ padding: "16px", fontSize: "13px", color: "#9C8573" }}>Loading…</div>
            )}
            {!isLoading && error && (
              <div style={{ padding: "16px", fontSize: "13px", color: "#C0392B" }}>{error}</div>
            )}
            {!isLoading && !error && minutes.length === 0 && (
              <div style={{ padding: "16px", fontSize: "13px", color: "#9C8573" }}>
                No meeting minutes yet.
              </div>
            )}
            {minutes.map((m) => {
              const active = m.id === selectedId && mode !== "create";
              return (
                <button
                  key={m.id}
                  onClick={() => {
                    setSelectedId(m.id);
                    setMode("detail");
                  }}
                  style={{
                    width: "100%",
                    height: "60px",
                    background: active ? "#F5EFE6" : "transparent",
                    border: "none",
                    borderLeft: active ? "3px solid #D4A96A" : "3px solid transparent",
                    borderBottom: "1px solid rgba(90,60,30,0.08)",
                    cursor: "pointer",
                    padding: "0 14px 0 13px",
                    textAlign: "left",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    gap: "4px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: 500,
                      color: "#1A1410",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {m.title}
                  </div>
                  <div style={{ fontSize: "11px", color: "#9C8573" }}>{fmtDate(m.meetingDate)}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div style={{ flex: 1, background: "#EDE3D4", overflowY: "auto", position: "relative" }}>
          {mode === "detail" && selected && (
            <DetailView
              minute={selected}
              canManage={canManage}
              onEdit={() => openEdit(selected)}
              onDelete={() => handleDelete(selected)}
              onToggleAction={toggleActionDone}
            />
          )}
          {mode === "detail" && !selected && !isLoading && (
            <div style={{ padding: "40px 32px", fontSize: "14px", color: "#9C8573" }}>
              {canManage
                ? "Select a meeting minute, or create a new one."
                : "No meeting minutes have been published yet."}
            </div>
          )}
          {(mode === "create" || mode === "edit") && (
            <EditorView
              title={editTitle}
              date={editDate}
              attendees={editAttendees}
              body={editBody}
              actions={editActions}
              audio={editAudio}
              uploadingAudio={uploadingAudio}
              isSaving={isSaving}
              isCreate={mode === "create"}
              onTitleChange={setEditTitle}
              onDateChange={setEditDate}
              onAttendeesChange={setEditAttendees}
              onBodyChange={setEditBody}
              onAddAction={addEditorAction}
              onUpdateAction={updateEditorAction}
              onRemoveAction={removeEditorAction}
              onAudioUpload={handleAudioUpload}
              onRemoveAudio={() => setEditAudio(null)}
              onCancel={cancelEditor}
              onPublish={publish}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Detail view ─────────────────────────────────────────── */

function DetailView({
  minute,
  canManage,
  onEdit,
  onDelete,
  onToggleAction,
}: {
  minute: MeetingMinute;
  canManage: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onToggleAction: (action: MeetingActionItem, index: number) => void;
}) {
  const audio = minute.audio_files?.[0];
  const actionItems = minute.actionItems ?? [];

  return (
    <div style={{ padding: "28px 32px", maxWidth: "720px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "16px",
          marginBottom: "6px",
        }}
      >
        <div style={{ fontSize: "26px", fontWeight: 500, color: "#1A1410", lineHeight: 1.2 }}>
          {minute.title}
        </div>
        {canManage && (
          <div style={{ display: "flex", gap: "8px", flexShrink: 0, marginTop: "4px" }}>
            <button
              onClick={onEdit}
              style={{
                background: "#F5EFE6",
                border: "1px solid rgba(90,60,30,0.18)",
                borderRadius: "6px",
                height: "28px",
                padding: "0 12px",
                fontSize: "12px",
                color: "#6B5744",
                cursor: "pointer",
              }}
            >
              Edit
            </button>
            <button
              onClick={onDelete}
              title="Delete meeting minute"
              style={{
                background: "#F5EFE6",
                border: "1px solid rgba(90,60,30,0.18)",
                borderRadius: "6px",
                height: "28px",
                width: "28px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#C0392B",
                cursor: "pointer",
              }}
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: "20px", marginBottom: "20px" }}>
        <MetaPill label="Date" value={fmtDate(minute.meetingDate)} />
        <MetaPill label="Attendees" value={minute.attendees.join(" · ") || "—"} />
      </div>

      <Divider />

      {audio && (
        <div style={{ marginBottom: "24px" }}>
          <div
            style={{
              background: "#FDFAF6",
              border: "1px solid rgba(90,60,30,0.12)",
              borderRadius: "12px",
              padding: "16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  background: "rgba(212,169,106,0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Mic size={20} color="#D4A96A" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: 500,
                    color: "#1A1410",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {audioNameFromUrl(audio.url)}
                </div>
                <div style={{ fontSize: "11px", color: "#9C8573", marginTop: "2px" }}>
                  Audio recording
                </div>
              </div>
            </div>
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <audio controls style={{ width: "100%", height: "32px", outline: "none" }} src={audio.url} />
          </div>
        </div>
      )}

      {minute.body && (
        <div
          style={{
            fontSize: "14px",
            color: "#3A2E24",
            lineHeight: 1.75,
            whiteSpace: "pre-wrap",
            marginBottom: "28px",
          }}
        >
          {minute.body}
        </div>
      )}

      {actionItems.length > 0 && (
        <>
          <div style={{ fontSize: "14px", fontWeight: 500, color: "#1A1410", marginBottom: "12px" }}>
            Action items
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {actionItems.map((action, index) => {
              const done = action.status === "COMPLETED";
              return (
                <div
                  key={`${action.text}-${index}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    background: "#FDFAF6",
                    borderRadius: "8px",
                    border: "1px solid rgba(90,60,30,0.10)",
                    padding: "10px 14px",
                  }}
                >
                  <button
                    onClick={() => onToggleAction(action, index)}
                    style={{
                      width: "18px",
                      height: "18px",
                      borderRadius: "50%",
                      border: `2px solid ${done ? "#D4A96A" : "rgba(90,60,30,0.25)"}`,
                      background: done ? "#D4A96A" : "transparent",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      padding: 0,
                    }}
                  >
                    {done && <Check size={10} color="white" strokeWidth={3} />}
                  </button>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: "13px",
                        color: done ? "#9C8573" : "#1A1410",
                        textDecoration: done ? "line-through" : "none",
                      }}
                    >
                      {action.text}
                    </div>
                    {action.assignee && action.assignee !== "Unassigned" && (
                      <div style={{ fontSize: "11px", color: "#9C8573", marginTop: "2px" }}>
                        {action.assignee}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function MetaPill({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div
        style={{
          fontSize: "10px",
          color: "#9C8573",
          marginBottom: "2px",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: "13px", color: "#6B5744" }}>{value}</div>
    </div>
  );
}

function Divider() {
  return <div style={{ height: "1px", background: "rgba(90,60,30,0.12)", marginBottom: "20px" }} />;
}

/* ── Editor view ─────────────────────────────────────────── */

function EditorView({
  title,
  date,
  attendees,
  body,
  actions,
  audio,
  uploadingAudio,
  isSaving,
  isCreate,
  onTitleChange,
  onDateChange,
  onAttendeesChange,
  onBodyChange,
  onAddAction,
  onUpdateAction,
  onRemoveAction,
  onAudioUpload,
  onRemoveAudio,
  onCancel,
  onPublish,
}: {
  title: string;
  date: string;
  attendees: string;
  body: string;
  actions: EditAction[];
  audio: EditAudio | null;
  uploadingAudio: boolean;
  isSaving: boolean;
  isCreate: boolean;
  onTitleChange: (v: string) => void;
  onDateChange: (v: string) => void;
  onAttendeesChange: (v: string) => void;
  onBodyChange: (v: string) => void;
  onAddAction: () => void;
  onUpdateAction: (id: string, field: "text" | "assignee", value: string) => void;
  onRemoveAction: (id: string) => void;
  onAudioUpload: (file: File) => void;
  onRemoveAudio: () => void;
  onCancel: () => void;
  onPublish: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputBase: React.CSSProperties = {
    background: "#FDFAF6",
    border: "1px solid rgba(90,60,30,0.18)",
    borderRadius: "8px",
    padding: "8px 12px",
    fontSize: "13px",
    color: "#1A1410",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ flex: 1, overflowY: "auto", padding: "28px 32px", maxWidth: "720px" }}>
        <input
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Meeting title"
          style={{ ...inputBase, fontSize: "22px", padding: "10px 14px", marginBottom: "16px" }}
        />

        <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: "12px", marginBottom: "16px" }}>
          <div>
            <label style={labelStyle}>Date</label>
            <input type="date" value={date} onChange={(e) => onDateChange(e.target.value)} style={inputBase} />
          </div>
          <div>
            <label style={labelStyle}>Attendees</label>
            <input
              value={attendees}
              onChange={(e) => onAttendeesChange(e.target.value)}
              placeholder="Comma-separated names"
              style={inputBase}
            />
          </div>
        </div>

        <Divider />

        <div style={{ marginBottom: "20px" }}>
          <label style={{ ...labelStyle, marginBottom: "6px" }}>Audio Recording (Optional)</label>

          {!audio ? (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onAudioUpload(file);
                  e.target.value = "";
                }}
                style={{ display: "none" }}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAudio}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  width: "100%",
                  height: "80px",
                  background: "#FDFAF6",
                  border: "2px dashed rgba(90,60,30,0.25)",
                  borderRadius: "12px",
                  cursor: uploadingAudio ? "default" : "pointer",
                  fontSize: "13px",
                  color: "#9C8573",
                }}
              >
                <Upload size={18} />
                {uploadingAudio ? "Uploading…" : "Click to upload audio file (MP3, M4A, WAV, etc.)"}
              </button>
            </>
          ) : (
            <div
              style={{
                background: "#FDFAF6",
                border: "1px solid rgba(90,60,30,0.12)",
                borderRadius: "12px",
                padding: "12px 16px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    background: "rgba(212,169,106,0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Mic size={18} color="#D4A96A" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: 500,
                      color: "#1A1410",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {audio.name}
                  </div>
                  <div style={{ fontSize: "11px", color: "#9C8573", marginTop: "2px" }}>
                    Audio file attached
                  </div>
                </div>
                <button
                  onClick={onRemoveAudio}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#C4B19A",
                    display: "flex",
                    alignItems: "center",
                    padding: "4px",
                    borderRadius: "4px",
                  }}
                >
                  <XIcon size={16} />
                </button>
              </div>
            </div>
          )}
        </div>

        <label style={{ ...labelStyle, marginBottom: "6px" }}>Notes (Optional)</label>
        <textarea
          value={body}
          onChange={(e) => onBodyChange(e.target.value)}
          placeholder="Write meeting notes here or leave blank if using audio only…"
          rows={10}
          style={{ ...inputBase, resize: "vertical", lineHeight: 1.7, marginBottom: "20px" }}
        />

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
          <span style={{ fontSize: "14px", fontWeight: 500, color: "#1A1410" }}>Action items</span>
          <button
            onClick={onAddAction}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              background: "none",
              border: "1px solid rgba(90,60,30,0.18)",
              borderRadius: "6px",
              height: "26px",
              padding: "0 10px",
              fontSize: "12px",
              color: "#6B5744",
              cursor: "pointer",
            }}
          >
            <Plus size={12} />
            Add item
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {actions.map((action) => (
            <div
              key={action.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                background: "#FDFAF6",
                borderRadius: "8px",
                border: "1px solid rgba(90,60,30,0.10)",
                padding: "8px 12px",
              }}
            >
              <div
                style={{
                  width: "14px",
                  height: "14px",
                  borderRadius: "50%",
                  border: "2px solid rgba(90,60,30,0.20)",
                  flexShrink: 0,
                }}
              />
              <input
                value={action.text}
                onChange={(e) => onUpdateAction(action.id, "text", e.target.value)}
                placeholder="Action item"
                style={{ flex: 2, background: "none", border: "none", outline: "none", fontSize: "13px", color: "#1A1410" }}
              />
              <input
                value={action.assignee}
                onChange={(e) => onUpdateAction(action.id, "assignee", e.target.value)}
                placeholder="Assignee"
                style={{ flex: 1, background: "none", border: "none", outline: "none", fontSize: "12px", color: "#9C8573" }}
              />
              <button
                onClick={() => onRemoveAction(action.id)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#C4B19A",
                  display: "flex",
                  alignItems: "center",
                  padding: 0,
                  flexShrink: 0,
                }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          {actions.length === 0 && (
            <div style={{ fontSize: "13px", color: "#9C8573", padding: "10px 0" }}>
              No action items yet. Click &quot;Add item&quot; to add one.
            </div>
          )}
        </div>
      </div>

      <div
        style={{
          borderTop: "1px solid rgba(90,60,30,0.12)",
          background: "#EDE3D4",
          padding: "12px 32px",
          display: "flex",
          gap: "8px",
          justifyContent: "flex-end",
          flexShrink: 0,
        }}
      >
        <button
          onClick={onCancel}
          disabled={isSaving}
          style={{
            background: "#F5EFE6",
            border: "1px solid rgba(90,60,30,0.18)",
            borderRadius: "8px",
            height: "32px",
            padding: "0 16px",
            fontSize: "13px",
            color: "#6B5744",
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
        <button
          onClick={onPublish}
          disabled={isSaving}
          style={{
            background: "#D4A96A",
            border: "none",
            borderRadius: "8px",
            height: "32px",
            padding: "0 20px",
            fontSize: "13px",
            color: "white",
            cursor: isSaving ? "default" : "pointer",
            fontWeight: 500,
            opacity: isSaving ? 0.7 : 1,
          }}
        >
          {isSaving ? "Saving…" : isCreate ? "Publish" : "Save changes"}
        </button>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  fontSize: "11px",
  color: "#9C8573",
  display: "block",
  marginBottom: "4px",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
};
