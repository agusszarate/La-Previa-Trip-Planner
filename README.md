# Ski Trip Planner ⛷️

Plataforma para organizar viajes de ski con amigos. Gastos compartidos, seguimiento de vuelos, alojamiento y más.

## Stack

- **Frontend + API**: Next.js 15 (App Router) en Vercel
- **Base de datos**: Supabase (PostgreSQL)
- **Auth**: Supabase Magic Link
- **Emails**: Gmail SMTP (Nodemailer)
- **Scraping**: Cheerio
- **Cron**: Vercel Cron + GitHub Actions
- **Costo total**: $0

## Setup

### 1. Supabase

1. Crear proyecto en [supabase.com](https://supabase.com)
2. Ir a **SQL Editor** y ejecutar el contenido de `supabase-schema.sql`
3. En **Authentication > URL Configuration**, agregar `http://localhost:3000/auth/callback` como redirect URL
4. Copiar la URL del proyecto y la anon key

### 2. Variables de entorno

```bash
cp .env.local.example .env.local
```

Completar con tus credenciales:
- `NEXT_PUBLIC_SUPABASE_URL` — URL de tu proyecto Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Anon key de Supabase
- `GMAIL_USER` — Tu email de Gmail
- `GMAIL_APP_PASSWORD` — App password de Gmail (necesitás 2FA activado)
- `CRON_SECRET` — String aleatorio para proteger el endpoint de cron
- `KIWI_API_KEY` — (Opcional) API key de Kiwi Tequila para vuelos

### 3. Gmail App Password

1. Ir a [myaccount.google.com](https://myaccount.google.com)
2. Seguridad > Verificación en 2 pasos (activar si no está)
3. Contraseñas de aplicaciones > Generar nueva
4. Copiar el password de 16 caracteres

### 4. Correr en local

```bash
npm install
npm run dev
```

### 5. Deploy a Vercel

```bash
npx vercel
```

Configurar las variables de entorno en el dashboard de Vercel.

### 6. GitHub Actions (Cron)

En tu repo de GitHub, agregar estos secrets:
- `APP_URL` — URL de tu app en Vercel (ej: https://ski-trip-planner.vercel.app)
- `CRON_SECRET` — El mismo string que pusiste en `.env.local`

## Features

- **Gastos compartidos**: Cargá gastos, dividí en partes iguales, mirá quién le debe a quién
- **Multi-moneda**: ARS, USD, EUR, BRL
- **Miembros**: Agregá amigos por email
- **Alojamiento**: Pegá links de Airbnb, scrapea precio automáticamente
- **Vuelos**: Alertas de precio con chequeo diario
- **Checklist**: Lista de cosas para llevar asignables
