import type {
  FileVersionAppNotification,
  FileVersionEvent,
} from "@/types/notifications";

/** Maps a file-version event into a notification feed item. */
export function fileVersionToNotification(
  evt: FileVersionEvent
): FileVersionAppNotification {
  const by = evt.uploadedByName?.trim() || "A team member";
  const replaced =
    evt.replacedFileName && evt.replacedFileName !== evt.newFileName
      ? `"${evt.replacedFileName}"`
      : "the previous version";

  return {
    id: evt.id,
    key: `file:${evt.id}:v${evt.version}`,
    type: "file_version",
    title: `New file version in ${evt.projectName}`,
    body: `${by} replaced ${replaced} with "${evt.newFileName}" in ${evt.folderPath}.`,
    requesterName: by,
    projectName: evt.projectName,
    projectId: evt.projectId,
    folderPath: evt.folderPath,
    newFileName: evt.newFileName,
    replacedFileName: evt.replacedFileName,
    createdAt: evt.createdAt,
    actionable: false,
    raw: evt,
  };
}
