"""
Messaging Routes - WhatsApp Conversations, Contacts, Messages
"""
from fastapi import APIRouter, HTTPException, Request
from typing import Dict
from functions.whatsapp_handlers import handle_whatsapp_incoming, whatsapp_send_message
from functions.handle_whatsapp_response import handle_whatsapp_response
from functions.classify_conversations import classify_single_conversation, classify_all_conversations

# Create router
messaging_router = APIRouter(prefix="/api", tags=["messaging"])

# This will be set by the main app
db = None
WHATSAPP_SERVICE_URL = None

def init_messaging_routes(database, whatsapp_url):
    """Initialize messaging routes with database and WhatsApp URL"""
    global db, WHATSAPP_SERVICE_URL
    db = database
    WHATSAPP_SERVICE_URL = whatsapp_url

# ============================================
# MESSAGING ENDPOINTS
# ============================================

@messaging_router.get("/conversations")
async def get_conversations(color: str = None):
    """Get all conversations, optionally filtered by color"""
    try:
        query = {}
        if color:
            query['color_code'] = color
        
        conversations = await db.conversations.find(query, {'_id': 0}).sort('last_message_at', -1).to_list(None)
        return conversations
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@messaging_router.get("/conversations/{conversation_id}")
async def get_conversation(conversation_id: str):
    """Get a specific conversation"""
    try:
        conversation = await db.conversations.find_one({'id': conversation_id}, {'_id': 0})
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
        return conversation
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@messaging_router.get("/conversations/{conversation_id}/messages")
async def get_conversation_messages(conversation_id: str, limit: int = 50):
    """Get messages for a conversation"""
    try:
        messages = await db.messages.find(
            {'conversation_id': conversation_id}, {'_id': 0}
        ).sort('timestamp', -1).limit(limit).to_list(limit)
        
        # Reverse to show oldest first
        messages.reverse()
        return messages
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@messaging_router.post("/conversations/{conversation_id}/send")
async def send_message_to_conversation(conversation_id: str, request: Request):
    """Send a message to a conversation"""
    try:
        data = await request.json()
        message_text = data.get('message', '')
        buttons = data.get('buttons', None)
        
        result = await whatsapp_send_message(
            db,
            WHATSAPP_SERVICE_URL,
            conversation_id,
            message_text,
            buttons
        )
        
        if not result['success']:
            raise HTTPException(status_code=500, detail=result.get('error'))
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@messaging_router.post("/conversations/{conversation_id}/mark-read")
async def mark_conversation_read(conversation_id: str):
    """Mark conversation as read"""
    try:
        await db.conversations.update_one(
            {'id': conversation_id},
            {'$set': {'unread_count': 0}}
        )
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@messaging_router.post("/conversations/classify")
async def classify_conversations():
    """Classify all conversations"""
    try:
        result = await classify_all_conversations(db)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@messaging_router.post("/conversations/{conversation_id}/classify")
async def classify_conversation(conversation_id: str):
    """Classify a single conversation"""
    try:
        result = await classify_single_conversation(db, conversation_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@messaging_router.post("/conversations/button-response")
async def handle_button_response(request: Request):
    """Handle button click response"""
    try:
        data = await request.json()
        result = await handle_whatsapp_response(db, WHATSAPP_SERVICE_URL, data)
        
        if not result['success']:
            raise HTTPException(status_code=500, detail=result.get('error'))
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@messaging_router.post("/whatsapp/webhook")
async def whatsapp_webhook(request: Request):
    """Webhook to receive incoming WhatsApp messages"""
    try:
        message_data = await request.json()
        print(f"📨 Webhook received: {message_data}")
        result = await handle_whatsapp_incoming(db, message_data)
        print(f"✅ Webhook processed: {result}")
        return result
    except Exception as e:
        print(f"❌ Webhook error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@messaging_router.get("/contacts")
async def get_contacts(search: str = None):
    """Get all contacts"""
    try:
        query = {}
        if search:
            query['$or'] = [
                {'name': {'$regex': search, '$options': 'i'}},
                {'phone': {'$regex': search, '$options': 'i'}}
            ]
        
        contacts = await db.contacts.find(query).sort('updated_at', -1).to_list(None)
        return contacts
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
