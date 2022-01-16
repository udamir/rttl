import type { WebSocket, TemplatedApp } from "uWebSockets.js"
import { Client, ClientStatus, Transport } from "./transport"

export interface WebsocketOptions {
  maxPayloadLength?: number
  idleTimeout?: number
  compression?: number
  maxBackpressure?: number
}

export class uWebSocketClient extends Client<WebSocket> {

  constructor(public socket: WebSocket) {
    super()
    this.path = socket.url
    this.headers = socket.headers
    this.query = socket.query
  }

  public _send(data: any, cb?: (error?: Error) => void): Promise<void> {
    this.socket.send(data, false, false)
    return Promise.resolve(cb && cb())
  }

  public _terminate(code?: number, data?: string) {
    this.socket.end(code, data)
  }
}

export class uWebsocketTransport extends Transport<WebSocket> {
  public app: TemplatedApp
  private _clients: WeakMap<WebSocket, uWebSocketClient> = new WeakMap()

  constructor(options: WebsocketOptions & { server: TemplatedApp }) {
    super()

    const { server, ...wsOptions } = options
    this.app = server

    this.app.ws("/*", {
      ...wsOptions,

      upgrade: (res, req, context) => {
        // get all headers
        const headers: {[id: string]: string} = {}
        req.forEach((key, value) => headers[key] = value)

        const upgradeParams = {
          url: req.getUrl(),
          query: req.getQuery(),

          headers,
          connection: {
            remoteAddress: Buffer.from(res.getRemoteAddressAsText()).toString(),
          },
        }
        /* This immediately calls open handler, you must not use res after this call */
        /* Spell these correctly */
        res.upgrade(
          upgradeParams,
          req.getHeader("sec-websocket-key"),
          req.getHeader("sec-websocket-protocol"),
          req.getHeader("sec-websocket-extensions"),
          context,
        )
      },

      open: async (ws: WebSocket) => {
        const client = new uWebSocketClient(ws)
        client.status = ClientStatus.connected
        this._clients.set(ws, client)
        this.clients.add(client)
        this.handlers.connection(client)
      },

      close: (ws: WebSocket, code: number, message: ArrayBuffer) => {
        const client = this._clients.get(ws)!
        this.clients.delete(client)
        this._clients.delete(ws)
        client.status = ClientStatus.disconnecting
        this.handlers.disconnect(client, code, Buffer.from(message.slice(0)).toString())
        client.status = ClientStatus.disconnected
      },

      message: (ws: WebSocket, message: ArrayBuffer, isBinary: boolean) => {
        const client = this._clients.get(ws)!

        this.handlers.message(client, Buffer.from(message.slice(0)).toString())
      },
    })
  }

  public close(cb?: (error?: Error) => void): Promise<void> {
    return Promise.resolve(cb && cb())
  }
}
