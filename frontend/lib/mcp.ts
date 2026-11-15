/** Types and fetch helpers for user-connected MCP servers. */

import { authFetch } from "./api";

export const MCP_CHANGED_EVENT = "kael-mcp-changed";

export type McpToolInfo = {
  name: string;
  title: string;
  description: string;
  read_only: boolean;
  destructive: boolean;
  input_schema: Record<string, unknown>;
};

export type McpServerStatus =
  | "new"
  | "connected"
  | "auth_required"
  | "error";

export type McpServerInfo = {
  id: string;
  name: string;
  url: string;
  auth_type: string;
  enabled: boolean;
  allow_write: boolean;
  status: McpServerStatus;
  last_error: string | null;
  protocol_version: string | null;
  tools: McpToolInfo[];
  tools_updated_at: number | null;
  oauth_available: boolean;
  created_at: number;
  updated_at: number;
};

export type McpAuthMode = "auto" | "none" | "bearer" | "oauth";

export type McpCreateInput = {
  url: string;
  name?: string;
  auth: McpAuthMode;
  token?: string;
};

export type McpToolRequest = {
  call_id: string;
  server_id: string;
  server_name: string;
  tool: string;
  title: string;
  description: string;
  arguments: Record<string, unknown>;
  requires_approval: boolean;
};

export type McpTraceEntry = {
  server_id: string;
  server_name: string;
  tool: string;
  status: "ok" | "error" | "denied";
  duration_ms: number;
  error: string | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isMcpTool(value: unknown): value is McpToolInfo {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.name === "string" &&
    typeof value.title === "string" &&
    typeof value.description === "string" &&
    typeof value.read_only === "boolean" &&
    typeof value.destructive === "boolean" &&
    isRecord(value.input_schema)
  );
}

export function isMcpServerInfo(value: unknown): value is McpServerInfo {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.url === "string" &&
    typeof value.auth_type === "string" &&
    typeof value.enabled === "boolean" &&
    typeof value.allow_write === "boolean" &&
    (value.status === "new" ||
      value.status === "connected" ||
      value.status === "auth_required" ||
      value.status === "error") &&
    (value.last_error === null || typeof value.last_error === "string") &&
    (value.protocol_version === null ||
      typeof value.protocol_version === "string") &&
    Array.isArray(value.tools) &&
    value.tools.every(isMcpTool) &&
    (value.tools_updated_at === null ||
      typeof value.tools_updated_at === "number") &&
    typeof value.oauth_available === "boolean" &&
    typeof value.created_at === "number" &&
    typeof value.updated_at === "number"
  );
}

async function errorDetail(
  response: Response,
  fallback: string,
): Promise<string> {
  try {
    const body: unknown = await response.json();
    if (isRecord(body) && typeof body.detail === "string" && body.detail) {
      return body.detail;
    }
  } catch {
    // Not a JSON error response.
  }
  return fallback;
}

export function notifyMcpChanged(): void {
  window.dispatchEvent(new Event(MCP_CHANGED_EVENT));
}

export async function fetchMcpServers(): Promise<McpServerInfo[]> {
  const response = await authFetch("/api/mcp/servers");

  if (!response.ok) {
    throw new Error(
      await errorDetail(response, `HTTP ${response.status}`),
    );
  }

  const body: unknown = await response.json();
  if (
    !isRecord(body) ||
    !Array.isArray(body.servers) ||
    !body.servers.every(isMcpServerInfo)
  ) {
    throw new Error("Unexpected MCP server list response.");
  }

  return body.servers;
}

export async function createMcpServer(
  input: McpCreateInput,
): Promise<{ server: McpServerInfo; authorization_url: string | null }> {
  const response = await authFetch("/api/mcp/servers", {
    method: "POST",
    body: JSON.stringify({
      url: input.url,
      auth: input.auth,
      ...(input.name ? { name: input.name } : {}),
      ...(input.token ? { token: input.token } : {}),
    }),
  });

  if (!response.ok) {
    throw new Error(
      await errorDetail(response, `HTTP ${response.status}`),
    );
  }

  const body: unknown = await response.json();
  if (
    !isRecord(body) ||
    !isMcpServerInfo(body.server) ||
    (body.authorization_url !== null &&
      typeof body.authorization_url !== "string")
  ) {
    throw new Error("Unexpected MCP server response.");
  }

  return {
    server: body.server,
    authorization_url: body.authorization_url,
  };
}

export async function updateMcpServer(
  id: string,
  patch: {
    name?: string;
    enabled?: boolean;
    allow_write?: boolean;
    token?: string;
    clear_token?: boolean;
  },
): Promise<McpServerInfo> {
  const response = await authFetch(
    `/api/mcp/servers/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      body: JSON.stringify(patch),
    },
  );

  if (!response.ok) {
    throw new Error(
      await errorDetail(response, `HTTP ${response.status}`),
    );
  }

  const body: unknown = await response.json();
  if (!isMcpServerInfo(body)) {
    throw new Error("Unexpected MCP server response.");
  }
  return body;
}

export async function deleteMcpServer(id: string): Promise<void> {
  const response = await authFetch(
    `/api/mcp/servers/${encodeURIComponent(id)}`,
    { method: "DELETE" },
  );

  if (!response.ok) {
    throw new Error(
      await errorDetail(response, `HTTP ${response.status}`),
    );
  }
}

export async function checkMcpServer(id: string): Promise<McpServerInfo> {
  const response = await authFetch(
    `/api/mcp/servers/${encodeURIComponent(id)}/check`,
    { method: "POST" },
  );

  if (!response.ok) {
    throw new Error(
      await errorDetail(response, `HTTP ${response.status}`),
    );
  }

  const body: unknown = await response.json();
  if (!isMcpServerInfo(body)) {
    throw new Error("Unexpected MCP server response.");
  }
  return body;
}

export async function connectMcpServer(id: string): Promise<string> {
  const response = await authFetch(
    `/api/mcp/servers/${encodeURIComponent(id)}/connect`,
    { method: "POST" },
  );

  if (!response.ok) {
    throw new Error(
      await errorDetail(response, `HTTP ${response.status}`),
    );
  }

  const body: unknown = await response.json();
  if (!isRecord(body) || typeof body.authorization_url !== "string") {
    throw new Error("Unexpected MCP authorization response.");
  }
  return body.authorization_url;
}

/** Hide query strings from server URLs before rendering them. */
export function mcpHost(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.host;
  } catch {
    return url;
  }
}
