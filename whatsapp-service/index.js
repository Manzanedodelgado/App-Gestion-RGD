const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const QRCode = require('qrcode');
const cors = require('cors');
const { Client, LocalAuth } = require('whatsapp-web.js');

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

// Initialize WhatsApp Client
const client = new Client({
  authStrategy: new LocalAuth({
    dataPath: '/tmp/.wwebjs_auth'
  }),
  puppeteer: {
    headless: true,
    executablePath: '/usr/bin/chromium',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu'
    ]
  }
});

// WhatsApp events
client.on('qr', async (qr) => {
  console.log('QR Code received');
  qrCode = await QRCode.toDataURL(qr);
  io.emit('qr', qrCode);
});

client.on('ready', () => {
  console.log('WhatsApp Client is ready!');
  isReady = true;
  clientInfo = {
    pushname: client.info.pushname,
    wid: client.info.wid._serialized
  };
  qrCode = null;
  io.emit('ready', clientInfo);
});

client.on('authenticated', () => {
  console.log('WhatsApp Client authenticated');
});

client.on('auth_failure', (msg) => {
  console.error('Authentication failed:', msg);
});

client.on('disconnected', (reason) => {
  console.log('WhatsApp Client disconnected:', reason);
  isReady = false;
  clientInfo = null;
  io.emit('disconnected');
});

// Initialize WhatsApp client
async function initializeWhatsApp() {
  console.log('Initializing WhatsApp Client...');
  try {
    await client.initialize();
  } catch (error) {
    console.error('Error initializing WhatsApp:', error);
  }
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

  if (!isReady) {
    return res.status(503).json({ error: 'WhatsApp client not ready' });
  }

  try {
    // Format number properly (add @c.us if not present)
    const chatId = number.includes('@') ? number : `${number}@c.us`;
    await client.sendMessage(chatId, message);
    console.log(`✅ Message sent to ${number}`);
    res.json({ success: true, message: 'Message sent successfully' });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message', details: error.message });
  }
});

app.get('/chats', async (req, res) => {
  if (!isReady) {
    return res.status(503).json({ error: 'WhatsApp client not ready' });
  }

  try {
    const allChats = await client.getChats();
    chats = allChats.map(chat => ({
      id: chat.id._serialized,
      name: chat.name,
      isGroup: chat.isGroup,
      unreadCount: chat.unreadCount,
      timestamp: chat.timestamp
    }));
    res.json(chats);
  } catch (error) {
    console.error('Error getting chats:', error);
    res.status(500).json({ error: 'Failed to get chats' });
  }
});

app.get('/messages/:chatId', async (req, res) => {
  if (!isReady) {
    return res.status(503).json({ error: 'WhatsApp client not ready' });
  }

  try {
    const chat = await client.getChatById(req.params.chatId);
    const chatMessages = await chat.fetchMessages({ limit: 50 });
    const formattedMessages = chatMessages.map(msg => ({
      id: msg.id._serialized,
      body: msg.body,
      from: msg.from,
      to: msg.to,
      timestamp: msg.timestamp,
      fromMe: msg.fromMe
    }));
    res.json(formattedMessages);
  } catch (error) {
    console.error('Error getting messages:', error);
    res.status(500).json({ error: 'Failed to get messages' });
  }
});

app.post('/logout', async (req, res) => {
  try {
    await client.logout();
    isReady = false;
    qrCode = null;
    clientInfo = null;
    res.json({ success: true });
  } catch (error) {
    console.error('Error logging out:', error);
    res.status(500).json({ error: 'Failed to logout' });
  }
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
  console.log(`WhatsApp service running on port ${PORT}`);
  console.log('Inicializando cliente de WhatsApp...');
  console.log('Para conectar, escanea el código QR que aparecerá en la interfaz web');
  initializeWhatsApp();
});