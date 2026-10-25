# Cómo se construyen las propuestas

## Archivos
```
web/src/propuestas/
├── propuestas.json          ← fichas que muestra el comparador
├── a/index.astro            ← propuesta A (página completa)
├── a/*.astro                ← componentes propios de A (si hace falta)
├── b/…  c/…
```
La integración `src/integrations/propuestas.ts` publica cada carpeta en `/propuestas/<id>` y el
comparador en `/propuestas`. Solo existen en `npm run dev` / `dev:propuestas` y en
`build:propuestas`; **nunca** en el build de producción.

`propuestas.json`:
```json
{ "propuestas": [
  { "id": "a", "titulo": "Sala y producto", "concepto": "…", "tipografia": "Newsreader + Schibsted Grotesk",
    "paleta": ["#1f2a24", "#f3efe6", "#b5523b"], "ronda": 1 }
] }
```

## Esqueleto de una propuesta
```astro
---
import Base from '../../layouts/Base.astro';
import { Image } from 'astro:assets';
import { negocio } from '../../data/negocio';
import '@fontsource-variable/newsreader';
import sala from '../../assets/fotos/sala-principal.jpg';   // foto REAL del cliente
---
<Base titulo={`Propuesta A · ${negocio.nombre}`} descripcion="Propuesta de diseño" noindex claseBody="pa">
  <header class="pa-cabecera">…</header>
  <main id="contenido">…</main>
  <footer>…</footer>
</Base>
<style>
  /* Tokens de ESTA propuesta, con prefijo propio para no chocar con las otras */
  :global(.pa) { --pa-fondo: #…; --pa-texto: #…; --pa-acento: #…; }
</style>
```

## Reglas
- **Contenido real**: nombre, textos, carta, horarios y fotos del cliente (`negocio.json`,
  `src/data/*`, `src/assets/fotos/`). Si falta algo, se ve marcado como pendiente, no se rellena.
- **Fotos**: copia las elegidas de `recursos/fotos/` a `web/src/assets/fotos/` con nombres
  descriptivos (`plato-arroz-senyoret.jpg`). Usa `<Image>`/`<Picture>` de `astro:assets` con `alt`
  descriptivo, `widths`/`sizes` y `priority` (o `loading="eager"`) solo en la imagen principal.
- Cada propuesta es una **portada completa** (cabecera, hero, 3–5 secciones representativas, pie) y
  funciona en 360–1440 px. Si el negocio lo pide, añade una segunda vista clave (p. ej. la carta).
- Las propuestas comparten datos y técnica, nunca estilos: cada una con su prefijo (`pa-`, `pb-`,
  `pc-`) y sus tokens.
- Interacción: lo justo para evaluarlas (menú móvil, el momento de movimiento elegido). Sin lógica
  de negocio todavía.
- Sin errores de consola, sin scroll horizontal, contraste AA.

## Capturas y revisión
```bash
node tools/capturas.mjs <slug> --propuestas            # nueva ronda en propuestas/capturas/ronda-N/
node tools/capturas.mjs <slug> --propuestas --ronda 1  # sobrescribir una ronda concreta
```
Abre cada PNG con Read. Después, agente `revisor-diseno` con las rutas.

## Compartir con Roberto fuera de su PC
`npm run build:propuestas` genera `dist-propuestas/`. Si el proyecto tiene servidor, las páginas de
propuestas siguen siendo estáticas dentro de `dist-propuestas/client/`. Publica esa carpeta como
artifact privado (página principal: `propuestas.html`) o comparte las capturas.
