import * as http from "node:http"
import WebSocket from "ws"

import { type Client, type MockSocket, WebsocketTransport } from "../src"
import { clientStatus } from "../src/consts"

const port = 3000
let wst: WebsocketTransport
let server: http.Server

const initEnv = () => {
  server = new http.Server()
  wst = new WebsocketTransport({ server })

  server.listen(port)
}

const closeEnv = async () => {
  await wst.close()
  server.close()
}

describe("Websocket transport test 1", () => {
  beforeAll(initEnv)
  afterAll(closeEnv)

  let ws1: WebSocket
  let client1: Client<WebSocket>

  test("ws1 client should connect to server", (done) => {

    wst.onConnection((client) => {
      client1 = client
      expect(wst.clients.has(client)).toBe(true)
      expect(client.status).toBe(clientStatus.connected)
      done()
    })
    ws1 = new WebSocket(`ws://localhost:${port}`)
  })

  test("WS server should get message from ws1", (done) => {
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
    client1.send(JSON.stringify(msg), (err) => expect([null, undefined]).toContain(err))
  })

  test("WS server should get disconnect event from ws1", (done) => {
    wst.onDisconnect((client, code, data) => {
      expect(code).toBe(4001)
      expect(data).toBe("test")
      expect(client).toBe(client1)
      expect(client.status).toBe(clientStatus.disconnecting)
      done()
    })
    ws1.close(4001, "test")
  })

  test("WS server should have 0 clients", () => {
    expect(wst.clients.size).toBe(0)    
  })
})

describe("Websocket transport test 2", () => {
  beforeAll(initEnv)
  afterAll(closeEnv)

  let ws2: WebSocket
  let client2: Client<WebSocket>

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
    ws2.onclose = (event) => {
      expect(event.code).toBe(4001)
      expect(event.reason).toBe("test")
      expect(ws2.readyState).toBe(WebSocket.CLOSED)
      done()
    }
    client2.terminate(4001, "test")
  })
})

describe("Websocket transport test 3", () => {
  beforeAll(initEnv)
  afterAll(closeEnv)

  let ws3: MockSocket
  let client3: Client<WebSocket>

  test("Mock client should inject to path with query and headers", (done) => {
    wst.onConnection((client) => {
      client3 = client
      expect(wst.clients.has(client)).toBe(true)
      expect(client.path).toBe("/test")
      expect(client.query).toBe("param=1")
      expect(client.headers).toMatchObject({ "test-header": "1234" })
      expect(client.status).toBe(clientStatus.connected)
      done()
    })
    ws3 = wst.inject(`ws://localhost:${port}/test?param=1`, { headers: { "test-header": "1234" } })
  })

  test("WS server should get message from mock client", (done) => {
    const msg = { type: "text", text: "test" }
    wst.onMessage((client, data: any) => {
      const message = JSON.parse(data)
      expect(message).toMatchObject(msg)
      expect(client).toBe(client3)
      done()
    })
    ws3.onopen = (() => {
      ws3.send(JSON.stringify({ type: "text", text: "test"}))
    })
  })

  test("Mock client should get message from server", (done) => {
    const msg = { type: "text", text: "test 2" }
    ws3.onmessage = (event) => {
      const message = JSON.parse(event.data as string)
      expect(message).toMatchObject(msg)
      done()
    }
    client3.send(JSON.stringify(msg), (err) => expect(err).toBeUndefined())
  })

  test("Mock client should get close event on termination from server", (done) => {
    ws3.onclose = (event) => {
      expect(event.code).toBe(4001)
      expect(event.reason).toBe("test")
      expect(ws3.readyState).toBe(WebSocket.CLOSED)
      done()
    }
    client3.terminate(4001, "test")
  })
})
