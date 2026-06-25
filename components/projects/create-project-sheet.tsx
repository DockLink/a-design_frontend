"use client";

import { useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateProject } from "@/hooks/use-create-project";
import { useAuth } from "@/hooks/use-auth";
import type { CreateProjectStageInput } from "@/types/projects";

export function CreateProjectSheet({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated?: (projectId: string) => void;
}) {
  const { createProject } = useCreateProject();
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [duration, setDuration] = useState("P3M");
  const [location, setLocation] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [stages, setStages] = useState<CreateProjectStageInput[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!open) return null;

  function addStageRow() {
    setStages((prev) => [
      ...prev,
      {
        name: "",
        start_date: startDate ? new Date(startDate).toISOString() : new Date().toISOString(),
        duration: "P30D",
        order: prev.length,
      },
    ]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !clientName.trim() || !startDate) {
      toast.error("Name, client, and start date are required");
      return;
    }

    setIsSubmitting(true);
    try {
      const project = await createProject(
        {
          name: name.trim(),
          description: description.trim() || undefined,
          start_date: new Date(startDate).toISOString(),
          duration,
          location: location.trim() || undefined,
          client: {
            name: clientName.trim(),
            contact_email: clientEmail.trim() || undefined,
          },
        },
        {
          stages: stages.filter((s) => s.name.trim()),
          memberUserId: user?.id,
        }
      );
      toast.success("Project created");
      onCreated?.(project.id);
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create project");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.12)", zIndex: 29 }} />
      <aside
        style={{
          position: "fixed",
          right: 0,
          top: "52px",
          width: "420px",
          height: "calc(100vh - 52px)",
          background: "#FDFAF6",
          borderLeft: "1px solid rgba(90,60,30,0.12)",
          zIndex: 30,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(90,60,30,0.12)", display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: "17px", fontWeight: 500 }}>New project</span>
          <button type="button" onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer" }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: "14px" }}>
          <div className="space-y-2">
            <Label htmlFor="proj-name">Project name</Label>
            <Input id="proj-name" value={name} onChange={(e) => setName(e.target.value)} className="bg-[#F5EFE6]" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="proj-desc">Description / brief</Label>
            <textarea
              id="proj-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              style={{ width: "100%", borderRadius: "8px", border: "1px solid rgba(90,60,30,0.15)", background: "#F5EFE6", padding: "8px 10px", fontSize: "13px" }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="proj-start">Start date</Label>
            <Input id="proj-start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-[#F5EFE6]" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="proj-duration">Duration (ISO, e.g. P3M)</Label>
            <Input id="proj-duration" value={duration} onChange={(e) => setDuration(e.target.value)} className="bg-[#F5EFE6]" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="proj-location">Location</Label>
            <Input id="proj-location" value={location} onChange={(e) => setLocation(e.target.value)} className="bg-[#F5EFE6]" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="client-name">Client name</Label>
            <Input id="client-name" value={clientName} onChange={(e) => setClientName(e.target.value)} className="bg-[#F5EFE6]" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="client-email">Client email</Label>
            <Input id="client-email" type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} className="bg-[#F5EFE6]" />
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <Label>Stages (optional)</Label>
              <button type="button" onClick={addStageRow} style={{ background: "none", border: "none", color: "#C9894A", cursor: "pointer", fontSize: "12px", display: "flex", alignItems: "center", gap: "4px" }}>
                <Plus size={12} /> Add stage
              </button>
            </div>
            {stages.map((stage, idx) => (
              <div key={idx} style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                <Input
                  placeholder="Stage name"
                  value={stage.name}
                  onChange={(e) => setStages((rows) => rows.map((r, i) => (i === idx ? { ...r, name: e.target.value } : r)))}
                  className="bg-[#F5EFE6]"
                />
                <button type="button" onClick={() => setStages((rows) => rows.filter((_, i) => i !== idx))} style={{ background: "none", border: "none", cursor: "pointer" }}>
                  <Trash2 size={14} color="#8E8E93" />
                </button>
              </div>
            ))}
          </div>

          <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: "8px" }}>
            <Button type="submit" disabled={isSubmitting} className="h-9 w-full bg-[#D4A96A] hover:bg-[#C4956A]">
              {isSubmitting ? "Creating…" : "Create project"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose} className="h-9 w-full">
              Cancel
            </Button>
          </div>
        </form>
      </aside>
    </>
  );
}
