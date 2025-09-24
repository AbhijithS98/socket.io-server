const { io } = require("socket.io-client");
const { sendLogToRenderer } = require("./utils/logRenderer")
let socket = null;

function connectSocket(io_server_url, apiKey, onJobReceived) {
  sendLogToRenderer("Connecting to bridge-server...")

  socket = io(io_server_url, {
    secure: true,
    transports: ['websocket'], 
    maxHttpBufferSize: 10e6,
    reconnection: true,
    reconnectionAttempts: 3,
    reconnectionDelay: 4000,
    reconnectionDelayMax: 5000,
    timeout: 10000  
  });

  socket.on("connect", () => {
    console.log("-> Connected to socket-io server with id:", socket.id);
    
    socket.emit("register", apiKey, (data) => {
      sendLogToRenderer(`Connected to bridge-server : ${data.ip}`)
    });
  });

  socket.on("perform-job", onJobReceived);

  socket.on("disconnect", (reason) => {
    console.log("-> Socket disconnected:", reason);
    sendLogToRenderer(`Disconnected from bridge-server..!`)
  });

  socket.on("connect_error", (err) => {
    console.error("-> Connection failed:", err.message);
    sendLogToRenderer(`Connection to bridge-server failed: ${err.message}`);
  });

  socket.io.on("reconnect_attempt", (attempt) => {
    console.log("-> Reconnecting attempt:", attempt);
    sendLogToRenderer(`Reconnecting attempt: ${attempt}...`);
  });

  socket.io.on("reconnect_failed", () => {
    console.error("-> Reconnection failed permanently");
    sendLogToRenderer("Reconnection failed. bridge-server may be down..!");
  });

  return socket;
}

function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

function emitJobResponse(response) {
  if (socket) socket.emit("job-response", response);
}

module.exports = { connectSocket, disconnectSocket, emitJobResponse };
