# 📋 RELACIONES Y DEPENDENCIAS DEL SISTEMA

**Fecha de creación**: 22 de octubre de 2025  
**Propósito**: Documentar todas las relaciones entre componentes, datos y visualizaciones para mantener consistencia en el sistema.

---

## 🔗 RELACIONES DE DATOS

### 1. CITAS (Appointments)

**Fuente de datos**: Google Sheets sincronizado → MongoDB `appointments`

**Campos clave**:
- `date` - Datetime completo (fecha + hora combinada)
- `hora` - String de hora del Google Sheet (ej: "10:00", "11:15")
- `patient_name` - Nombre del paciente
- `title` - Tipo de cita
- `duration_minutes` - Duración
- `reminder_sent` - Estado de recordatorio

**Componentes que usan Citas**:
1. **Dashboard.jsx** (Panel de Control)
   - Línea 168: `{apt.hora || format(new Date(apt.date), 'HH:mm')}`
   - Muestra citas de HOY
   - Usa: `patient_name`, `hora`, `title`, `duration_minutes`, `reminder_sent`

2. **AppointmentsNew.jsx** (Página de Citas)
   - Línea 613: `{apt.hora}`
   - Muestra todas las citas (agenda completa)
   - Usa: `patient_name`, `hora`, `date`, `title`, `duration_minutes`, `doctor`

**⚠️ REGLA DE CONSISTENCIA**:
- **SIEMPRE usar `apt.hora`** para mostrar la hora de las citas
- Si se cambia en un componente, DEBE cambiarse en TODOS los componentes relacionados

---

### 2. CONVERSACIONES (Conversations)

**Fuente de datos**: MongoDB `conversations`

**Campos clave**:
- `id` - UUID único
- `contact_name` - Nombre del contacto
- `contact_phone` - Teléfono
- `last_message` - Último mensaje
- `last_message_at` - Timestamp del último mensaje
- `color_code` - Clasificación: 'AMARILLO', 'AZUL', 'VERDE', o null
- `manually_classified` - Boolean (protege contra sobrescritura automática)

**Componentes que usan Conversaciones**:

1. **Dashboard.jsx** (Panel de Control - Conversaciones Prioritarias)
   - Línea 51-53: Filtra `color_code === 'AZUL' || color_code === 'AMARILLO'`
   - Muestra: Avatar con color, nombre, último mensaje
   - NO muestra conversaciones SIN CLASIFICAR o VERDE

2. **Messages.jsx** (Página de Mensajes)
   - Muestra TODAS las conversaciones
   - Orquesta: ConversationList, ChatArea, ContactInfo

3. **ConversationList.jsx** (Lista de Chats)
   - Muestra todas las conversaciones con avatares de colores
   - Avatar: sin clasificar = blanco, clasificados = fondo color + letra blanca

**⚠️ REGLA DE CONSISTENCIA - AVATARES**:
- **Sin clasificar** (`color_code === null`): Fondo blanco, letra azul oscuro
- **AMARILLO**: Fondo amarillo `bg-yellow-500`, letra blanca
- **AZUL**: Fondo azul `bg-blue-600`, letra blanca
- **VERDE**: Fondo verde `bg-green-600`, letra blanca
- Si se cambia el protocolo de color, debe actualizarse en:
  - ConversationList.jsx
  - ChatArea.jsx
  - ContactInfo.jsx
  - Dashboard.jsx

---

### 3. MENSAJES (Messages)

**Fuente de datos**: MongoDB `messages`

**Campos clave**:
- `id` - UUID único
- `conversation_id` - Relación con conversación
- `from_me` - Boolean (enviado/recibido)
- `text` - Contenido del mensaje
- `timestamp` - Fecha/hora del mensaje

**Componentes que usan Mensajes**:

1. **ChatArea.jsx**
   - Muestra mensajes de la conversación seleccionada
   - Usa MessageBubble para renderizar cada mensaje

2. **MessageBubble.jsx**
   - Renderiza burbujas individuales
   - Enviados: Fondo azul `#2563eb`, letra blanca
   - Recibidos: Fondo azul claro `#dbeafe`, letra gris oscuro

**⚠️ REGLA DE CONSISTENCIA - BURBUJAS**:
- Enviados: Fondo `#2563eb`, texto blanco
- Recibidos: Fondo `#dbeafe`, texto gris oscuro
- NO usar el mismo azul que el corporativo para evitar confusión

---

### 4. PACIENTES (Patients)

**Fuente de datos**: Google Sheets sincronizado → MongoDB `patients`

**Campos clave**:
- `name` - Nombre completo
- `phone` - Teléfono
- `email` - Email
- `notes` - Notas

**Componentes que usan Pacientes**:
1. **Patients.jsx** (Página de Pacientes)
2. **ContactInfo.jsx** (Panel derecho de Mensajes)

---

## 🎨 COLORES CORPORATIVOS

### Azul Corporativo
- **NO usar para clasificación** de conversaciones (para evitar confusión)
- Usar para: Headers, botones primarios, elementos de UI
- Código: `#283593`, `#312ea3`, `#0071BC`

### Colores de Clasificación
- **AMARILLO**: `#facc15`, `#fbbf24`, `bg-yellow-500` (Urgente)
- **AZUL** (clasificación): `#2563eb`, `bg-blue-600` (Requiere Atención)
- **VERDE**: `#10b981`, `bg-green-600` (Resuelta)

### Mensajes
- **Enviados**: Fondo `#2563eb` (azul vibrante), texto blanco
- **Recibidos**: Fondo `#dbeafe` (azul claro), texto gris oscuro
- **Área de chat**: Fondo `#e0f2fe` (azul muy claro)

### Separadores
- **Amarillo vibrante**: `#facc15` - 8px de ancho entre columnas

---

## 🔐 REGLAS DE CLASIFICACIÓN

### Sistema de Protección
1. **Clasificación Manual** tiene `manually_classified: true`
2. **NO se sobrescribe** automáticamente al recibir mensajes nuevos
3. **Clasificación Automática** solo aplica si `color_code === null`

### Endpoints
- `POST /api/conversations/{id}/set-classification` - Clasificación MANUAL
- `POST /api/conversations/{id}/classify` - Clasificación AUTOMÁTICA (respeta manual)
- `DELETE /api/conversations/{id}/classification` - Quitar clasificación

---

## ✅ CHECKLIST PARA MODIFICACIONES

### Al modificar visualización de CITAS:
- [ ] Actualizar Dashboard.jsx
- [ ] Actualizar AppointmentsNew.jsx
- [ ] Verificar que ambos usen `apt.hora`
- [ ] Probar en ambas páginas

### Al modificar COLORES de avatares:
- [ ] Actualizar ConversationList.jsx
- [ ] Actualizar ChatArea.jsx
- [ ] Actualizar ContactInfo.jsx
- [ ] Actualizar Dashboard.jsx (conversaciones prioritarias)
- [ ] Verificar protocolo: sin clasificar vs clasificados

### Al modificar CLASIFICACIÓN:
- [ ] Verificar que no sobrescriba clasificaciones manuales
- [ ] Actualizar Dashboard (solo AMARILLO y AZUL)
- [ ] Verificar Messages (todas las clasificaciones)

### Al modificar MENSAJES:
- [ ] Verificar MessageBubble (enviados vs recibidos)
- [ ] Verificar ChatArea (área de conversación)
- [ ] Verificar que aparezcan en el muro después de enviar

---

## 📝 HISTORIAL DE CAMBIOS

### 22 de octubre de 2025
- ✅ Corregido: Horas de citas ahora usan `apt.hora` en Dashboard y AppointmentsNew
- ✅ Corregido: Sistema de clasificación con protección manual
- ✅ Corregido: Protocolo de avatares (sin clasificar: blanco, clasificados: color)
- ✅ Corregido: Mensajes aparecen en el muro después de enviar
- ✅ Eliminados: Duplicados de conversaciones
- ✅ Creado: Este archivo de documentación

---

## 🚨 PROBLEMAS COMUNES Y SOLUCIONES

### Problema: Horas inconsistentes entre Dashboard y Citas
**Causa**: Usar campos diferentes (`date` vs `hora`)  
**Solución**: SIEMPRE usar `apt.hora` del Google Sheet

### Problema: Clasificaciones se sobrescriben automáticamente
**Causa**: No verificar `manually_classified` flag  
**Solución**: Usar endpoint de clasificación manual y verificar flag

### Problema: Avatares con colores incorrectos
**Causa**: Protocolo no consistente entre componentes  
**Solución**: Verificar función `getAvatarColor()` en todos los componentes

---

**NOTA IMPORTANTE**: Este archivo debe actualizarse cada vez que se cree una nueva relación o dependencia en el sistema.
