import {
  Archive,
  File,
  FileSpreadsheet,
  FileText,
  Image,
} from "lucide-react";

const EXT_MAP: Record<string, { color: string; icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }> }> = {
  pdf:  { color: "#DC2626", icon: FileText },
  dwg:  { color: "#2563EB", icon: File },
  dxf:  { color: "#2563EB", icon: File },
  skp:  { color: "#EA580C", icon: File },
  png:  { color: "#059669", icon: Image },
  jpg:  { color: "#059669", icon: Image },
  jpeg: { color: "#059669", icon: Image },
  gif:  { color: "#059669", icon: Image },
  webp: { color: "#059669", icon: Image },
  zip:  { color: "#6B7280", icon: Archive },
  rar:  { color: "#6B7280", icon: Archive },
  "7z": { color: "#6B7280", icon: Archive },
  xlsx: { color: "#217346", icon: FileSpreadsheet },
  xls:  { color: "#217346", icon: FileSpreadsheet },
  csv:  { color: "#217346", icon: FileSpreadsheet },
  doc:  { color: "#1B5EAB", icon: FileText },
  docx: { color: "#1B5EAB", icon: FileText },
};

export function FileTypeIcon({ ext, size = 16 }: { ext: string; size?: number }) {
  const cfg = EXT_MAP[ext.toLowerCase()] ?? { color: "#9C8573", icon: File };
  const Icon = cfg.icon;
  return <Icon size={size} style={{ color: cfg.color, flexShrink: 0 }} />;
}
