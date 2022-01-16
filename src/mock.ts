import { Client, Transport } from "./transport"

const noop = () => { /**/ }

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

export class MockTransport extends Transport<MockSocket> {
  public close(cb?: (error?: Error) => void): Promise<void> {
    return Promise.resolve(cb && cb())
  }
}

export class MockClient extends Client<MockSocket> {

  constructor(public socket: MockSocket, url: string, public headers = {}, private connectionDelay = 5) {
    super()
    const parsedUrl = new URL(url, "ws://localhost/")
    this.path = parsedUrl.pathname
    this.query = parsedUrl.search.slice(1)
  }

  protected _send(data: any, cb?: (error?: Error) => void): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        this.socket.onmessage({ type: "message", data })
        return resolve(cb && cb())
      }, this.connectionDelay)
    })
  }

  protected _terminate(code = 1006, reason?: any): void {
    this.socket.readyState = ClientSocketState.CLOSING
    setTimeout(() => {
      this.socket.readyState = ClientSocketState.CLOSED
      this.socket.onclose({ type: "close", code, reason })
    }, this.connectionDelay)
  }
}
