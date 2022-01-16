import { ClientStatus, MockTransport, IClientSocket, Client, ClientSocketState } from "../src"

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

  let ws1: IClientSocket
  let client1: Client<IClientSocket>

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
    wst.onMessage((client, data: any) => {
      const message = JSON.parse(data)
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
    wst.onDisconnect((client, code?: number, data?: any) => {
      expect(code).toBe(4001)
      expect(data).toBe("test")
      expect(client).toBe(client1)
      expect(client.status).toBe(ClientStatus.disconnecting)
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

  let ws2: IClientSocket
  let client2: Client<IClientSocket>

  test(`ws2 client should connect to server to path with query and headers`, (done) => {
    wst.onConnection((client) => {
      client2 = client
      expect(wst.clients.has(client)).toBe(true)
      expect(client.path).toBe("/test")
      expect(client.query).toBe("param=1")
      expect(client.headers).toMatchObject({ "test-header": "1234" })
      expect(client.status).toBe(ClientStatus.connected)
      done()
    })
    ws2 = wst.inject("/test?param=1", { headers: { "test-header": "1234" } })
  })

  test("ws2 server should connection termination from server", (done) => {
    ws2.onclose = (event: any) => {
      expect(event.code).toBe(4001)
      expect(event.reason).toBe("test")
      expect(ws2.readyState).toBe(ClientSocketState.CLOSED)
      done()
    }
    client2.terminate(4001, "test")
  })
})
