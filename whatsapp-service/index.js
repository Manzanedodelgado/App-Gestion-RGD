const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const QRCode = require('qrcode');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

let isReady = false;
let qrCode = null;
let clientInfo = null;
let chats = [];
let messages = {};

// Generate a stable QR code
async function generateQR() {
  const qrData = 'whatsapp://connect?code=' + Math.random().toString(36).substring(7);
  qrCode = await QRCode.toDataURL(qrData);
  return qrCode;
}

// Initialize mock data
async function initializeMockData() {
  console.log('Initializing WhatsApp service (Mock Mode)...');
  await generateQR();
  io.emit('qr', qrCode);
}

// REST API endpoints
app.get('/status', (req, res) => {
  res.json({
    ready: isReady,
    hasQR: qrCode !== null,
    info: clientInfo
  });
});

app.get('/qr', (req, res) => {
  if (qrCode) {
    res.json({ qr: qrCode });
  } else {
    res.json({ qr: null });
  }
});

app.post('/send-message', async (req, res) => {
  const { number, message } = req.body;
  
  if (!number || !message) {
    return res.status(400).json({ error: 'Number and message are required' });
  }

  console.log(`[MOCK] Sending message to ${number}: ${message}`);
  res.json({ success: true, message: 'Message sent (mock mode)' });
});

app.get('/chats', async (req, res) => {
  res.json(chats);
});

app.get('/messages/:chatId', async (req, res) => {
  const chatMessages = messages[req.params.chatId] || [];
  res.json(chatMessages);
});

app.post('/logout', async (req, res) => {
  isReady = false;
  qrCode = null;
  clientInfo = null;
  await generateQR();
  res.json({ success: true });
});

// Socket.IO connection
io.on('connection', (socket) => {
  console.log('Client connected to socket');
  
  if (qrCode) {
    socket.emit('qr', qrCode);
  }
  
  if (isReady) {
    socket.emit('ready', clientInfo);
  }

  socket.on('disconnect', () => {
    console.log('Client disconnected from socket');
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`WhatsApp service running on port ${PORT} (Mock Mode)`);
  console.log('NOTA: Este es un modo de demostración.');
  console.log('Para conectar WhatsApp real, necesitarás escanear el QR con tu teléfono.');
  initializeMockData();
});