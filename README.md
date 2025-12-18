# Lo Que Falta - Lista de Compras

Una aplicación móvil moderna para gestionar tu lista de compras con múltiples categorías. Nunca olvides lo que necesitas comprar.

## 🚀 Inicio Rápido

### 1. Instalar Dependencias
```bash
pnpm install
```

### 2. Ejecutar en Desarrollo
```bash
pnpm dev
```

La aplicación estará disponible en [http://localhost:3000](http://localhost:3000)

## ✨ Características

- 📱 **PWA** - Instalable en móviles y desktop
- 🎨 **Tema Oscuro** - Diseño moderno y elegante
- 🔐 **Autenticación** - Iniciar Sesión con email/password y OAuth
- 📊 **Categorías** - Organiza tus productos por categorías
- 🔍 **Búsqueda** - Encuentra productos rápidamente
- 📈 **Estadísticas** - Ve tu progreso de compras
- ⚡ **Tiempo Real** - Sincronización automática
- 🛡️ **Seguro** - Row Level Security (RLS)

## 🏗️ Arquitectura

### Frontend
- **Next.js 15** con App Router
- **React 19** con hooks modernos
- **TypeScript** para type safety
- **Tailwind CSS** para estilos
- **Zustand** para estado global

### Backend (Opcional)
- **Supabase** como backend completo
- **PostgreSQL** como base de datos
- **Row Level Security (RLS)** para seguridad
- **Auth** integrado con OAuth

## 📱 Modo de Demostración

La aplicación funciona **sin configuración** en modo de demostración:

- ✅ **Interfaz completa** - Todas las funciones de UI
- ✅ **Navegación** - Sidebar y rutas funcionando
- ✅ **Componentes** - Formularios y modales
- ✅ **PWA** - Instalable como app nativa
- ❌ **Persistencia** - Los datos no se guardan
- ❌ **Autenticación** - Iniciar Sesión simulado

## 🔧 Configuración de Supabase (Opcional)

Para habilitar la persistencia de datos y autenticación real:

### 1. Configurar Variables de Entorno
```bash
cp env.example .env.local
```

Edita `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_del_proyecto
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima
```

### 2. Configurar Supabase
```bash
pnpm setup-supabase
```

### 3. Ejecutar Schema SQL
1. Ve a tu dashboard de Supabase
2. Ve a SQL Editor
3. Ejecuta el contenido de `supabase/schema.sql`

### 4. Configurar OAuth (Opcional)
1. Ve a Authentication > Providers
2. Habilita Google/Apple
3. Configura las URLs de redirección

## 📁 Estructura del Proyecto

```
├── app/                    # Next.js App Router
│   ├── auth/              # Páginas de autenticación
│   ├── api/               # API routes (legacy)
│   └── (pages)/           # Páginas principales
├── components/            # Componentes React
│   ├── auth/              # Componentes de autenticación
│   ├── atoms/             # Componentes atómicos
│   ├── molecules/         # Componentes moleculares
│   └── organisms/         # Componentes complejos
├── hooks/                 # Custom hooks
├── lib/                   # Utilidades y configuración
│   ├── supabase/          # Clientes de Supabase
│   ├── store/             # Stores de Zustand
│   └── types/             # Tipos TypeScript
├── supabase/              # Configuración de Supabase
│   └── schema.sql         # Esquema de la base de datos
└── scripts/               # Scripts de utilidad
```

## 🎨 Componentes

### Atomic Design
- **Atoms** - Botones, inputs, iconos
- **Molecules** - Formularios, alertas
- **Organisms** - Listas, modales, cards
- **Templates** - Layouts de página

### UI Library
- **Shadcn/ui** como base
- **Lucide React** para iconos
- **Framer Motion** para animaciones

## 🚀 Despliegue

### Vercel (Recomendado)
1. Conecta tu repositorio a Vercel
2. Configura las variables de entorno (opcional)
3. Despliega automáticamente

### Variables de Entorno para Producción
```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_produccion
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_de_produccion
```

## 🧪 Testing

```bash
# Ejecutar tests
pnpm test

# Tests en modo watch
pnpm test:watch

# Coverage
pnpm test:coverage
```

## 📱 PWA

La aplicación es una PWA completa con:
- **Manifest** para instalación
- **Service Worker** para offline
- **Iconos** optimizados para todas las plataformas
- **Meta tags** para redes sociales

## 🔧 Scripts Disponibles

```bash
# Desarrollo
pnpm dev

# Build
pnpm build

# Linting
pnpm lint

# Configurar Supabase
pnpm setup-supabase

# Regenerar iconos PWA
pnpm regenerate-icons
```

## 🆘 Solución de Problemas

### Error: "Invalid API key"
- Verifica que las variables de entorno estén correctas
- Asegúrate de que `.env.local` esté en la raíz del proyecto

### Error: "User not authenticated"
- Verifica que el middleware esté configurado
- Asegúrate de que las políticas RLS estén activas

### Error: "Table doesn't exist"
- Ejecuta el schema SQL en Supabase
- Verifica que las tablas se crearon correctamente

## 📚 Recursos

- [Documentación de Supabase](https://supabase.com/docs)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Zustand](https://zustand-demo.pmnd.rs/)
- [Shadcn/ui](https://ui.shadcn.com/)

## 📄 Licencia

MIT License - ver [LICENSE](LICENSE) para más detalles.

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📞 Soporte

Si tienes problemas o preguntas:
- Abre un issue en GitHub
- Revisa la documentación
- Consulta los logs de la consola