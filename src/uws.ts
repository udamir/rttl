import type { WebSocket, TemplatedApp } from "uWebSockets.js"

import { Transport } from "./transport"
import { clientStatus } from "./consts"
import { Client } from "./client"

export interface uWebsocketOptions {
  maxPayloadLength?: number
  idleTimeout?: number
  compression?: number
  maxBackpressure?: number
}

export interface UpgradeParametes {
  url: string
  query: string
  headers: Record<string, string>
  connection: {
    remoteAddress: string
  }
}

export class uWebSocketClient extends Client<WebSocket<UpgradeParametes>> {

  constructor(public socket: WebSocket<UpgradeParametes>) {
    super()
    const params = socket.getUserData();
    this.path = params.url
    this.headers = params.headers
    this.query = params.query
  }

  public _send(data: any, cb?: (error?: Error) => void): Promise<void> {
    this.socket.send(data, false, false)
    return Promise.resolve(cb?.())
  }

  public _terminate(code?: number, data?: string) {
    this.socket.end(code, data)
  }
}

export class uWebsocketTransport extends Transport<WebSocket<UpgradeParametes>> {
  public app: TemplatedApp
  private _clients: WeakMap<WebSocket<UpgradeParametes>, uWebSocketClient> = new WeakMap()

  constructor(options: uWebsocketOptions & { server: TemplatedApp }) {
    super()

    const { server, ...wsOptions } = options
    this.app = server

    this.app.ws("/*", {
      ...wsOptions,

      upgrade: (res, req, context) => {
        // get all headers
        const headers: {[id: string]: string} = {}
        req.forEach((key, value) => { headers[key] = value })

        const upgradeParams: UpgradeParametes = {
          url: req.getUrl(),
          query: req.getQuery() ?? "",

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

      open: async (ws: WebSocket<UpgradeParametes>) => {
        const client = new uWebSocketClient(ws)
        client.status = clientStatus.connected
        this._clients.set(ws, client)
        this.clients.add(client)
        this.handlers.connection(client)
      },

      close: (ws: WebSocket<UpgradeParametes>, code: number, message: ArrayBuffer) => {
        const client = this._clients.get(ws)
        if (!client) { return }
        this.clients.delete(client)
        this._clients.delete(ws)
        client.status = clientStatus.disconnecting
        this.handlers.disconnect(client, code, Buffer.from(message.slice(0)).toString())
        client.status = clientStatus.disconnected
      },

      message: (ws: WebSocket<UpgradeParametes>, message: ArrayBuffer, isBinary: boolean) => {
        const client = this._clients.get(ws)
        this.handlers.message(client, Buffer.from(message.slice(0)), isBinary)
      },
    })
  }

  public close(cb?: (error?: Error) => void): Promise<void> {
    return Promise.resolve(cb?.())
  }
}
