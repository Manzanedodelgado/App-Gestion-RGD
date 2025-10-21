const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const QRCode = require('qrcode');
const cors = require('cors');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');

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

let sock = null;
let isReady = false;
let qrCode = null;
let clientInfo = null;
let chats = [];

// Initialize WhatsApp with Baileys
async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState('/tmp/baileys_auth');
  
  sock = makeWASocket({
    auth: state,
    printQRInTerminal: false
  });

  // Save credentials on update
  sock.ev.on('creds.update', saveCreds);

  // Connection update event
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    // Handle QR code
    if (qr) {
      console.log('QR Code received');
      qrCode = await QRCode.toDataURL(qr);
      io.emit('qr', qrCode);
    }

    // Handle connection status
    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect?.error instanceof Boom)
        ? lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut
        : true;
      
      console.log('Connection closed. Reconnecting:', shouldReconnect);
      isReady = false;
      clientInfo = null;
      io.emit('disconnected');
      
      if (shouldReconnect) {
        setTimeout(() => connectToWhatsApp(), 3000);
      }
    } else if (connection === 'open') {
      console.log('WhatsApp connected successfully!');
      isReady = true;
      qrCode = null;
      
      // Get user info
      const user = sock.user;
      clientInfo = {
        pushname: user.name || 'Usuario',
        wid: user.id
      };
      
      io.emit('ready', clientInfo);
    }
  });

  // Handle incoming messages
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type === 'notify') {
      for (const msg of messages) {
        if (!msg.key.fromMe && msg.message) {
          console.log('New message received:', msg.key.remoteJid);
          io.emit('message', {
            from: msg.key.remoteJid,
            body: msg.message.conversation || msg.message.extendedTextMessage?.text || '',
            timestamp: msg.messageTimestamp
          });
        }
      }
    }
  });
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