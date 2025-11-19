# Ungga Map v2

Una aplicación web moderna para la búsqueda y visualización de propiedades inmobiliarias en un mapa interactivo. Construida con Next.js, Google Maps y MongoDB.

## Características Principales

- **Mapa Interactivo**: Visualización de propiedades en Google Maps con marcadores personalizados
- **Búsqueda Avanzada**: Autocompletado de lugares y filtros por tipo de propiedad, precio, operación, etc.
- **Interfaz Moderna**: UI/UX construida con Radix UI y Tailwind CSS
- **Integración WhatsApp**: Contacto directo con agentes inmobiliarios
- **Base de Datos**: MongoDB para almacenamiento de propiedades
- **Autenticación**: Firebase para gestión de usuarios
- **APIs REST**: Endpoints para búsqueda de propiedades, lugares y notificaciones

## Instalación

1. **Clona el repositorio:**

   ```bash
   git clone https://github.com/UnggaMX/map-v2.git
   cd map-v2
   ```
2. **Instala las dependencias:**

   ```bash
   pnpm install
   ```
3. **Configura las variables de entorno:**
   Crea un archivo `.env.local` en la raíz del proyecto con las siguientes variables:

   ```env
   # Google Maps API Keys
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY_GGA=your_gga_api_key
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY_GU=your_gu_api_key

   # Firebase
   NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id

   # MongoDB
   MONGO_DATA_SOURCE=Cluster0
   MONGO_URL_ENDPOINT=your_mongo_endpoint
   MONGO_API_KEY=your_mongo_api_key
   MONGO_DB_NAME_GGA=gga
   MONGO_DB_NAME_GU=gu

   # WhatsApp
   WHATSAPP_ACCESS_TOKEN=your_whatsapp_token
   WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id

   # AWS
   AWS_ACCESS_KEY_ID=your_aws_key
   AWS_SECRET_ACCESS_KEY=your_aws_secret
   AWS_REGION=your_aws_region
   ```
4. **Ejecuta el servidor de desarrollo:**

   ```bash
   pnpm dev
   ```
5. **Abre [http://localhost:3000](http://localhost:3000) en tu navegador.**

## Estructura del Proyecto

```
src/
├── app/                    # Next.js App Router
│   ├── (main)/            # Página principal
│   ├── gu/                # Página del mapa GU
│   ├── marketmeet/        # Página del mapa MarketMeet
│   ├── api/               # API Routes
│   │   ├── aws/           # Integración AWS SQS
│   │   ├── mongo/         # API MongoDB
│   │   ├── places/        # Google Places API
│   │   ├── properties/    # APIs de propiedades
│   │   └── whatsapp/      # WhatsApp Business API
│   └── globals.css        # Estilos globales
├── components/            # Componentes React
│   ├── layout/            # Componentes de layout del mapa
│   └── ui/                # Componentes de UI reutilizables
├── contexts/              # Contextos React
├── hooks/                 # Hooks personalizados
├── lib/                   # Utilidades y configuraciones
├── providers/             # Providers de contexto
├── service/               # Servicios externos
├── types/                 # Definiciones TypeScript
└── config/                # Configuraciones
```

## Scripts Disponibles

- `pnpm dev` - Inicia el servidor de desarrollo
- `pnpm build` - Construye la aplicación para producción
- `pnpm start` - Inicia el servidor de producción
- `pnpm lint` - Ejecuta ESLint
- `pnpm format` - Formatea el código con Prettier
- `pnpm format:check` - Verifica el formato del código

## Configuración

### Google Maps

La aplicación utiliza dos claves API de Google Maps:

- `GGA`: Para el producto principal
- `GU`: Para el producto secundario

### Bases de Datos

- **MongoDB**: Almacena las propiedades y datos relacionados
- **Firebase**: Maneja autenticación y datos en tiempo real

### WhatsApp

Integración con WhatsApp Business API para envío de notificaciones y contacto con agentes.

- ](https://github.com/UnggaMX/map-v2)
