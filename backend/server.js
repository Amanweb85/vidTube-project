// const { mergeVideoAudio, createDataArray } = require("./helper.js");
const express = require("express");
const http = require('http');
const { WebSocketServer } = require('ws');
const cors = require("cors");
const path = require("path");
const dotenv = require('dotenv');
dotenv.config(); // Load environment variables from .env file

const app = express();
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Serve all static files from the 'frontend' directory
const frontendPath = path.join(__dirname, '../frontend');
app.use(express.static(frontendPath));

app.get('/', (req, res) => {
  console.log("rendering file")
  res.sendFile(path.join(frontendPath, "vid.html"))
});

app.use("/", (req, res, next) => {
  console.log(req.url)
  next();
})
// Create the HTTP server
const server = http.createServer(app);

// Create the WebSocket server and attach it to the HTTP server
const wss = new WebSocketServer({ server });
module.exports = { wss };

const videoRoutes = require('./routes/videoRoutes');

app.use("/api", videoRoutes); // Use the video routes for all request

// catch-all route 
// app.use((req, res) => {
//   console.log("page not found")
//   res.send('Page not found! 404');
// });

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log("server is running on port http://localhost:", PORT);
});




