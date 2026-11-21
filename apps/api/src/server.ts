import http from "http";
import { env, validateEnv } from "./config/env.js";
import { createApp } from "./bootstrap/createApp.js";
import { setupSocket } from "./socket/setupSocket.js";

validateEnv();

const app = createApp();
const server = http.createServer(app);
setupSocket(server);

server.listen(env.port, () => {
  console.log(`PneumoDetect Express API + Socket.IO listening on http://localhost:${env.port}`);
});
