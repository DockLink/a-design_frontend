/**
 * Shared abort registry for in-flight upload jobs.
 * Kept separate so the Zustand store can abort without a circular import
 * on the queue worker module.
 */

const controllers = new Map<string, AbortController>();

export function registerUploadController(
  id: string,
  controller: AbortController
): void {
  controllers.set(id, controller);
}

export function unregisterUploadController(id: string): void {
  controllers.delete(id);
}

/** Abort an in-flight upload; no-op if the job is not running. */
export function abortUploadJob(id: string): void {
  const controller = controllers.get(id);
  if (controller && !controller.signal.aborted) {
    controller.abort();
  }
}
