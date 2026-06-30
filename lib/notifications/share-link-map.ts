import type {
  ShareLinkAppNotification,
  ShareLinkEvent,
} from "@/types/notifications";

/** Maps a share-link creation event into a notification feed item. */
export function shareLinkToNotification(
  evt: ShareLinkEvent
): ShareLinkAppNotification {
  const by = evt.createdByName?.trim() || "A team member";
  const fileLabel = evt.fileName ? `"${evt.fileName}"` : "a file";
  const access = evt.allowDownload ? "view & download" : "view-only";
  const expiry = evt.expiresAt
    ? `Expires ${new Date(evt.expiresAt).toLocaleDateString("en-US", {
        dateStyle: "medium",
      })}`
    : "Never expires";

  return {
    id: evt.id,
    key: `share:${evt.id}`,
    type: "share_link",
    title: `New share link in ${evt.projectName}`,
    body: `${by} created a ${access} share link for ${fileLabel}. ${expiry}.`,
    requesterName: by,
    projectName: evt.projectName,
    projectId: evt.projectId,
    fileId: evt.fileId,
    fileName: evt.fileName,
    allowDownload: evt.allowDownload,
    expiresAt: evt.expiresAt,
    createdAt: evt.createdAt,
    actionable: false,
    raw: evt,
  };
}
