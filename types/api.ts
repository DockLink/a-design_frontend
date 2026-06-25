export interface ApiErrorBody {
  message?: string | string[];
  statusCode?: number;
  error?: string;
}

export class ApiError extends Error {
  status: number;
  body: ApiErrorBody;

  constructor(status: number, body: ApiErrorBody) {
    const msg = Array.isArray(body.message)
      ? body.message.join(", ")
      : body.message ?? "Request failed";
    super(msg);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}