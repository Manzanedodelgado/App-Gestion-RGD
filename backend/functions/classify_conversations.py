"""
Classify conversations using AI
Assigns color codes based on urgency and AI analysis
"""
from datetime import datetime, timezone
from automation_service import AIAssistant

ai_assistant = AIAssistant()

async def classify_single_conversation(db, conversation_id: str):
    """
    Classify a single conversation based on recent messages
    """
    try:
        # Get conversation
        conversation = await db.conversations.find_one({'id': conversation_id})
        
        if not conversation:
            return {'success': False, 'error': 'Conversation not found'}
        
        # Get recent messages (last 5)
        messages = await db.messages.find(
            {'conversation_id': conversation_id}
        ).sort('timestamp', -1).limit(5).to_list(5)
        
        if not messages:
            return {'success': False, 'error': 'No messages found'}
        
        # Combine messages for classification
        combined_text = ' '.join([msg.get('text', '') for msg in messages if msg.get('text')])
        
        # Classify using AI
        classification = ai_assistant.classify_conversation(combined_text)
        
        # Update conversation with color code
        await db.conversations.update_one(
            {'id': conversation_id},
            {
                '$set': {
                    'color_code': classification,
                    'classified_at': datetime.now(timezone.utc).isoformat(),
                    'updated_at': datetime.now(timezone.utc).isoformat()
                }
            }
        )
        
        print(f"✅ Conversation classified as: {classification}")
        return {'success': True, 'classification': classification}
        
    except Exception as e:
        print(f"❌ Error classifying conversation: {e}")
        return {'success': False, 'error': str(e)}


async def classify_all_conversations(db):
    """
    Classify all active conversations
    Runs periodically or on demand
    """
    try:
        # Get all conversations updated in last 24 hours
        from datetime import timedelta
        cutoff_time = (datetime.now(timezone.utc) - timedelta(hours=24)).isoformat()
        
        conversations = await db.conversations.find(
            {'updated_at': {'$gte': cutoff_time}}
        ).to_list(None)
        
        results = []
        for conversation in conversations:
            result = await classify_single_conversation(db, conversation['id'])
            results.append({
                'conversation_id': conversation['id'],
                'contact_name': conversation.get('contact_name'),
                'classification': result.get('classification')
            })
        
        print(f"✅ Classified {len(results)} conversations")
        return {'success': True, 'classified_count': len(results), 'results': results}
        
    except Exception as e:
        print(f"❌ Error classifying conversations: {e}")
        return {'success': False, 'error': str(e)}


async def get_conversations_by_color(db, color_code: str):
    """
    Get all conversations of a specific color
    Used for dashboard display
    """
    try:
        conversations = await db.conversations.find(
            {'color_code': color_code}
        ).sort('last_message_at', -1).to_list(None)
        
        return conversations
        
    except Exception as e:
        print(f"❌ Error getting conversations by color: {e}")
        return []
