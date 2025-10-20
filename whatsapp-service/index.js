const { Client, LocalAuth } = require('whatsapp-web.js');
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

let client;
let isReady = false;
let qrCode = null;
let clientInfo = null;
let isInitializing = false;

// Initialize WhatsApp client
function initializeClient() {
  if (isInitializing) {
    console.log('Client is already initializing...');
    return;
  }
  
  isInitializing = true;
  console.log('Starting WhatsApp client initialization...');
  
  client = new Client({
    authStrategy: new LocalAuth({
      dataPath: './.wwebjs_auth'
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
        '--single-process',
        '--disable-gpu'
      ]
    }
  });

  client.on('qr', async (qr) => {
    console.log('QR RECEIVED');
    qrCode = await QRCode.toDataURL(qr);
    io.emit('qr', qrCode);
    isReady = false;
  });

  client.on('ready', async () => {
    console.log('Client is ready!');
    isReady = true;
    qrCode = null;
    clientInfo = client.info;
    io.emit('ready', clientInfo);
  });

  client.on('authenticated', () => {
    console.log('AUTHENTICATED');
    io.emit('authenticated');
  });

  client.on('auth_failure', (msg) => {
    console.error('AUTHENTICATION FAILURE', msg);
    io.emit('auth_failure', msg);
    isReady = false;
  });

  client.on('disconnected', (reason) => {
    console.log('Client was disconnected', reason);
    isReady = false;
    qrCode = null;
    clientInfo = null;
    io.emit('disconnected', reason);
  });

  client.on('message', async (message) => {
    io.emit('message', {
      from: message.from,
      body: message.body,
      timestamp: message.timestamp,
      hasMedia: message.hasMedia,
      type: message.type,
      id: message.id._serialized
    });
  });

  client.initialize();
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
  if (!isReady) {
    return res.status(400).json({ error: 'WhatsApp client not ready' });
  }

  const { number, message } = req.body;
  
  if (!number || !message) {
    return res.status(400).json({ error: 'Number and message are required' });
  }

  try {
    const chatId = number.includes('@c.us') ? number : `${number}@c.us`;
    await client.sendMessage(chatId, message);
    res.json({ success: true });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/chats', async (req, res) => {
  if (!isReady) {
    return res.status(400).json({ error: 'WhatsApp client not ready' });
  }

  try {
    const chats = await client.getChats();
    const chatList = await Promise.all(chats.map(async (chat) => {
      const lastMessage = chat.lastMessage;
      return {
        id: chat.id._serialized,
        name: chat.name,
        isGroup: chat.isGroup,
        timestamp: chat.timestamp,
        unreadCount: chat.unreadCount,
        lastMessage: lastMessage ? {
          body: lastMessage.body,
          timestamp: lastMessage.timestamp,
          fromMe: lastMessage.fromMe
        } : null
      };
    }));
    res.json(chatList);
  } catch (error) {
    console.error('Error getting chats:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/messages/:chatId', async (req, res) => {
  if (!isReady) {
    return res.status(400).json({ error: 'WhatsApp client not ready' });
  }

  try {
    const chat = await client.getChatById(req.params.chatId);
    const messages = await chat.fetchMessages({ limit: 50 });
    
    const messageList = messages.map(msg => ({
      id: msg.id._serialized,
      body: msg.body,
      fromMe: msg.fromMe,
      timestamp: msg.timestamp,
      type: msg.type,
      hasMedia: msg.hasMedia
    }));
    
    res.json(messageList);
  } catch (error) {
    console.error('Error getting messages:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/logout', async (req, res) => {
  if (client) {
    await client.logout();
    await client.destroy();
    isReady = false;
    qrCode = null;
    clientInfo = null;
    res.json({ success: true });
  } else {
    res.status(400).json({ error: 'No active session' });
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
  initializeClient();
});