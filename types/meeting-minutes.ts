export type ActionItemStatus = "PENDING" | "COMPLETED";

export interface MeetingActionItem {
  text: string;
  assignee: string;
  dueDate: string;
  status: ActionItemStatus;
}

export interface MeetingAudioFile {
  id: string;
  url: string;
}

export interface MeetingMinute {
  id: string;
  projectId: string;
  title: string;
  meetingDate: string;
  attendees: string[];
  body?: string | null;
  actionItems?: MeetingActionItem[] | null;
  audio_files?: MeetingAudioFile[];
  createdById?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface MeetingMinutesListResponse {
  data: MeetingMinute[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ActionItemInput {
  text: string;
  assignee: string;
  dueDate: string;
  status?: ActionItemStatus;
}

export interface CreateMeetingMinutePayload {
  title: string;
  meeting_date: string;
  attendees: string[];
  body?: string;
  action_items?: ActionItemInput[];
  /** Floating storage file ids (tokens) returned from the upload endpoint. */
  audio_files?: string[];
}

export interface UpdateMeetingMinutePayload {
  title?: string;
  meeting_date?: string;
  attendees?: string[];
  body?: string;
  action_items?: ActionItemInput[];
  /** On update the backend expects an array of objects with the storage file id. */
  audio_files?: { id: string }[];
}
