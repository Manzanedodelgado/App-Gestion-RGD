"""
WhatsApp Message Handler
Handles incoming messages, creates contacts, conversations and messages
"""
from datetime import datetime, timezone
from typing import Dict
import uuid

async def handle_whatsapp_incoming(db, message_data: Dict):
    """
    Handle incoming WhatsApp message
    Creates or updates Contact, Conversation and Message
    """
    try:
        # Extract message information
        from_number = message_data.get('from', '').split('@')[0]
        message_text = message_data.get('body', '')
        message_type = message_data.get('type', 'text')
        timestamp = message_data.get('timestamp', datetime.now(timezone.utc).timestamp())
        
        # 1. Find or create Contact
        contact = await db.contacts.find_one({'phone': from_number}, {'_id': 0})
        
        if not contact:
            # Create new contact
            contact = {
                'id': str(uuid.uuid4()),
                'phone': from_number,
                'name': message_data.get('pushname', from_number),
                'whatsapp_id': message_data.get('from'),
                'created_at': datetime.now(timezone.utc).isoformat(),
                'updated_at': datetime.now(timezone.utc).isoformat()
            }
            await db.contacts.insert_one(contact)
            print(f"✅ New contact created: {contact['name']}")
        else:
            # Update last interaction
            await db.contacts.update_one(
                {'id': contact['id']},
                {'$set': {'updated_at': datetime.now(timezone.utc).isoformat()}}
            )
        
        # 2. Find or create Conversation
        conversation = await db.conversations.find_one({'contact_id': contact['id']}, {'_id': 0})
        
        if not conversation:
            # Create new conversation
            conversation = {
                'id': str(uuid.uuid4()),
                'contact_id': contact['id'],
                'contact_name': contact['name'],
                'contact_phone': contact['phone'],
                'color_code': None,  # Will be classified by IA
                'last_message': message_text,
                'last_message_at': datetime.fromtimestamp(timestamp).isoformat(),
                'unread_count': 1,
                'created_at': datetime.now(timezone.utc).isoformat(),
                'updated_at': datetime.now(timezone.utc).isoformat()
            }
            await db.conversations.insert_one(conversation)
            print(f"✅ New conversation created with {contact['name']}")
        else:
            # Update conversation
            await db.conversations.update_one(
                {'id': conversation['id']},
                {
                    '$set': {
                        'last_message': message_text,
                        'last_message_at': datetime.fromtimestamp(timestamp).isoformat(),
                        'updated_at': datetime.now(timezone.utc).isoformat()
                    },
                    '$inc': {'unread_count': 1}
                }
            )
        
        # 3. Save Message
        message = {
            'id': str(uuid.uuid4()),
            'conversation_id': conversation['id'],
            'contact_id': contact['id'],
            'from_me': False,
            'message_type': message_type,
            'text': message_text,
            'media_url': message_data.get('media_url'),
            'timestamp': datetime.fromtimestamp(timestamp).isoformat(),
            'transcription': None,  # Will be filled if it's audio
            'created_at': datetime.now(timezone.utc).isoformat()
        }
        await db.messages.insert_one(message)
        print(f"✅ Message saved: {message_text[:50]}...")
        
        # 4. Auto-transcribe if audio
        if message_type in ['audio', 'voice']:
            from functions.transcribe_audio import transcribe_audio
            await transcribe_audio(db, message['id'], message_data.get('media_url'))
        
        # 5. Classify conversation (async)
        from functions.classify_conversations import classify_single_conversation
        await classify_single_conversation(db, conversation['id'])
        
        return {
            'success': True,
            'contact_id': contact['id'],
            'conversation_id': conversation['id'],
            'message_id': message['id']
        }
        
    except Exception as e:
        print(f"❌ Error handling incoming message: {e}")
        import traceback
        traceback.print_exc()
        return {'success': False, 'error': str(e)}


async def whatsapp_send_message(db, whatsapp_service_url: str, conversation_id: str, message_text: str, buttons: list = None):
    """
    Send message to WhatsApp contact
    """
    import httpx
    
    try:
        # Get conversation to find contact phone
        conversation = await db.conversations.find_one({'id': conversation_id})
        
        if not conversation:
            return {'success': False, 'error': 'Conversation not found'}
        
        contact_phone = conversation['contact_phone']
        
        # Prepare message payload
        payload = {
            'number': contact_phone,
            'message': message_text
        }
        
        # Add buttons if provided (for Baileys)
        if buttons:
            payload['buttons'] = buttons
        
        # Send via WhatsApp service
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{whatsapp_service_url}/send-message",
                json=payload,
                timeout=30.0
            )
            
            if response.status_code == 200:
                # Save message to database
                message = {
                    'id': str(uuid.uuid4()),
                    'conversation_id': conversation_id,
                    'contact_id': conversation['contact_id'],
                    'from_me': True,
                    'message_type': 'text',
                    'text': message_text,
                    'buttons': buttons,
                    'timestamp': datetime.now(timezone.utc).isoformat(),
                    'created_at': datetime.now(timezone.utc).isoformat()
                }
                await db.messages.insert_one(message.copy())
                
                # Update conversation
                await db.conversations.update_one(
                    {'id': conversation_id},
                    {
                        '$set': {
                            'last_message': message_text,
                            'last_message_at': datetime.now(timezone.utc).isoformat(),
                            'updated_at': datetime.now(timezone.utc).isoformat()
                        }
                    }
                )
                
                # Remove _id from message before returning (MongoDB adds it automatically)
                message.pop('_id', None)
                
                print(f"✅ Message sent to {contact_phone}")
                return {'success': True, 'message': message}
            else:
                print(f"❌ Failed to send message: {response.text}")
                return {'success': False, 'error': response.text}
                
    except Exception as e:
        print(f"❌ Error sending message: {e}")
        return {'success': False, 'error': str(e)}
