# Rttl
<img alt="npm" src="https://img.shields.io/npm/v/rtt"> <img alt="npm type definitions" src="https://img.shields.io/npm/types/rtt"> <img alt="NPM" src="https://img.shields.io/npm/l/rtt">

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
const wst = new WebSocketTransport({ server })

// uWebSockets.js supported
// import uWebSockets from "uWebsockets.js"
//
// const server = uWebSockets.App()
// const wst = new uWebSocketTransport({ server })

```

# License
MIT
