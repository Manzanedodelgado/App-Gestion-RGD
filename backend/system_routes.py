"""
System and User Management Routes
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone
import uuid

system_router = APIRouter()

# Importar la conexión a la base de datos
from server import db

# ==================== MODELOS ====================

class UserInvite(BaseModel):
    email: str
    role: str

class User(BaseModel):
    id: Optional[str] = None
    email: str
    name: Optional[str] = None
    role: str
    created_at: Optional[str] = None

# ==================== HEALTH ====================

@system_router.get("/health")
async def health_check():
    """Health check del sistema"""
    return {
        "status": "ok",
        "uptime": 3600,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@system_router.get("/database/status")
async def database_status():
    """Estado de la base de datos"""
    try:
        # Intenta hacer una query simple
        await db.command('ping')
        return {"connected": True}
    except Exception:
        return {"connected": False}

@system_router.post("/system/restart/{service}")
async def restart_service(service: str):
    """Reiniciar un servicio (simulado)"""
    # En producción, esto ejecutaría comandos supervisorctl
    return {"success": True, "message": f"Service {service} restart initiated"}

# ==================== USERS ====================

@system_router.get("/users")
async def get_users():
    """Obtener todos los usuarios"""
    try:
        users = await db.users.find({}, {'_id': 0}).to_list(100)
        return users
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@system_router.post("/users/invite")
async def invite_user(invite: UserInvite):
    """Invitar un nuevo usuario"""
    try:
        # Verificar si ya existe
        existing = await db.users.find_one({'email': invite.email})
        if existing:
            raise HTTPException(status_code=400, detail="User already exists")
        
        # Crear usuario
        user = {
            'id': str(uuid.uuid4()),
            'email': invite.email,
            'role': invite.role,
            'status': 'invited',
            'created_at': datetime.now(timezone.utc).isoformat()
        }
        
        await db.users.insert_one(user)
        user.pop('_id', None)
        
        # TODO: Enviar email de invitación
        
        return user
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@system_router.delete("/users/{user_id}")
async def delete_user(user_id: str):
    """Eliminar un usuario"""
    try:
        result = await db.users.delete_one({'id': user_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="User not found")
        
        return {"success": True, "message": "User deleted"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
