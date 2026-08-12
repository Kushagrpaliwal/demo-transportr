import { io } from "socket.io-client";

const URL = "https://transportrapi.sdstesting.co.uk";

export const socket = io(URL, {
  autoConnect: true,
  transports: ["polling", "websocket"],

  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,

  timeout: 20000,
});
