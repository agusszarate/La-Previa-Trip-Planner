# Arquitectura del Proyecto

## Stack

- **Next.js 16** (App Router) + TypeScript + Tailwind CSS v4
- **Supabase** (PostgreSQL + Auth con Magic Link)
- **Nodemailer** (Gmail SMTP para emails)
- **Cheerio** (scraping de alojamientos)
- **Vercel** (deploy) + **GitHub Actions** (cron)

## Estructura de Archivos

```
src/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # Login (Magic Link)
│   ├── layout.tsx                # Layout raíz con ThemeProvider
│   ├── dashboard/page.tsx        # Lista de viajes del usuario
│   ├── trips/
│   │   ├── new/page.tsx          # Crear nuevo viaje
│   │   └── [id]/page.tsx         # Detalle de viaje (server component, fetch de datos)
│   ├── invite/[code]/            # Flujo de invitación
│   │   ├── page.tsx              # Server: valida invite y renderiza client
│   │   └── InviteClient.tsx      # Client: login + unirse al viaje
│   ├── auth/callback/route.ts    # Callback de Supabase Auth
│   ├── profile/page.tsx          # Perfil del usuario
│   └── api/
│       ├── cron/route.ts         # Cron job: chequeo de vuelos (Kiwi API)
│       ├── scrape/route.ts       # Scraping de Airbnb con Cheerio
│       └── trips/invite/route.ts # Generación de links de invitación
│
├── components/
│   ├── TripDetail.tsx            # Orquestador de tabs del viaje (~170 líneas)
│   ├── ComboBuilder.tsx          # Tab "Armar Combo" (opciones por categoría)
│   ├── Navbar.tsx                # Barra de navegación
│   ├── ThemeProvider.tsx         # Context de dark/light mode
│   └── trip/                     # Sub-componentes de cada tab
│       ├── constants.ts          # TABS, CATEGORIES, CURRENCIES, OPTION_CATEGORIES
│       ├── ExpensesTab.tsx       # Gastos compartidos + deudas
│       ├── MembersTab.tsx        # Miembros + invitaciones
│       ├── AccommodationsTab.tsx # Alojamientos + scraping
│       ├── FlightsTab.tsx        # Alertas de vuelos
│       ├── ChecklistTab.tsx      # Lista de items asignables
│       └── PreviewTab.tsx        # Preview interactivo del combo
│
├── lib/
│   ├── types.ts                  # Interfaces y tipos TypeScript
│   ├── debts.ts                  # Algoritmo de simplificación de deudas
│   ├── email.ts                  # Nodemailer config + templates
│   ├── utils.ts                  # nanoid, formatMoney, formatDate, getInitials
│   └── supabase/
│       ├── client.ts             # Supabase client (browser)
│       ├── server.ts             # Supabase client (server components)
│       └── middleware.ts         # Session management
│
├── middleware.ts                 # Next.js middleware (session refresh)
└── proxy.ts                      # Proxy para middleware

scripts/
├── 001-schema.sql                # Schema completo de la DB (para deploys nuevos)
└── 002-rename-skipass.sql        # Migración: skipass → entradas

.github/workflows/
└── cron-check-flights.yml        # GitHub Action para chequeo diario de vuelos
```

## Convenciones

### Componentes
- **Server components** en `app/` para fetch de datos
- **Client components** (`"use client"`) para interactividad
- Cada tab del viaje es un componente independiente en `components/trip/`
- Constantes compartidas van en `components/trip/constants.ts`

### Base de datos
- 11 tablas en Supabase (ver `scripts/001-schema.sql`)
- RLS deshabilitado (app entre amigos, auth por Supabase Auth)
- Migraciones nuevas van como `scripts/00X-descripcion.sql`

### Autenticación
- Magic Link vía Supabase Auth (sin contraseña)
- Middleware actualiza la sesión en cada request
- Invitaciones por link con código único

### Categorías
- **Gastos**: alojamiento, transporte, comida, equipamiento, entradas, actividades, otros
- **Opciones del combo**: alojamiento, transporte_ida, transporte_vuelta, entradas, equipamiento, comida, actividades, otros
- **Monedas**: ARS, USD, EUR, BRL
