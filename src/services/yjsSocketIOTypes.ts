/**
 * Socket.IO Event Types for Yjs Synchronization
 * Compatible with Open WebUI's Socket.IO backend
 */

/**
 * User information for collaboration
 */
export interface UserInfo {
  user_id: string;
  user_name: string;
  user_color: string;
}

/**
 * Join document event payload
 * Event: ydoc:document:join
 */
export interface JoinDocumentPayload {
  document_id: string;
  user_id: string;
  user_name: string;
  user_color: string;
}

/**
 * Document state response
 * Event: ydoc:document:state
 */
export interface DocumentStateResponse {
  document_id: string;
  state: number[];
  sessions: string[];
}

/**
 * Document update payload
 * Event: ydoc:document:update
 */
export interface DocumentUpdatePayload {
  document_id: string;
  user_id: string;
  socket_id?: string;
  update: number[];
  data?: {
    content: {
      md?: string;
      html?: string;
      json?: string;
    };
  };
}

/**
 * Awareness update payload
 * Event: ydoc:awareness:update
 */
export interface AwarenessUpdatePayload {
  document_id: string;
  user_id: string;
  update: number[];
}

/**
 * Leave document payload
 * Event: ydoc:document:leave
 */
export interface LeaveDocumentPayload {
  document_id: string;
  user_id: string;
}

/**
 * Socket.IO event names
 */
export const SOCKET_EVENTS = {
  JOIN: 'ydoc:document:join',
  STATE: 'ydoc:document:state',
  UPDATE: 'ydoc:document:update',
  AWARENESS_UPDATE: 'ydoc:awareness:update',
  LEAVE: 'ydoc:document:leave',
} as const;
