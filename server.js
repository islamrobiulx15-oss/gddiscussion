const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PUBLIC = path.join(__dirname, 'public');
const RECORDINGS = path.join(__dirname, 'recordings');
if (!fs.existsSync(RECORDINGS)) fs.mkdirSync(RECORDINGS, { recursive: true });

app.use(express.static(PUBLIC));
app.use('/recordings', express.static(RECORDINGS));
app.use(express.json());

// In-memory room store: { room -> { code, mode, createdAt } }
const rooms = new Map();

app.post('/create-room', (req, res) => {
  const { room, code, mode } = req.body || {};
  if (!room) return res.status(400).json({ error: 'room required' });
  rooms.set(room, { code: code || null, mode: mode || 'practice', createdAt: Date.now() });
  res.json({ link: `/join.html?room=${encodeURIComponent(room)}` });
});

app.get('/room-info', (req, res) => {
  const room = req.query.room;
  if (!room) return res.status(400).json({ error: 'room required' });
  const info = rooms.get(room);
  if (!info) return res.status(404).json({ error: 'not found' });
  res.json({ requiresCode: !!info.code, mode: info.mode });
});

app.post('/validate-room', (req, res) => {
  const { room, code, name, role } = req.body || {};
  if (!room) return res.status(400).json({ error: 'room required' });
  const info = rooms.get(room);
  if (!info) return res.status(404).json({ error: 'not found' });
  if (info.code && info.code !== code) return res.status(403).json({ error: 'invalid code' });
  res.json({ ok: true });
});

const storage = multer.diskStorage({
  destination: RECORDINGS,
  filename: (req, file, cb) => {
    const room = req.body.room || 'unknown';
    const ts = Date.now();
    const name = `${room}-${ts}-${file.originalname}`.replace(/[^a-zA-Z0-9-_.]/g, '_');
    cb(null, name);
  }
});
const upload = multer({ storage });

app.post('/upload', upload.single('recording'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'no file' });
  const url = `/recordings/${req.file.filename}`;
  res.json({ url });
});

io.on('connection', (socket) => {
  socket.on('join-room', ({ room, name, role }) => {
    socket.join(room);
    socket.data.room = room;
    socket.data.name = name;
    socket.data.role = role;

    const clients = Array.from(io.sockets.adapter.rooms.get(room) || []);
    const otherClients = clients.filter((id) => id !== socket.id);
    socket.emit('joined', { id: socket.id, peers: otherClients });
    socket.to(room).emit('peer-joined', { id: socket.id, name, role });
  });

  socket.on('signal', ({ to, data }) => {
    io.to(to).emit('signal', { from: socket.id, data });
  });

  socket.on('disconnect', () => {
    const room = socket.data.room;
    if (room) socket.to(room).emit('peer-left', { id: socket.id });
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
