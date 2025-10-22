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


@messaging_router.delete("/conversations/{conversation_id}")
async def delete_conversation(conversation_id: str):
    """Eliminar una conversación y sus mensajes"""
    try:
        # Eliminar mensajes
        await db.messages.delete_many({'conversation_id': conversation_id})
        
        # Eliminar conversación
        result = await db.conversations.delete_one({'id': conversation_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        return {"success": True, "message": "Conversation deleted"}
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
async def classify_conversation(conversation_id: str, force: bool = False):
    """Classify a single conversation - use force=true to overwrite existing classification"""
    try:
        result = await classify_single_conversation(db, conversation_id, force=force)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@messaging_router.post("/conversations/{conversation_id}/set-classification")
async def set_manual_classification(conversation_id: str, classification: str):
    """Set manual classification (AMARILLO, AZUL, VERDE) - won't be overwritten by auto-classification"""
    try:
        from datetime import datetime, timezone
        
        # Validate classification
        valid_classifications = ['AMARILLO', 'AZUL', 'VERDE']
        if classification not in valid_classifications:
            raise HTTPException(status_code=400, detail=f"Invalid classification. Must be one of: {valid_classifications}")
        
        # Update conversation with manual classification flag
        result = await db.conversations.update_one(
            {'id': conversation_id},
            {
                '$set': {
                    'color_code': classification,
                    'manually_classified': True,  # Flag to prevent auto-overwrite
                    'classified_at': datetime.now(timezone.utc).isoformat(),
                    'updated_at': datetime.now(timezone.utc).isoformat()
                }
            }
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        return {"success": True, "classification": classification}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@messaging_router.delete("/conversations/{conversation_id}/classification")
async def remove_classification(conversation_id: str):
    """Remove classification from conversation"""
    try:
        from datetime import datetime, timezone
        
        # Remove classification and manual flag
        result = await db.conversations.update_one(
            {'id': conversation_id},
            {
                '$unset': {
                    'color_code': '',
                    'manually_classified': '',
                    'classified_at': ''
                },
                '$set': {
                    'updated_at': datetime.now(timezone.utc).isoformat()
                }
            }
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        return {"success": True, "message": "Classification removed"}
    except HTTPException:
        raise
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
        
        contacts = await db.contacts.find(query, {'_id': 0}).sort('updated_at', -1).to_list(None)
        return contacts
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@messaging_router.get("/message-flows")
async def get_message_flows():
    """Get all message flow templates"""
    try:
        # Return predefined templates
        templates = [
            {
                "id": "confirmation-24h",
                "name": "Recordatorio 24h",
                "category": "confirmacion",
                "template": "Hola {nombre}, te recordamos tu cita programada para mañana a las {hora}. ¿Confirmas tu asistencia?"
            },
            {
                "id": "confirmation-1h",
                "name": "Recordatorio 1h",
                "category": "confirmacion",
                "template": "Hola {nombre}, tu cita es en 1 hora. Nos vemos a las {hora}."
            },
            {
                "id": "confirmation-request",
                "name": "Confirmar cita",
                "category": "confirmacion",
                "template": "Hola {nombre}, te escribimos para confirmar tu cita del {fecha} a las {hora}. Por favor responde SI para confirmar."
            },
            {
                "id": "consent-lopd",
                "name": "LOPD",
                "category": "consentimientos",
                "template": "Hola {nombre}, necesitamos que firmes el consentimiento LOPD. Por favor accede a este enlace: {enlace}"
            },
            {
                "id": "consent-health",
                "name": "Cuestionario Salud",
                "category": "consentimientos",
                "template": "Hola {nombre}, por favor completa el cuestionario de salud antes de tu cita: {enlace}"
            },
            {
                "id": "consent-implant",
                "name": "Implante",
                "category": "consentimientos",
                "template": "Hola {nombre}, adjuntamos el consentimiento informado para el tratamiento de implante: {enlace}"
            }
        ]
        return templates
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
