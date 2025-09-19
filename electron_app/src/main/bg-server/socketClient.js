const { io } = require("socket.io-client");
const { sendLogToRenderer } = require("./utils/logRenderer")
let socket = null;

function connectSocket(io_server_url, clientId, onJobReceived) {
  sendLogToRenderer("Connecting to server ...")
  socket = io(io_server_url, {
    secure: true,
    transports: ['websocket'], 
    maxHttpBufferSize: 10e6 
  });

  socket.on("connect", () => {
    console.log("-> Connected to relay with id:", socket.id);
    sendLogToRenderer(`Connected to server with id ${socket.id}`)
    socket.emit("register", clientId);
  });

  socket.on("perform-job", onJobReceived);

  socket.on("disconnect", (reason) => {
    console.log("-> Socket disconnected:", reason);
    sendLogToRenderer(`Disconnected from server`)
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
