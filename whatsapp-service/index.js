const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const QRCode = require('qrcode');
const cors = require('cors');
const axios = require('axios');
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
          
          const messageData = {
            from: msg.key.remoteJid,
            body: msg.message.conversation || msg.message.extendedTextMessage?.text || '',
            type: msg.message.audioMessage ? 'audio' : 'text',
            timestamp: msg.messageTimestamp,
            pushname: msg.pushName || msg.key.remoteJid.split('@')[0]
          };
          
          // Emit to socket
          io.emit('message', messageData);
          
          // Send to backend webhook for processing
          try {
            await axios.post('http://localhost:8001/api/whatsapp/webhook', messageData);
            console.log('✅ Message sent to backend webhook');
          } catch (error) {
            console.error('❌ Error sending to webhook:', error.message);
          }
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

  if (!isReady || !sock) {
    return res.status(503).json({ error: 'WhatsApp client not ready' });
  }

  try {
    // Format number properly for Baileys (add @s.whatsapp.net if not present)
    const jid = number.includes('@') ? number : `${number}@s.whatsapp.net`;
    await sock.sendMessage(jid, { text: message });
    console.log(`✅ Message sent to ${number}`);
    res.json({ success: true, message: 'Message sent successfully' });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message', details: error.message });
  }
});

app.get('/chats', async (req, res) => {
  if (!isReady || !sock) {
    return res.status(503).json({ error: 'WhatsApp client not ready' });
  }

  try {
    // Get all chats from Baileys
    const allChats = await sock.groupFetchAllParticipating();
    const personalChats = Object.values(allChats).filter(chat => !chat.id.endsWith('@g.us'));
    
    chats = personalChats.map(chat => ({
      id: chat.id,
      name: chat.subject || chat.id.split('@')[0],
      isGroup: false,
      unreadCount: 0,
      timestamp: Date.now()
    }));
    
    res.json(chats);
  } catch (error) {
    console.error('Error getting chats:', error);
    res.status(500).json({ error: 'Failed to get chats' });
  }
});

app.get('/messages/:chatId', async (req, res) => {
  if (!isReady || !sock) {
    return res.status(503).json({ error: 'WhatsApp client not ready' });
  }

  try {
    // Baileys doesn't have a built-in way to fetch message history easily
    // For now, return empty array. In production, you'd store messages in a database
    res.json([]);
  } catch (error) {
    console.error('Error getting messages:', error);
    res.status(500).json({ error: 'Failed to get messages' });
  }
});

app.post('/logout', async (req, res) => {
  try {
    if (sock) {
      await sock.logout();
    }
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
  console.log('Inicializando cliente de WhatsApp con Baileys...');
  console.log('Para conectar, escanea el código QR que aparecerá en la interfaz web');
  connectToWhatsApp().catch(err => console.error('Error connecting to WhatsApp:', err));
});