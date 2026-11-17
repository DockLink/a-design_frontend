import { authApiClient } from "@/lib/api/authenticated-client";
import type { Task } from "@/types/tasks";

export function isActiveTaskable(task: Pick<Task, "status">): boolean {
  return task.status !== "INACTIVE";
}

/** Collect target + descendants (children first) for soft-delete cascade. */
export function collectTaskableTreeIds(root: Task & { children?: Task[] }): string[] {
  const ids: string[] = [];

  function walk(node: Task & { children?: Task[] }) {
    for (const child of node.children ?? []) {
      if (!isActiveTaskable(child)) continue;
      walk(child);
    }
    if (isActiveTaskable(node)) ids.push(node.id);
  }

  walk(root);
  return ids;
}

export async function softDeleteTaskableTree(taskId: string): Promise<string[]> {
  const detail = await authApiClient<Task & { children?: Task[] }>(
    `/tasks/${taskId}?include_children=true`
  );
  const ids = collectTaskableTreeIds(detail);

  for (const id of ids) {
    await authApiClient<Task>(`/tasks/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "INACTIVE" }),
    });
  }

  return ids;
}
