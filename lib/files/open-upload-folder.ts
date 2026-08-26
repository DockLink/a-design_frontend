/** Window event used by the upload queue to navigate to a destination folder. */
export const OPEN_UPLOAD_FOLDER_EVENT = "adesign:open-upload-folder";

export interface OpenUploadFolderDetail {
  projectId: string;
  folderPath: string;
}

export function dispatchOpenUploadFolder(
  projectId: string,
  folderPath: string
): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<OpenUploadFolderDetail>(OPEN_UPLOAD_FOLDER_EVENT, {
      detail: { projectId, folderPath },
    })
  );
}
