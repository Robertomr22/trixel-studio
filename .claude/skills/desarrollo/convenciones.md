# Convenciones de código

## General
- TypeScript estricto (`astro/tsconfigs/strictest`). Sin `any`, sin `@ts-ignore`, sin desactivar reglas.
- Nombres en español, claros: `FormularioReserva`, `horariosDelDia`, `--color-fondo`.
- Componentes pequeños con una responsabilidad. Si un archivo pasa de ~250 líneas, divídelo.
- Sin dependencias para lo que la plataforma ya hace (fechas con `Intl`, menús con `<details>` o
  20 líneas de JS, carruseles casi nunca).
- JavaScript en cliente solo donde aporta (menú móvil, formularios, mapa bajo demanda). Scripts de
  Astro (`<script>`) sin framework; si una isla compleja lo justifica, explica por qué.

## CSS
- Tokens en `:root` dentro de `marca.css`: `--color-*`, `--fuente-*`, `--paso-*` (escala tipográfica
  con `clamp`), `--espacio-*`, `--ancho-contenido`.
- Estilos de componente con `<style>` de Astro (con ámbito). `:global()` solo cuando haga falta.
- Mobile-first. Propiedades lógicas (`margin-inline`, `padding-block`). `clamp()` para tamaños
  fluidos. Container queries cuando un componente se usa en anchos distintos.
- Sin `!important` salvo utilidades de accesibilidad.
- Estados `:hover`, `:focus-visible`, `:active` y `[aria-current]` diseñados, no por defecto.
- `@media (prefers-reduced-motion: reduce)` lo cubre la base; las animaciones propias deben tener
  sentido sin movimiento.

## HTML y accesibilidad
- Un `h1` por página, jerarquía de encabezados sin saltos.
- Landmarks: `header`, `nav` (con `aria-label` si hay varios), `main id="contenido"`, `footer`.
- Enlaces que parecen botones son enlaces; acciones son `<button>`.
- Objetivos táctiles ≥ 44×44 px. Contraste AA (4,5:1 texto, 3:1 texto grande y UI).
- Menú móvil accesible: botón con `aria-expanded` y `aria-controls`, cierre con Escape, foco gestionado.
- Formularios: `label` asociado, `autocomplete`, mensajes de error en texto y con `role="alert"`.
- Idioma correcto (`lang`) y textos en otros idiomas marcados.

## Rendimiento
- Presupuesto orientativo por página: < 100 KB de JS, imagen principal < 250 KB, LCP < 2,5 s en 4G.
- Precarga solo la fuente y la imagen principal.
- Nada de scripts de terceros sin necesidad (cada uno: rendimiento, privacidad y cookies).

## Git
- Commits pequeños y descriptivos en el repo del cliente. Punto de control antes de cambios grandes.
