# Rttl
<img alt="npm" src="https://img.shields.io/npm/v/rttl"> <img alt="npm type definitions" src="https://img.shields.io/npm/types/rttl"> <img alt="NPM" src="https://img.shields.io/npm/l/rttl">

Realtime transport layer. Supports websocket (ws) and uWebsocket.js.

# Quick start

## Installation

```
npm install --save rttl
```

## Create websocket server over http(s) or uWebSockets

```ts
import * as http from "http"
import { WebSocketTransport } from "rttl"

const server = new http.Server()
const rtt = new WebSocketTransport({ server })
```

### uWebSockets.js supported
``` ts
import uWebSockets from "uWebsockets.js"
import { uWebSocketTransport } from "rttl"

const server = uWebSockets.App()
const rtt = new uWebSocketTransport({ server })

```

## Add transport event handlers
```ts

// handle client connection event
rtt.onConnection((client) => {
  // ...
})

// handle incoming messages
rtt.onMessage((client, data) => {
  const message = JSON.parse(data)
  // ...
})

// handle client disconnection
rtt.onDisconnect((client: Client<T>, code?: number, data?: any) => {
  // ...
})

// handle errors
rtt.onError((error: Error) => {
  // ...
})
```

## Gracefull shutdown
```ts
rtt.close()
```

## Inject mock client
```ts

// inject mock socket
const ws = wst.inject(`/test?param=1`, { headers: { "test-header": "1234" } })

// handle message events
ws3.onmessage = (event) => {
  const message = JSON.parse(event.data)
  // ...
}

// send message from mock socket
ws.send(JSON.stringify({ type: "text", text: "test"}))
```

# License
MIT
