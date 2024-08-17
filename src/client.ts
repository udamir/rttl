import type { ClientStatus } from "./types"
import { clientStatus } from "./consts"

/**
 * Abstract client class
 */
 export abstract class Client<T> {
  /**
   * conection path
   */
  public path?: string
  /**
   * connection query
   */
  public query?: string
  /**
   * connection headers
   */
  public headers: { [key: string]: string | string[] | undefined } = {}

  /**
   * client connection status
   */
  public status: ClientStatus = clientStatus.connecting

  /**
   * transport socket
   */
  public socket?: T

  /**
   * Send message to client
   * @param data - payload
   * @param cb - callback on error/complete
   * @returns promise
   */
  public send(data: unknown, cb?: (error?: Error) => void) {
    return this._send(data, cb)
  }

  /**
   * Terminate client connection
   * @param code - termination code
   * @param data - termination reason
   */
  public terminate(code?: number, data?: unknown): void {
    this.status = clientStatus.disconnecting
    this._terminate(code, data)
  }

  protected abstract _send(data: unknown, cb?: (error?: Error) => void): Promise<void>
  protected abstract _terminate(code?: number, data?: unknown): void
}
