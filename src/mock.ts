import { ClientSocketState, MockSocket } from "./types"
import { Client } from "./client"

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
    setTimeout(() => this.socket.close(code, reason), this.connectionDelay)
  }
}
