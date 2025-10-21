"""
Transcribe audio messages using AI
Converts voice messages to text
"""
import os
from openai import OpenAI

# Initialize OpenAI client for Whisper transcription
# Note: OpenRouter doesn't support Whisper, so we'll use OpenAI directly if available
# Otherwise, we'll return a placeholder

async def transcribe_audio(db, message_id: str, audio_url: str):
    """
    Transcribe audio message to text
    """
    try:
        # For now, we'll implement a basic version
        # In production, you would:
        # 1. Download the audio file from audio_url
        # 2. Send to Whisper API or similar
        # 3. Get transcription
        # 4. Update message with transcription
        
        # Placeholder implementation
        transcription_text = "[Audio transcripción pendiente - Configurar Whisper API]"
        
        # Update message with transcription
        await db.messages.update_one(
            {'id': message_id},
            {
                '$set': {
                    'transcription': transcription_text,
                    'transcribed_at': datetime.now(timezone.utc).isoformat()
                }
            }
        )
        
        print(f"✅ Audio transcribed (placeholder) for message {message_id}")
        return {'success': True, 'transcription': transcription_text}
        
    except Exception as e:
        print(f"❌ Error transcribing audio: {e}")
        return {'success': False, 'error': str(e)}


# Real implementation with Whisper (if OpenAI API key is available)
async def transcribe_audio_with_whisper(db, message_id: str, audio_file_path: str):
    """
    Transcribe audio using OpenAI Whisper
    Requires OPENAI_API_KEY environment variable
    """
    try:
        openai_key = os.getenv('OPENAI_API_KEY')
        
        if not openai_key:
            return await transcribe_audio(db, message_id, audio_file_path)
        
        client = OpenAI(api_key=openai_key)
        
        # Open audio file and transcribe
        with open(audio_file_path, 'rb') as audio_file:
            transcription = client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
                language="es"  # Spanish
            )
        
        transcription_text = transcription.text
        
        # Update message
        await db.messages.update_one(
            {'id': message_id},
            {
                '$set': {
                    'transcription': transcription_text,
                    'transcribed_at': datetime.now(timezone.utc).isoformat()
                }
            }
        )
        
        print(f"✅ Audio transcribed with Whisper: {transcription_text[:50]}...")
        return {'success': True, 'transcription': transcription_text}
        
    except Exception as e:
        print(f"❌ Error transcribing with Whisper: {e}")
        return {'success': False, 'error': str(e)}
