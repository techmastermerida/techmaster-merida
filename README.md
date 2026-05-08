# ⚡ TechMaster Mérida — Sistema de Taller

Sistema de gestión de clientes, equipos y órdenes de servicio para taller de soporte y mantenimiento de cómputo.

---

## 🚀 Stack

- **Frontend**: React + Vite
- **Base de datos**: Supabase (PostgreSQL)
- **Deploy**: Vercel
- **Repo**: GitHub

---

## 📋 Instrucciones de instalación

### 1. Supabase

1. Ve a [supabase.com](https://supabase.com) y crea un proyecto nuevo.
2. Ve a **SQL Editor** y ejecuta todo el contenido de `supabase_schema.sql`.
3. En **Project Settings → API** copia:
   - `Project URL` → `VITE_SUPABASE_URL`
   - `anon public key` → `VITE_SUPABASE_ANON_KEY`

### 2. GitHub

1. Crea un repositorio nuevo en GitHub (puede ser privado).
2. Sube este proyecto:
```bash
git init
git add .
git commit -m "init TechMaster"
git remote add origin https://github.com/TU_USUARIO/techmaster-merida.git
git push -u origin main
```

### 3. Variables de entorno locales

Copia `.env.example` a `.env`:
```bash
cp .env.example .env
```
Y llena con tus datos de Supabase.

### 4. Desarrollo local

```bash
npm install
npm run dev
```

### 5. Vercel

1. Entra a [vercel.com](https://vercel.com) e importa tu repositorio de GitHub.
2. En **Environment Variables** agrega:
   - `VITE_SUPABASE_URL` = URL de tu proyecto Supabase
   - `VITE_SUPABASE_ANON_KEY` = anon key
3. Deploy automático en cada push a `main`.

---

## 📱 Funcionalidades

### Clientes
- Registro de nombre, teléfono, email, dirección, notas
- Registro de múltiples equipos por cliente (tipo, marca, modelo, serie, color, estado al recibir)

### Órdenes de Servicio
- Folio automático correlativo (TM-0001, TM-0002…)
- Vinculadas a cliente y equipo específico
- Estados: Recibido → Diagnóstico → En proceso → Listo → Entregado / Cancelado
- Historial automático de cambios de estado con notas

### Descripción del servicio
- Se llena durante/al terminar la atención
- Aparece en la nota de servicio impresa

### Nota de Servicio (Hoja de cobro)
- Conceptos de cobro con cantidad y precio unitario
- Subtotales y total automático
- Botón "🖨️ Nota de Servicio" genera una página HTML lista para imprimir/guardar como PDF
- Incluye: datos del cliente, datos del equipo, problema reportado, servicio realizado, tabla de cobros

---

## 📂 Estructura del proyecto

```
techmaster/
├── src/
│   ├── lib/
│   │   ├── supabase.js      ← cliente Supabase
│   │   └── toast.jsx        ← notificaciones
│   ├── pages/
│   │   ├── Dashboard.jsx    ← estadísticas y resumen
│   │   ├── Clientes.jsx     ← CRUD clientes + equipos
│   │   ├── Ordenes.jsx      ← lista y creación de órdenes
│   │   └── OrdenDetalle.jsx ← detalle, historial, cobro, nota
│   ├── App.jsx              ← rutas y sidebar
│   ├── index.css            ← diseño TechMaster (azul eléctrico / oscuro)
│   └── main.jsx
├── supabase_schema.sql      ← esquema completo de BD
├── .env.example             ← plantilla de variables
├── package.json
├── vite.config.js
└── index.html
```
