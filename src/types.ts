import type { errorCode, clientStatus, clientSocketState } from "./consts"

export type ClientSocketState = typeof clientSocketState[keyof typeof clientSocketState]
export type ClientStatus = typeof clientStatus[keyof typeof clientStatus]
export type ErrorCode = typeof errorCode[keyof typeof errorCode]

export interface IClientInjectParams {
  connectionDelay?: number
  headers?: { [key: string]: string | string[] | undefined }
}

export interface MockSocket {
  readyState: ClientSocketState

  onopen: (event: { type: "open" }) => void
  onerror: (event: { type: "error", message: string, error: any }) => void
  onclose: (event: { type: "close", code: number, reason: string }) => void
  onmessage: (event: { type: "message", data: any }) => void
  close: (code?: number, reason?: string) => void
  send: (data: any) => void
}
