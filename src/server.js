require("dotenv").config();
const express = require("express");
const connectDB = require("./config/db");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
connectDB();

app.use(cors());
app.use(express.json());

// Mount auth routes
app.use("/api/auth", require("./routes/auth"));
// Test protected endpoint
app.use("/api/test", require("./routes/test"));
// Task CRUD routes
app.use("/api/tasks", require("./routes/tasks"));

// Fetches the last 20 actions

const auth = require("./middleware/auth");
app.get("/api/actions", auth, async (req, res) => {
  const Action = require("./models/ActionLog");
  const logs = await Action.find()
    .sort({ createdAt: -1 })
    .limit(20)
    .populate("user", "email name")
    .populate("task", "title");
  res.json(logs);
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

// Makes io socket available in routes via req.app.get('io')
app.set("io", io);

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);
  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
