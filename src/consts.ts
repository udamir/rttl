export const errorCode = {
  NormalClose: 1000,
  JoinError: 4000,
  Unathorized: 4001,
  Reconnection: 4002,
  ReservationExpired: 4003,
  RoomNotFound: 4004,
  ConnectionTimeout: 4005,
} as const

export const clientSocketState = {
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3,
} as const

export const clientStatus = {
  connecting: 0,
  connected: 1,
  disconnecting: 2,
  disconnected: 3,
}

export const noop = () => { /**/ }
