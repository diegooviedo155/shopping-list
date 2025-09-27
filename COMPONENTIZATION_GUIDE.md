# 🧩 Guía de Componentización - Shopping Lists App

## 📋 Metodología Atomic Design

Hemos implementado la metodología **Atomic Design** para crear una jerarquía de componentes bien estructurada y reutilizable.

### 🧬 **1. Átomos (Atoms)**
Componentes básicos e indivisibles que no pueden ser descompuestos más.

#### **Button**
```typescript
<Button 
  loading={isLoading}
  leftIcon={<Icon icon={Plus} />}
  rightIcon={<Icon icon={ArrowRight} />}
  fullWidth
>
  Agregar Producto
</Button>
```

**Características:**
- Estados de carga integrados
- Iconos izquierda/derecha
- Ancho completo opcional
- Todas las props de Radix UI

#### **Input**
```typescript
<Input
  label="Nombre del producto"
  error={errors.name?.message}
  leftIcon={<Icon icon={Search} />}
  helperText="Mínimo 2 caracteres"
  required
/>
```

**Características:**
- Labels y errores integrados
- Iconos izquierda/derecha
- Texto de ayuda
- Validación visual

#### **Badge**
```typescript
<Badge
  variant="custom"
  backgroundColor="#10b98115"
  color="#10b981"
  borderColor="#10b98130"
>
  Supermercado
</Badge>
```

**Características:**
- Variantes predefinidas
- Colores personalizados
- Bordes personalizables

#### **Icon**
```typescript
<Icon 
  icon={ShoppingCart} 
  size="md" 
  color="#10b981" 
/>
```

**Características:**
- Tamaños estandarizados
- Colores personalizables
- Integración con Lucide React

### 🧬 **2. Moléculas (Molecules)**
Combinaciones de átomos que forman componentes funcionales.

#### **FormField**
```typescript
<FormField
  label="Producto"
  placeholder="Agregar producto..."
  error={errors.name?.message}
  required
  helperText="Mínimo 2 caracteres"
/>
```

**Características:**
- Label + Input + Error integrados
- Validación visual
- Texto de ayuda

#### **ButtonGroup**
```typescript
<ButtonGroup
  options={[
    { value: 'supermercado', label: 'Supermercado', icon: '🛒' },
    { value: 'verduleria', label: 'Verdulería', icon: '🥬' }
  ]}
  value={selectedCategory}
  onChange={setSelectedCategory}
  variant="outline"
  size="sm"
/>
```

**Características:**
- Opciones configurables
- Iconos opcionales
- Orientación horizontal/vertical
- Estados deshabilitados

#### **ProgressBar**
```typescript
<ProgressBar
  value={completed}
  max={total}
  size="md"
  variant="success"
  showLabel
  label="Progreso"
/>
```

**Características:**
- Valores y máximo configurables
- Variantes de color
- Labels opcionales
- Accesibilidad integrada

#### **StatusIndicator**
```typescript
<StatusIndicator
  status="completed"
  label="Completado"
  size="md"
  showLabel
/>
```

**Características:**
- Estados predefinidos
- Iconos automáticos
- Labels opcionales
- Colores consistentes

### 🦠 **3. Organismos (Organisms)**
Componentes complejos que combinan moléculas y átomos.

#### **ItemCard**
```typescript
<ItemCard
  item={shoppingItem}
  isDragging={false}
  showDragHandle={true}
  showStatus={true}
  showMoveButton={true}
  showDeleteButton={true}
  onToggleCompleted={handleToggle}
  onMoveToStatus={handleMove}
  onDelete={handleDelete}
/>
```

**Características:**
- Props configurables para mostrar/ocultar elementos
- Drag and drop integrado
- Acciones personalizables
- Estados visuales

#### **CategoryCard**
```typescript
<CategoryCard
  category={{
    id: 'supermercado',
    name: 'Supermercado',
    color: '#10b981'
  }}
  stats={{
    completed: 5,
    total: 10
  }}
  isLoading={false}
  onClick={handleCategoryClick}
/>
```

**Características:**
- Estadísticas integradas
- Barra de progreso automática
- Estados de carga
- Interacciones configurables

#### **AddItemForm**
```typescript
<AddItemForm
  onAddItem={handleAddItem}
  isLoading={isSubmitting}
/>
```

**Características:**
- Formulario completo
- Validación integrada
- Estados de carga
- Categorías y estados predefinidos

#### **ItemList**
```typescript
<ItemList
  items={shoppingItems}
  activeTab="este-mes"
  onToggleCompleted={handleToggle}
  onMoveToStatus={handleMove}
  onDelete={handleDelete}
  onReorder={handleReorder}
/>
```

**Características:**
- Drag and drop integrado
- Lista vacía automática
- Acciones configurables
- Estados de carga

### 🏗️ **4. Templates**
Estructuras de página que definen el layout.

#### **PageHeader**
```typescript
<PageHeader
  title="Listas de Compras"
  subtitle="Gestiona tus compras"
  showBackButton
  onBack={handleBack}
  progress={{
    current: 5,
    total: 10,
    label: 'completados'
  }}
  actions={<Button>Acción</Button>}
/>
```

**Características:**
- Título y subtítulo
- Botón de retroceso
- Barra de progreso
- Acciones personalizables

#### **PageLayout**
```typescript
<PageLayout
  header={<PageHeader />}
  footer={<Footer />}
  maxWidth="md"
>
  <Content />
</PageLayout>
```

**Características:**
- Layout responsive
- Anchos máximos configurables
- Header y footer opcionales
- Contenido principal

## 🎯 **Patrones de Composición**

### **1. Composición por Props**
```typescript
<ItemCard
  showDragHandle={isDraggingEnabled}
  showStatus={showStatusIndicators}
  onToggleCompleted={handleToggle}
/>
```

### **2. Composición por Children**
```typescript
<PageLayout>
  <PageHeader title="Mi Página" />
  <main>
    <AddItemForm />
    <ItemList />
  </main>
</PageLayout>
```

### **3. Composición por Render Props**
```typescript
<ItemList
  items={items}
  renderItem={(item) => <CustomItemCard item={item} />}
/>
```

## 🔧 **Beneficios de la Componentización**

### **Reutilización**
- Componentes atómicos reutilizables en toda la app
- Reducción de código duplicado
- Consistencia visual

### **Mantenibilidad**
- Cambios centralizados
- Fácil localización de bugs
- Testing granular

### **Escalabilidad**
- Fácil agregar nuevas funcionalidades
- Componentes modulares
- Arquitectura preparada para crecimiento

### **Desarrollador Experience**
- API consistente
- Props bien tipadas
- Documentación integrada

## 📊 **Estructura de Archivos**

```
src/presentation/components/
├── atoms/                    # Componentes básicos
│   ├── Button/
│   ├── Input/
│   ├── Badge/
│   └── Icon/
├── molecules/                # Combinaciones de átomos
│   ├── FormField/
│   ├── ButtonGroup/
│   ├── ProgressBar/
│   └── StatusIndicator/
├── organisms/                # Componentes complejos
│   ├── ItemCard/
│   ├── CategoryCard/
│   ├── AddItemForm/
│   └── ItemList/
├── templates/                # Layouts de página
│   ├── PageHeader/
│   └── PageLayout/
└── features/                 # Páginas completas
    ├── shopping-list/
    └── home/
```

## 🚀 **Uso Recomendado**

### **Para Nuevos Componentes:**
1. Identificar el nivel (átomo, molécula, organismo)
2. Crear en la carpeta correspondiente
3. Seguir el patrón de props consistente
4. Documentar con TypeScript
5. Exportar desde index.ts

### **Para Modificaciones:**
1. Mantener la API existente
2. Agregar props opcionales para nuevas funcionalidades
3. No romper la compatibilidad hacia atrás
4. Actualizar documentación

---

*Esta componentización proporciona una base sólida, escalable y mantenible para el desarrollo de la aplicación.*
