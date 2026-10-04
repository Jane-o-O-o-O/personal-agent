export type TaskStatus = 'queued' | 'running' | 'paused' | 'waiting_approval' | 'waiting_user' | 'waiting_external' | 'succeeded' | 'failed' | 'cancelled';
export interface Task {
  id: string; title: string; prompt: string; status: TaskStatus; channel: string;
  goalId?: string; scheduledFor?: string; sessionFile?: string; result?: string; error?: string;
  waitingReason?: string; version: number; runCount: number;
  createdAt: string; updatedAt: string; startedAt?: string; finishedAt?: string;
}
export interface Message {
  id: string; taskId: string; role: 'user' | 'assistant' | 'system'; text: string;
  status: 'streaming' | 'complete' | 'error'; createdAt: string;
}
export interface Operation {
  id: string; taskId: string; toolCallId: string; name: string; parameters: unknown;
  status: 'running' | 'succeeded' | 'failed' | 'cancelled'; result?: unknown;
  startedAt: string; finishedAt?: string;
}
export interface Approval {
  id: string; taskId: string; action: string; parameters: unknown; parametersHash: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired' | 'cancelled'; version: number;
  createdAt: string; expiresAt: string; decidedAt?: string;
}
export interface Artifact {
  id: string; taskId: string; name: string; mimeType: string; size: number; createdAt: string;
}
export interface TaskDetail { task: Task; messages: Message[]; operations: Operation[]; artifacts: Artifact[]; approvals: Approval[] }
export interface Memory { id: string; content: string; source: string; version: number; createdAt: string; updatedAt: string }
export type Schedule = { type: 'once'; at: string } | { type: 'daily'; time: string } | { type: 'interval'; minutes: number };
export interface Goal {
  id: string; title: string; prompt: string; schedule: Schedule; enabled: boolean;
  maxRuns: number; runCount: number; nextRunAt: string | null; version: number;
  createdAt: string; updatedAt: string;
}
export interface IntegrationField {
  name: string; label: string; type: 'text' | 'password' | 'number' | 'select' | 'boolean' | 'textarea';
  required?: boolean; options?: { value: string; label: string }[]; placeholder?: string;
}
export interface Integration {
  id: string; name: string; description: string;
  status: 'unconfigured' | 'configured' | 'connected' | 'error' | 'requires_reauth';
  capabilities: string[]; config: Record<string, unknown>; secretFields: Record<string, boolean>;
  fields: IntegrationField[]; lastCheckedAt?: string; lastError?: string;
}
export type EcosystemStatus = 'reference' | 'archived' | 'available' | 'needs_credentials' | 'enabled';
export interface EcosystemItem {
  id: string; name: string; platform: string; category: string; kind: string; description: string;
  status: EcosystemStatus; installable: boolean; enabled: boolean;
  sourceUrl?: string; sourceType?: string; version?: string; access?: string; limitations?: string[];
  capabilities: string[]; fields: IntegrationField[]; configuredFields: Record<string, boolean>;
  integrationId?: string;
  lastCheckedAt?: string; lastError?: string; toolCount?: number;
}
export interface ModelState { configured: boolean; provider: string; model: string; baseUrl: string }
export interface BrowserTab { id: string; title: string; url: string }
export interface BrowserDialog { type: string; message: string; defaultPrompt?: string }
export interface BrowserState {
  status: 'stopped' | 'starting' | 'ready' | 'error'; owner: 'none' | 'agent' | 'user'; generation: number;
  revision?: number; transportError?: string;
  taskId?: string; tabs: BrowserTab[]; activeTabId?: string;
  viewport: { width: number; height: number }; dialog?: BrowserDialog; error?: string;
}
export interface BrowserFrame { type: 'frame'; data: string; mimeType: string; width: number; height: number; generation: number }
export interface BrowserInput {
  generation: number; tabId?: string; type: 'click' | 'move' | 'mouse_down' | 'mouse_up' | 'scroll' | 'text' | 'key';
  x?: number; y?: number; deltaX?: number; deltaY?: number; text?: string; key?: string; code?: string; modifiers?: number;
  button?: 'left' | 'middle' | 'right'; buttons?: number; clickCount?: number;
}
export interface AppEvent { id: number; type: string; entityId: string; taskId?: string; createdAt: string; payload: unknown }
export interface Bootstrap {
  cursor: number; model: ModelState; tasks: Task[]; integrations: Integration[];
  pendingApprovals: Approval[]; browser: BrowserState;
}
export interface WeixinLogin {
  status: 'unconfigured' | 'qr_pending' | 'scanned' | 'verification_required' | 'connected' | 'expired' | 'error' | 'requires_reauth';
  qrcodeUrl?: string; qrcodeImage?: string; verificationUrl?: string; message?: string; expiresAt?: string;
}
