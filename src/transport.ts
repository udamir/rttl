import { ClientSocketState, ClientStatus, IClientInjectParams, MockSocket } from "./types"
import { Client } from "./client"
import { MockClient } from "./mock"

const noop = () => { /**/ }

/**
 * Abstarct class for Transport
 */
export abstract class Transport<T = any> {
  public clients: Set<Client<T>> = new Set()

  protected handlers: any = {
    connection: noop,
    disconnect: noop,
    message: noop,
    error: noop,
  }

  /**
   * Register handler for client connection event
   * @param cb - connection handler
   */
  public onConnection(cb: (client: Client<T>) => void): void {
    this.handlers.connection = cb
  }

  /**
   * Register handler for client message event
   * @param cb - message handler
   */
  public onMessage(cb: (client: Client<T>, data: Buffer, isBinary: boolean) => void) {
    this.handlers.message = cb
  }

  /**
   * Register handler for client disconnection event
   * @param cb - disconnection handler
   */
  public onDisconnect(cb: (client: Client<T>, code: number, data: string) => void) {
    this.handlers.disconnect = cb
  }

  /**
   * Register handler for error event
   * @param cb - error handler
   */
  public onError(cb: (error: Error) => void): void {
    this.handlers.error = cb
  }

  /**
   * @abstract
   * Gracefull shutdown
   * @param cb - error handler
   */
  public abstract close(cb?: (error?: Error) => void): Promise<void>

  /**
   * Inject mock client
   * @param url - connection url
   * @param params.connectionDelay - connection deleay (optional)
   * @param params.headers - connection headers (optional)
   */
  public inject(url: string = "/", params: IClientInjectParams = {}) {
    const { headers, connectionDelay } = params

    const socket: MockSocket = {
      readyState: ClientSocketState.OPEN,

      onopen: noop,
      onerror: noop,
      onclose: noop,
      onmessage: noop,

      send: (data: any) => {
        this.handlers.message(client, data)
      },

      close: (code: number = 0, reason: string = "") => {
        client.status = ClientStatus.disconnecting
        setTimeout(() => {
          this.handlers.disconnect(client, code, reason)
          client.status = ClientStatus.disconnected
          this.clients.delete(client)
        }, connectionDelay)
      },
    }
    const client: Client<any> = new MockClient(socket, url, headers, connectionDelay)

    setTimeout(() => socket.onopen({ type: "open" }), connectionDelay)

    client.status = ClientStatus.connected
    this.clients.add(client)
    this.handlers.connection(client)
    return socket
  }
}

export class MockTransport extends Transport<MockSocket> {
  public close(cb?: (error?: Error) => void): Promise<void> {
    return Promise.resolve(cb && cb())
  }
}
