"""
Handle WhatsApp button responses
Executes actions when patient clicks interactive buttons
"""
from datetime import datetime, timezone

async def handle_whatsapp_response(db, whatsapp_service_url: str, response_data: dict):
    """
    Handle button click response from patient
    Executes configured actions (update appointment, send message, etc.)
    """
    try:
        button_id = response_data.get('button_id')
        conversation_id = response_data.get('conversation_id')
        message_id = response_data.get('message_id')
        
        # Get the original message to find associated actions
        original_message = await db.messages.find_one({'id': message_id})
        
        if not original_message or not original_message.get('buttons'):
            return {'success': False, 'error': 'Message or buttons not found'}
        
        # Find the clicked button
        clicked_button = None
        for button in original_message['buttons']:
            if button['id'] == button_id:
                clicked_button = button
                break
        
        if not clicked_button:
            return {'success': False, 'error': 'Button not found'}
        
        # Execute actions associated with the button
        actions = clicked_button.get('actions', [])
        results = []
        
        for action in actions:
            action_type = action.get('type')
            
            # ACTION 1: Send automatic response message
            if action_type == 'send_message':
                response_text = action.get('message', '')
                
                from functions.whatsapp_handlers import whatsapp_send_message
                result = await whatsapp_send_message(
                    db, 
                    whatsapp_service_url, 
                    conversation_id, 
                    response_text
                )
                results.append({'action': 'send_message', 'result': result})
            
            # ACTION 2: Update appointment status
            elif action_type == 'update_appointment_status':
                new_status = action.get('status', '')
                appointment_id = action.get('appointment_id')
                
                if appointment_id:
                    await db.appointments.update_one(
                        {'id': appointment_id},
                        {
                            '$set': {
                                'status': new_status,
                                'updated_at': datetime.now(timezone.utc).isoformat()
                            }
                        }
                    )
                    results.append({'action': 'update_appointment', 'status': new_status})
            
            # ACTION 3: Send consent form
            elif action_type == 'send_consent_form':
                template_code = action.get('template_code', '')
                
                # Get consent template
                template = await db.consent_templates.find_one({'code': template_code})
                
                if template:
                    # Format consent message
                    consent_text = f"""
📋 {template['title']}

{template['description']}

⚠️ Riesgos y Complicaciones:
{chr(10).join(['- ' + risk for risk in template.get('risks', [])])}

✅ Para confirmar tu consentimiento, responde con: ACEPTO
                    """
                    
                    from functions.whatsapp_handlers import whatsapp_send_message
                    result = await whatsapp_send_message(
                        db, 
                        whatsapp_service_url, 
                        conversation_id, 
                        consent_text
                    )
                    results.append({'action': 'send_consent', 'result': result})
            
            # ACTION 4: Update conversation color
            elif action_type == 'update_conversation_color':
                new_color = action.get('color', 'VERDE')
                
                await db.conversations.update_one(
                    {'id': conversation_id},
                    {
                        '$set': {
                            'color_code': new_color,
                            'updated_at': datetime.now(timezone.utc).isoformat()
                        }
                    }
                )
                results.append({'action': 'update_color', 'color': new_color})
        
        # Log the button response
        await db.button_responses.insert_one({
            'message_id': message_id,
            'conversation_id': conversation_id,
            'button_id': button_id,
            'button_text': clicked_button.get('text', ''),
            'actions_executed': results,
            'timestamp': datetime.now(timezone.utc).isoformat()
        })
        
        print(f"✅ Button response handled: {clicked_button.get('text')}")
        return {'success': True, 'actions_executed': results}
        
    except Exception as e:
        print(f"❌ Error handling button response: {e}")
        return {'success': False, 'error': str(e)}
