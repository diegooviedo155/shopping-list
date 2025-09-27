# Shopping Lists App

Una aplicación móvil para gestionar listas de compras con múltiples categorías y funcionalidad drag and drop.

## Características

- 📱 Diseño móvil responsive
- 🏪 Múltiples categorías (Supermercado, Verdulería, Carnicería)
- 📅 Planificación mensual (Este mes / Próximo mes)
- ✅ Marcar productos como comprados
- 🔄 Drag and drop para reordenar
- 💾 Persistencia con Supabase y Prisma ORM
- ⚡ API Routes optimizadas

## Configuración

### 1. Configurar Supabase

1. Ve a Project Settings en v0 (ícono de engranaje en la esquina superior derecha)
2. Agrega la integración de Supabase
3. Ejecuta el script `scripts/01-create-tables.sql` desde v0

### 2. Variables de Entorno

Configura las siguientes variables en tu archivo `.env.local`:

\`\`\`env
# Supabase Database URLs
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
\`\`\`

### 3. Comandos de Prisma

\`\`\`bash
# Generar cliente de Prisma
npm run db:generate

# Sincronizar esquema con la base de datos
npm run db:push

# Abrir Prisma Studio (opcional)
npm run db:studio
\`\`\`

### 4. Estructura de Base de Datos

La tabla `shopping_items` incluye:

- `id`: Identificador único (CUID)
- `name`: Nombre del producto
- `category`: Categoría (supermercado, verduleria, carniceria)
- `status`: Estado (este-mes, proximo-mes)
- `completed`: Si está comprado o no
- `orderIndex`: Orden para drag and drop
- `createdAt` / `updatedAt`: Timestamps automáticos

## Arquitectura

### API Routes

- `GET /api/shopping-items` - Obtener todos los productos
- `POST /api/shopping-items` - Crear nuevo producto
- `PATCH /api/shopping-items/[id]` - Actualizar producto
- `DELETE /api/shopping-items/[id]` - Eliminar producto
- `POST /api/shopping-items/reorder` - Reordenar productos

### Componentes Principales

- `ShoppingListManager` - Componente principal de gestión
- `useShoppingItems` - Hook personalizado para manejo de estado
- API Routes con Prisma ORM para operaciones de base de datos

## Uso

1. Agrega productos seleccionando la categoría
2. Mueve productos entre "Este Mes" y "Próximo Mes"
3. Marca productos como comprados
4. Reordena con drag and drop
5. Los cambios se persisten automáticamente en Supabase

## Tecnologías

- Next.js 15 con App Router
- React 18 con TypeScript
- Tailwind CSS v4
- Supabase (PostgreSQL)
- Prisma ORM
- @hello-pangea/dnd para drag and drop
- Lucide React para iconos

## Desarrollo

\`\`\`bash
# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev

# Generar cliente de Prisma después de cambios en schema
npm run db:generate
