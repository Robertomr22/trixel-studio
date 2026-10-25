---
name: desarrollo
description: Convierte la dirección visual APROBADA de una web de cliente en la web real (fase 5) - estructura de páginas, layout, componentes, estilos de marca, imágenes optimizadas, contenido real y conexión con los módulos. Úsala solo cuando PROYECTO.md registre una dirección aprobada.
argument-hint: "[slug]"
---

# Desarrollo · fase 5

## Antes de empezar
1. Comprueba en `PROYECTO.md` que hay **dirección aprobada**. Si no, vuelve a `direccion-arte`.
2. Relee la propuesta aprobada (código en `src/propuestas/<id>/` y capturas de la última ronda) y los
   cambios pedidos. La web final debe respetar composición, tipografías, colores, espacios e
   interacciones aprobados; si para construirla hay que cambiar algo importante, **pregunta antes**.
3. Planifica las páginas y secciones (lista breve en PROYECTO.md › Funcionalidades si aplica) y crea
   las tareas.
4. Punto de control: `git -C clientes/<slug> commit -am "Antes del desarrollo"`.

## Estructura del código (convenciones en [convenciones.md](convenciones.md))
```
web/src/
├── styles/marca.css        ← tokens aprobados (color, tipo, espacio, radios) + estilos globales
├── layouts/Sitio.astro     ← envuelve Base.astro: fuentes, cabecera, pie, navegación móvil
├── components/<seccion>/   ← componentes del sitio (Cabecera, Hero, Carta, Horario…)
├── data/                   ← contenido estructurado y tipado (carta.ts, servicios.ts…)
├── assets/fotos/           ← imágenes procesadas por astro:assets
└── pages/                  ← index.astro, carta.astro, … (reservar.astro si hay reservas)
```
- Extrae los tokens de la propuesta aprobada a `marca.css`; los componentes usan variables, no
  valores sueltos.
- Cambia `layouts/Legal.astro` para que use `Sitio.astro` (las páginas legales heredan cabecera y pie)
  y rediseña `pages/404.astro` con la dirección de arte.
- Sustituye `pages/index.astro` (el marcador `TRIXEL-MARCADOR` hace fallar `tools/qa.mjs`).
- Reutiliza los componentes técnicos del kit (`MapaBajoDemanda`, `FormularioReserva`…) adaptando su
  aspecto con sus variables/clases. **Nunca** copies y modifiques su lógica: si falta algo, mejora el
  módulo en `kit/` y documenta el cambio.

## Contenido
- Todo dato del negocio sale de `negocio.json` o de `src/data/*` (tipado con zod o TypeScript).
  Nada escrito a mano dentro de componentes que luego haya que buscar.
- Textos: los del cliente, o redactados por ti a partir de lo que ha dicho, concretos y sin relleno
  (ver anti-patrones). Lista en PROYECTO.md los textos que el cliente debe validar.
- Datos que falten: `PENDIENTE:` visible en desarrollo; la entrega queda bloqueada hasta resolverlos.

## Imágenes ([imagenes.md](imagenes.md))
`<Image>`/`<Picture>` de `astro:assets`, formatos modernos (AVIF/WebP con fallback), `widths` y
`sizes` reales, dimensiones fijadas (sin saltos de diseño), `loading="lazy"` salvo la principal,
`alt` útil. Calidad alta: la fotografía es parte del diseño.

## Funcionalidades
Usa `funciones-negocio` para cada función (alcance, módulo, configuración, integración en el diseño).
Si hace falta servidor: `node tools/modulo.mjs añadir <modulo> <slug>` y `npm install`.

## Calidad mientras construyes
- Trabaja en móvil y escritorio a la vez: comprueba cada sección en 390 y 1440 con
  `node tools/capturas.mjs <slug> --rutas /,/carta` (tras `npm run build`) o en `npm run dev`.
- `npm run check` sin errores en todo momento.
- Haz commits por bloques terminados ("Portada", "Carta", "Reservas integradas").

## Puerta de salida
Todas las páginas construidas con contenido real, `npm run check` y `npm run build` sin errores,
fidelidad a lo aprobado revisada contra las capturas de la propuesta. Pasa a la skill `calidad`.
