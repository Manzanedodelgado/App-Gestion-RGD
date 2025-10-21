"""
Automation Service for WhatsApp
Handles message flows, consent templates, AI configuration, and automated reminders
"""
import os
from dotenv import load_dotenv
from openai import OpenAI
from datetime import datetime, timedelta
from typing import List, Dict, Optional
import asyncio

load_dotenv()

# OpenRouter client for DeepSeek
openrouter_client = OpenAI(
    api_key=os.getenv('OPENROUTER_API_KEY'),
    base_url="https://openrouter.ai/api/v1"
)

class AIAssistant:
    """AI Assistant using DeepSeek through OpenRouter"""
    
    def __init__(self):
        self.model = "deepseek/deepseek-chat:free"
        self.knowledge_base = []
        self.personality = "Soy el asistente virtual de Rubio García Dental. Soy profesional, amable y siempre dispuesto a ayudar con consultas sobre tratamientos dentales."
        
    def classify_conversation(self, message: str) -> str:
        """Classify conversation urgency based on content"""
        urgent_keywords = ['dolor', 'emergencia', 'sangrado', 'trauma', 'infección', 'hinchazón', 'urgente']
        attention_keywords = ['cita', 'consulta', 'tratamiento', 'precio', 'horario', 'información']
        resolved_keywords = ['gracias', 'entendido', 'perfecto', 'ok', 'bien']
        
        message_lower = message.lower()
        
        # Check for urgent
        if any(keyword in message_lower for keyword in urgent_keywords):
            return 'AMARILLO'  # Urgent
        
        # Check for resolved
        if any(keyword in message_lower for keyword in resolved_keywords):
            return 'VERDE'  # Resolved
        
        # Check for attention
        if any(keyword in message_lower for keyword in attention_keywords):
            return 'AZUL'  # Requires attention
        
        return 'AZUL'  # Default to requires attention
    
    async def generate_response(self, message: str, context: List[Dict] = None) -> str:
        """Generate AI response using DeepSeek"""
        try:
            messages = [
                {"role": "system", "content": self.personality}
            ]
            
            # Add context if available
            if context:
                for msg in context[-5:]:  # Last 5 messages
                    messages.append(msg)
            
            messages.append({"role": "user", "content": message})
            
            response = openrouter_client.chat.completions.create(
                model=self.model,
                messages=messages,
                max_tokens=500
            )
            
            return response.choices[0].message.content
        except Exception as e:
            print(f"Error generating AI response: {e}")
            return "Lo siento, en este momento no puedo procesar tu consulta. Por favor, contacta directamente con la clínica."


class MessageFlowEngine:
    """Engine to execute message flows with variables and actions"""
    
    @staticmethod
    def replace_variables(text: str, variables: Dict) -> str:
        """Replace variables in text like {Nombre}, {Hora}, etc."""
        for key, value in variables.items():
            text = text.replace(f"{{{key}}}", str(value))
        return text
    
    @staticmethod
    async def execute_flow(flow: Dict, recipient: Dict, db, whatsapp_service_url: str):
        """Execute a message flow for a recipient"""
        import httpx
        
        variables = {
            'Nombre': recipient.get('nombre', ''),
            'Apellidos': recipient.get('apellidos', ''),
            'Hora': recipient.get('hora', ''),
            'Fecha': recipient.get('fecha', ''),
            'Doctor': recipient.get('doctor', ''),
            'Tratamiento': recipient.get('tratamiento', '')
        }
        
        # Execute each step in the flow
        for step in flow.get('steps', []):
            # Replace variables in message
            message = MessageFlowEngine.replace_variables(step.get('message', ''), variables)
            
            # Send message via WhatsApp
            async with httpx.AsyncClient() as client:
                try:
                    response = await client.post(
                        f"{whatsapp_service_url}/send-message",
                        json={
                            'number': recipient.get('telefono', ''),
                            'message': message
                        }
                    )
                    print(f"Message sent to {recipient.get('nombre')}: {response.status_code}")
                except Exception as e:
                    print(f"Error sending message: {e}")
            
            # Execute actions (e.g., update appointment status)
            for action in step.get('actions', []):
                if action['type'] == 'update_status':
                    # Update appointment status in database
                    await db.appointments.update_one(
                        {'_id': recipient.get('appointment_id')},
                        {'$set': {'status': action['value']}}
                    )
            
            # Wait before next step if specified
            await asyncio.sleep(step.get('delay', 0))


class ReminderScheduler:
    """Scheduler for automatic appointment reminders"""
    
    @staticmethod
    async def check_and_send_reminders(db, whatsapp_service_url: str, google_sheets_service):
        """Check appointments and send reminders based on configured rules"""
        try:
            # Get appointments from Google Sheets
            appointments = await google_sheets_service.get_upcoming_appointments()
            
            # Get configured reminder flows from database
            flows = await db.message_flows.find({'category': 'confirmacion'}).to_list(None)
            
            if not flows:
                print("No reminder flows configured")
                return
            
            confirmation_flow = flows[0]
            
            # Filter appointments that need reminders (24 hours before)
            now = datetime.now()
            tomorrow = now + timedelta(hours=24)
            
            for appointment in appointments:
                try:
                    # Parse appointment date and time
                    apt_datetime = datetime.strptime(
                        f"{appointment['fecha']} {appointment['hora']}", 
                        "%Y-%m-%d %H:%M"
                    )
                    
                    # Check if appointment is within 24-48 hours
                    hours_until = (apt_datetime - now).total_seconds() / 3600
                    
                    if 24 <= hours_until <= 26 and appointment.get('estadoCita') == 'Planificada':
                        # Send reminder
                        recipient = {
                            'nombre': appointment.get('nombre', ''),
                            'apellidos': appointment.get('apellidos', ''),
                            'telefono': appointment.get('telMovil', ''),
                            'hora': appointment.get('hora', ''),
                            'fecha': appointment.get('fecha', ''),
                            'doctor': appointment.get('odontologo', ''),
                            'tratamiento': appointment.get('tratamiento', ''),
                            'appointment_id': appointment.get('_id')
                        }
                        
                        await MessageFlowEngine.execute_flow(
                            confirmation_flow, 
                            recipient, 
                            db, 
                            whatsapp_service_url
                        )
                        
                        print(f"Reminder sent to {recipient['nombre']}")
                        
                except Exception as e:
                    print(f"Error processing appointment: {e}")
                    continue
                    
        except Exception as e:
            print(f"Error in reminder scheduler: {e}")
