// src/figma-ui/utils.ts

// Función simple para unir clases de Tailwind de forma segura.
// Es suficiente para los componentes del diseño.
export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}
