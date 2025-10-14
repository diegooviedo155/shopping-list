import type { Category } from "@/lib/types/category";

// Mapeo de iconos de Lucide a emojis para consistencia
export const ICON_MAP: Record<string, string> = {
  'shopping-cart': '🛒',
  'carrot': '🥕',
  'beef': '🥩',
  'bread': '🍞',
  'pill': '💊',
  'package': '📦',
  'apple': '🍎',
  'milk': '🥛',
  'fish': '🐟',
  'chicken': '🐔',
  'cheese': '🧀',
  'egg': '🥚',
  'vegetable': '🥬',
  'fruit': '🍊',
  'meat': '🥩',
  'tv': '📺',
  'book': '📚',
  'pills': '💊',
};

// Función para obtener emoji de icono
export function getIconEmoji(icon?: string): string {
  if (!icon) return '🛒'; // Default
  return ICON_MAP[icon] || '🛒';
}

// Función para obtener color por defecto si no está definido
export function getCategoryColor(slug: string): string {
  const colorMap: Record<string, string> = {
    'supermercado': '#3B82F6',
    'verduleria': '#10B981', 
    'carniceria': '#EF4444',
    'farmacia': '#8B5CF6',
    'libreria': '#F59E0B',
    'electrodomesticos': '#6B7280',
    'panaderia': '#F59E0B',
  };
  return colorMap[slug] || '#6B7280';
}

// Función para formatear categoría para UI
export function formatCategoryForUI(category: Category) {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    color: category.color || getCategoryColor(category.slug),
    icon: getIconEmoji(category.icon),
    isActive: category.isActive,
    orderIndex: category.orderIndex,
  };
}

// Función para convertir slug de categoría a tipo de database
export function categorySlugToDatabaseType(slug: string): "supermercado" | "verduleria" | "carniceria" | "farmacia" | "libreria" | "electrodomesticos" {
  const validSlugs = ["supermercado", "verduleria", "carniceria", "farmacia", "libreria", "electrodomesticos"];
  if (validSlugs.includes(slug)) {
    return slug as "supermercado" | "verduleria" | "carniceria" | "farmacia" | "libreria" | "electrodomesticos";
  }
  return "supermercado"; // Default fallback
}
