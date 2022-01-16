export enum ErrorCode {
  NormalClose = 1000,
  JoinError = 4000,
  Unathorized = 4001,
  Reconnection = 4002,
  ReservationExpired = 4003,
  RoomNotFound = 4004,
  ConnectionTimeout = 4005,
}

export enum ClientStatus {
  connecting = 0,
  connected = 1,
  disconnecting = 2,
  disconnected = 3,
}

export interface IClientInjectParams {
  connectionDelay?: number
  headers?: { [key: string]: string | string[] | undefined }
}

export enum ClientSocketState {
  CONNECTING = 0,
  OPEN = 1,
  CLOSING = 2,
  CLOSED = 3,
}

export interface MockSocket {
  readyState: ClientSocketState

  onopen: (event: { type: "open" }) => void
  onerror: (event: { type: "error", message: string, error: any }) => void
  onclose: (event: { type: "close", code: number, reason: any}) => void
  onmessage: (event: { type: "message", data: any }) => void
  close: (code?: number, reason?: string) => void
  send: (data: any) => void
}
