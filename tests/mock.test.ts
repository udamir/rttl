import { ClientStatus, MockTransport, MockSocket, Client, ClientSocketState } from "../src"

let wst: MockTransport

const initEnv = () => {
  wst = new MockTransport()
}

const closeEnv = async () => {
  return wst.close()
}

describe("Mock transport test 1", () => {
  beforeAll(initEnv)
  afterAll(closeEnv)

  let ws1: MockSocket
  let client1: Client<MockSocket>

  test(`ws1 client should connect to server`, (done) => {
    wst.onConnection((client) => {
      client1 = client
      expect(wst.clients.has(client)).toBe(true)
      expect(client.status).toBe(ClientStatus.connected)
      done()
    })
    ws1 = wst.inject()
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
    client1.send(JSON.stringify(msg), (err) => expect(err).toBeUndefined())
  })

  test("WS server should get disconnect event from ws1", (done) => {
    wst.onDisconnect((client, code, data) => {
      expect(code).toBe(4001)
      expect(data).toBe("test")
      expect(client).toBe(client1)
      expect(client.status).toBe(ClientStatus.disconnected)
      done()
    })
    ws1.close(4001, "test")
  })

  test("WS server should have 0 clients", () => {
    expect(wst.clients.size).toBe(0)    
  })
})

describe("Mock transport test 2", () => {
  beforeAll(initEnv)
  afterAll(closeEnv)

  let ws2: MockSocket
  let client2: Client<MockSocket>

  test(`ws2 client should connect to server to path with query and headers`, (done) => {
    wst.onConnection((client) => {
      client2 = client
      expect(wst.clients.has(client)).toBe(true)
      expect(client.path).toBe("/test")
      expect(client.query).toBe("param=1")
      expect(client.headers).toMatchObject({ "test-header": "1234" })
      expect(client.status).toBe(ClientStatus.connected)
    })

    ws2 = wst.inject("/test?param=1", { headers: { "test-header": "1234" } })

    ws2.onopen = (event) => {
      expect(event.type).toBe("open")
      expect(client2).not.toBeUndefined()
      expect(ws2.readyState).toBe(ClientSocketState.OPEN)
      done()
    }
  })

  test("ws2 server should connection termination from server", (done) => {
    wst.onDisconnect((client, code, data) => {
      expect(code).toEqual(4001)
      expect(data).toEqual("test")
      expect(client.status).toBe(ClientStatus.disconnected)
    })

    ws2.onclose = (event: any) => {
      expect(event.code).toBe(4001)
      expect(event.reason).toBe("test")
      expect(ws2.readyState).toBe(ClientSocketState.CLOSED)
      done()
    }
    client2.terminate(4001, "test")
  })
})
