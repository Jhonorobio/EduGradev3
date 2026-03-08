# Guía de Estilos y Diseño - EduGrade

## Principios Fundamentales

### 🎨 **Consistencia Visual**
- Siempre usar componentes de `@/components/ui/` (shadcn/ui)
- Mantener paleta de colores consistente con el dashboard
- Usar los mismos patrones de layout y espaciado

### 📐 **Estructura de Componentes**
- Header + Main layout para páginas principales
- Card + CardHeader + CardContent para tarjetas de información
- Grid system: `grid gap-4 md:grid-cols-2 lg:grid-cols-4`

## Patrones de Diseño Establecidos

### 📊 **Tarjetas de Información (Dashboard Style)**
```tsx
<Card>
  <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
    <CardTitle className='text-sm font-medium'>
      Título de la Métrica
    </CardTitle>
    <Icon className='h-4 w-4 text-muted-foreground' />
  </CardHeader>
  <CardContent>
    <div className='text-2xl font-bold'>{valor}</div>
    <p className='text-xs text-muted-foreground'>
      Descripción corta
    </p>
  </CardContent>
</Card>
```

### 🗂️ **Layout de Página**
```tsx
<ProtectedRoute>
  <Header>
    <Search />
    <div className='ms-auto flex items-center gap-4'>
      <ThemeSwitch />
      <ConfigDrawer />
      <ProfileDropdown />
    </div>
  </Header>
  <Main fixed>
    {/* Contenido de la página */}
  </Main>
</ProtectedRoute>
```

### 📋 **Tablas y Formularios**
- Usar `table className='w-full border-collapse border border-gray-300'`
- Inputs: `className='w-full border rounded px-3 py-2'`
- Botones: Variants `default`, `outline`, `destructive`, `ghost`

### �️ **Layout de Página**
```tsx
<ProtectedRoute>
  <Header>
    {/* Header content */}
  </Header>
  <Main fluid>
    {/* Page content - scroll a nivel de página */}
  </Main>
</ProtectedRoute>
```

### �📜 **Scroll y Overflow**
- **Página completa**: Usar `<Main fluid>` para scroll a nivel de página
- **Contenedor principal**: `space-y-6 pb-20` (padding bottom para espacio)
- **Tablas grandes**: `overflow-x-auto` (solo scroll horizontal si es necesario)
- **Headers sticky**: Solo si el scroll es dentro de un componente con altura fija

## 🎯 **Componentes UI Disponibles**

### Cards
- `Card`, `CardHeader`, `CardContent`, `CardTitle`, `CardDescription`

### Forms
- `Input`, `Select`, `Textarea`, `Checkbox`, `RadioGroup`

### Navigation
- `Button`, `Badge`, `Separator`, `Tabs`

### Feedback
- `Dialog`, `Alert`, `Toast` (via sonner)

### Data Display
- `Table`, `Skeleton`, `Progress`

## 🎨 **Colores y Tipografía**

### Colores Semánticos
- `text-muted-foreground` para texto secundario
- `text-destructive` para errores/acciones peligrosas
- `text-primary` para texto principal

### Tamaños de Texto
- Títulos: `text-2xl font-bold tracking-tight`
- Subtítulos: `text-lg font-semibold`
- Cards: `text-sm font-medium`
- Descripciones: `text-xs text-muted-foreground`

## 📱 **Responsividad**

### Breakpoints
- `sm:` - 640px+
- `md:` - 768px+
- `lg:` - 1024px+
- `xl:` - 1280px+

### Patrones Comunes
- Grid: `grid gap-4 md:grid-cols-2 lg:grid-cols-4`
- Flex: `flex flex-col md:flex-row`
- Espaciado: `space-y-4 md:space-y-0 md:space-x-4`

## 🔧 **Iconos**

### Librería
- Usar `lucide-react` para todos los iconos
- Tamaño estándar: `h-4 w-4` para headers, `h-5 w-5` para cards

### Iconos Comunes
- Navegación: `ArrowLeft`, `ArrowRight`
- Acciones: `Plus`, `Edit`, `Trash2`, `Save`
- Datos: `Users`, `BookOpen`, `Calculator`
- Sistema: `Settings`, `Search`, `Menu`

## 🚀 **Best Practices**

### ✅ **Siempre Hacer**
1. Usar `ProtectedRoute` para páginas autenticadas
2. Mantener estructura Header + Main
3. Usar componentes shadcn/ui existentes
4. Seguir patrones de espaciado consistentes
5. Añadir loading states y error handling
6. Usar `toast` para notificaciones de usuario

### ❌ **Nunca Hacer**
1. Crear componentes UI personalizados si existe en shadcn/ui
2. Usar colores hardcodeados (usar variables de CSS)
3. Ignorar responsividad
4. Omitir manejo de errores
5. Crear layouts inconsistentes

## 📁 **Estructura de Archivos**

```
src/
├── components/ui/          # Componentes UI reutilizables
├── components/layout/     # Layout components
├── features/              # Feature-specific components
│   ├── feature-name/
│   │   ├── feature.tsx
│   │   └── components/
├── routes/                # Route definitions
└── services/              # API services
```

## 🎯 **Checklist Antes de Finalizar**

- [ ] Usa componentes shadcn/ui existentes
- [ ] Sigue estructura Header + Main + ProtectedRoute
- [ ] Tarjetas usan patrón CardHeader + CardContent
- [ ] Es responsivo (mobile-first)
- [ ] Maneja loading y error states
- [ ] Usa toast para feedback al usuario
- [ ] Iconos son de lucide-react
- [ ] Espaciado es consistente
- [ ] No hay estilos inline
- [ ] TypeScript types están definidos

## 🔍 **Referencias**

### Dashboard (Ejemplo Principal)
- Ubicación: `src/features/dashboard/index.tsx`
- Patrones a replicar: tarjetas, layout, navegación

### Componentes UI
- Ubicación: `src/components/ui/`
- Referencia para todos los componentes disponibles

---

**Recordatorio:** Siempre revisar componentes existentes antes de crear nuevos. La consistencia es clave para una experiencia de usuario unificada.
