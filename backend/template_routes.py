"""
Template Routes - CRUD para Plantillas de Mensajes
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
import uuid

template_router = APIRouter()

# Importar la conexión a la base de datos
from server import db

# ==================== MODELOS ====================

class ButtonAction(BaseModel):
    type: str  # 'send_message', 'update_appointment_status', 'start_flow', 'send_consent'
    value: Optional[str] = None
    flow_id: Optional[str] = None
    status: Optional[str] = None
    consent_id: Optional[str] = None

class Button(BaseModel):
    id: str
    text: str
    actions: List[ButtonAction] = []

class Attachment(BaseModel):
    type: str  # 'pdf', 'image', 'document'
    url: str
    name: str

class Step(BaseModel):
    id: str
    order: int
    content: str  # Texto con variables {{nombre}}, {{fecha}}, etc.
    attachments: List[Attachment] = []
    buttons: List[Button] = []

class MessageTemplate(BaseModel):
    id: Optional[str] = None
    name: str
    category: str  # 'confirmacion', 'consentimiento', 'recordatorio', etc.
    steps: List[Step]
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class ConsentTemplate(BaseModel):
    id: Optional[str] = None
    name: str
    treatment_type: str
    content: str  # HTML del formulario
    fields: List[Dict[str, Any]] = []
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class Automation(BaseModel):
    id: Optional[str] = None
    name: str
    trigger_type: str  # 'time_based', 'event_based'
    template_id: str
    trigger_config: Dict[str, Any]  # Configuración del trigger (ej: 24h antes)
    active: bool = True
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

# ==================== MESSAGE TEMPLATES ====================

@template_router.get("/message-templates")
async def get_message_templates():
    """Obtener todas las plantillas de mensajes"""
    try:
        templates = await db.message_templates.find({}, {'_id': 0}).to_list(100)
        return templates
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@template_router.get("/message-templates/{template_id}")
async def get_message_template(template_id: str):
    """Obtener una plantilla específica"""
    try:
        template = await db.message_templates.find_one({'id': template_id}, {'_id': 0})
        if not template:
            raise HTTPException(status_code=404, detail="Template not found")
        return template
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@template_router.post("/message-templates")
async def create_message_template(template: MessageTemplate):
    """Crear una nueva plantilla de mensajes"""
    try:
        template_dict = template.dict()
        template_dict['id'] = str(uuid.uuid4())
        template_dict['created_at'] = datetime.now(timezone.utc).isoformat()
        template_dict['updated_at'] = datetime.now(timezone.utc).isoformat()
        
        await db.message_templates.insert_one(template_dict)
        template_dict.pop('_id', None)
        
        return template_dict
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@template_router.put("/message-templates/{template_id}")
async def update_message_template(template_id: str, template: MessageTemplate):
    """Actualizar una plantilla existente"""
    try:
        template_dict = template.dict()
        template_dict['updated_at'] = datetime.now(timezone.utc).isoformat()
        template_dict.pop('id', None)
        template_dict.pop('created_at', None)
        
        result = await db.message_templates.update_one(
            {'id': template_id},
            {'$set': template_dict}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Template not found")
        
        updated = await db.message_templates.find_one({'id': template_id}, {'_id': 0})
        return updated
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@template_router.delete("/message-templates/{template_id}")
async def delete_message_template(template_id: str):
    """Eliminar una plantilla"""
    try:
        result = await db.message_templates.delete_one({'id': template_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Template not found")
        
        return {"success": True, "message": "Template deleted"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==================== CONSENT TEMPLATES ====================

@template_router.get("/consent-templates")
async def get_consent_templates():
    """Obtener todas las plantillas de consentimiento"""
    try:
        templates = await db.consent_templates.find({}, {'_id': 0}).to_list(100)
        return templates
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@template_router.post("/consent-templates")
async def create_consent_template(template: ConsentTemplate):
    """Crear una nueva plantilla de consentimiento"""
    try:
        template_dict = template.dict()
        template_dict['id'] = str(uuid.uuid4())
        template_dict['created_at'] = datetime.now(timezone.utc).isoformat()
        template_dict['updated_at'] = datetime.now(timezone.utc).isoformat()
        
        await db.consent_templates.insert_one(template_dict)
        template_dict.pop('_id', None)
        
        return template_dict
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@template_router.put("/consent-templates/{template_id}")
async def update_consent_template(template_id: str, template: ConsentTemplate):
    """Actualizar una plantilla de consentimiento"""
    try:
        template_dict = template.dict()
        template_dict['updated_at'] = datetime.now(timezone.utc).isoformat()
        template_dict.pop('id', None)
        template_dict.pop('created_at', None)
        
        result = await db.consent_templates.update_one(
            {'id': template_id},
            {'$set': template_dict}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Template not found")
        
        updated = await db.consent_templates.find_one({'id': template_id}, {'_id': 0})
        return updated
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@template_router.delete("/consent-templates/{template_id}")
async def delete_consent_template(template_id: str):
    """Eliminar una plantilla de consentimiento"""
    try:
        result = await db.consent_templates.delete_one({'id': template_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Template not found")
        
        return {"success": True, "message": "Consent template deleted"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==================== AUTOMATIONS ====================

@template_router.get("/automations")
async def get_automations():
    """Obtener todas las automatizaciones"""
    try:
        automations = await db.automations.find({}, {'_id': 0}).to_list(100)
        return automations
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@template_router.post("/automations")
async def create_automation(automation: Automation):
    """Crear una nueva automatización"""
    try:
        automation_dict = automation.dict()
        automation_dict['id'] = str(uuid.uuid4())
        automation_dict['created_at'] = datetime.now(timezone.utc).isoformat()
        automation_dict['updated_at'] = datetime.now(timezone.utc).isoformat()
        
        await db.automations.insert_one(automation_dict)
        automation_dict.pop('_id', None)
        
        return automation_dict
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@template_router.put("/automations/{automation_id}")
async def update_automation(automation_id: str, automation: Automation):
    """Actualizar una automatización"""
    try:
        automation_dict = automation.dict()
        automation_dict['updated_at'] = datetime.now(timezone.utc).isoformat()
        automation_dict.pop('id', None)
        automation_dict.pop('created_at', None)
        
        result = await db.automations.update_one(
            {'id': automation_id},
            {'$set': automation_dict}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Automation not found")
        
        updated = await db.automations.find_one({'id': automation_id}, {'_id': 0})
        return updated
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@template_router.delete("/automations/{automation_id}")
async def delete_automation(automation_id: str):
    """Eliminar una automatización"""
    try:
        result = await db.automations.delete_one({'id': automation_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Automation not found")
        
        return {"success": True, "message": "Automation deleted"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
