import * as uws from "uWebSockets.js"
import WebSocket from "ws"

import { type Client, type UpgradeParametes, uWebsocketTransport } from "../src"
import { clientStatus } from "../src/consts"

const port = 3001
let wst: uWebsocketTransport
let server: uws.TemplatedApp & { listener?: any }

const initEnv = () => {
  server = uws.App()
  wst = new uWebsocketTransport({ server })

  server.listen(port, (listener) => {
    server.listener = listener
  })
}

const closeEnv = async () => {
  await wst.close()
  if (server.listener) {
    uws.us_listen_socket_close(server.listener)
  }
}

describe("uWebsocket transport test 1", () => {
  beforeAll(initEnv)
  afterAll(closeEnv)

  let ws1: WebSocket
  let client1: Client<uws.WebSocket<UpgradeParametes>>

  test("ws1 client should connect to server", (done) => {

    wst.onConnection((client) => {
      client1 = client
      expect(wst.clients.has(client)).toBe(true)
      expect(client.status).toBe(clientStatus.connected)
      done()
    })
    ws1 = new WebSocket(`ws://localhost:${port}`)
  })

  test("uWS server should get message from ws1", (done) => {
    const msg = { type: "text", text: "test" }
    wst.onMessage((client, data) => {
      const message = JSON.parse(data.toString())
      expect(message).toMatchObject(msg)
      expect(client).toBe(client1)
      done()
    })
    ws1.onopen = (() => {
      ws1.send(JSON.stringify({ type: "text", text: "test"}))
    })
  })

  test("ws1 client should get message from server", (done) => {
    const msg = { type: "text", text: "test 2" }
    ws1.onmessage = (event) => {
      const message = JSON.parse(event.data as string)
      expect(message).toMatchObject(msg)
      done()
    }
    client1.send(JSON.stringify(msg), (err) => expect(err).toBeUndefined())
  })

  test("uWS server should get disconnect event from ws1", (done) => {
    wst.onDisconnect((client, code, data) => {
      expect(code).toBe(4001)
      expect(data).toBe("test")
      expect(client).toBe(client1)
      expect(client.status).toBe(clientStatus.disconnecting)
      done()
    })
    ws1.close(4001, "test")
  })

  test("uWS server should have 0 clients", () => {
    expect(wst.clients.size).toBe(0)    
  })
})

describe("uWebsocket transport test 2", () => {
  beforeAll(initEnv)
  afterAll(closeEnv)

  let ws2: WebSocket
  let client2: Client<uws.WebSocket<{}>>

  test("ws2 client should connect to server to path with query and headers", (done) => {
    wst.onConnection((client) => {
      client2 = client
      expect(wst.clients.has(client)).toBe(true)
      expect(client.path).toBe("/test")
      expect(client.query).toBe("param=1")
      expect(client.headers).toMatchObject({ "test-header": "1234" })
      expect(client.status).toBe(clientStatus.connected)
      done()
    })
    ws2 = new WebSocket(`ws://localhost:${port}/test?param=1`, { headers: { "test-header": "1234" } })
  })

  test("ws2 server should connection termination from server", (done) => {
    ws2.onclose = (event: any) => {
      expect(event.code).toBe(4001)
      expect(event.reason).toBe("test")
      expect(ws2.readyState).toBe(WebSocket.CLOSED)
      done()
    }
    client2.terminate(4001, "test")
  })
})
