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

const noop = () => { /**/ }

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
  public status: ClientStatus = ClientStatus.connecting

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
  public send(data: any, cb?: (error?: Error) => void) {
    return this._send(data, cb)
  }

  /**
   * Terminate client connection
   * @param code - termination code
   * @param data - termination reason
   */
  public terminate(code?: number, data?: any): void {
    this.status = ClientStatus.disconnecting
    this._terminate(code, data)
  }

  protected abstract _send(data: any, cb?: (error?: Error) => void): Promise<void>
  protected abstract _terminate(code?: number, data?: any): void
}

/**
 * Abstarct class for Transport
 */
export abstract class Transport<T> {
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
  public onMessage(cb: (client: Client<T>, data: any) => void) {
    this.handlers.message = cb
  }

  /**
   * Register handler for client disconnection event
   * @param cb - disconnection handler
   */
  public onDisconnect(cb: (client: Client<T>, code?: number, data?: any) => void) {
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
}
