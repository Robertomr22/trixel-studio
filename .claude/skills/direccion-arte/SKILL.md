---
name: direccion-arte
description: Dirección de arte y propuestas visuales de una web de cliente (fases 3 y 4). Úsala para crear las 3 propuestas visuales diferenciadas en /propuestas, para iterar sobre los comentarios de Roberto ("me gusta la B pero con la tipografía de la A", "más premium", "demasiado genérica") y para registrar la dirección aprobada. También al revisar si un diseño parece genérico o hecho por IA.
argument-hint: "[slug] [comentarios de la ronda anterior]"
---

# Dirección de arte · fases 3 y 4

El estándar: que un estudio de diseño serio pudiera firmar el resultado. Cada web tiene una
**idea visual propia** que nace del negocio, no de una plantilla. Lee antes
[anti-patrones.md](anti-patrones.md) y tenlo abierto durante todo el proceso.

## Fase 3 · Propuestas

### 3.1 Entender (antes de dibujar nada)
1. Lee `brief.md`, `PROYECTO.md` y el inventario de `recursos/`. Abre las fotos clave con Read.
2. Escribe en 4–6 líneas el **posicionamiento**: quién es, para quién, qué le hace distinto, qué
   sensación debe dejar, qué acción importa.
3. **Referencias**: si hay Internet, busca 4–8 referencias reales de calidad del sector y de fuera
   (estudios de diseño, publicaciones gastronómicas, arquitectura, editorial). Anota qué principio
   extraes de cada una (no qué copias). Nunca reproduzcas la identidad de otra marca.
4. Busca la **materia prima del sector**: oficios, materiales, objetos, vocabulario, lugar (la
   Axarquía no es Madrid), época. De ahí salen las decisiones distintivas.

### 3.2 Plan de tres direcciones (por escrito, antes de programar)
Para cada dirección (A, B, C) define en un bloque compacto:
- **Concepto** en una frase y la **única cosa memorable** de la web (donde se gasta la audacia).
- **Color**: 4–6 valores hex con nombre y uso (fondo, texto, acento, apoyo). Contraste AA verificado.
- **Tipografía**: familias de [tipografia.md](tipografia.md) (o justificadas), roles, escala (clamp)
  y tratamiento (tracking, peso, cursiva, tamaño de cuerpo).
- **Composición**: estructura de portada y de 3–4 secciones con esquemas ASCII. Alineación, rejilla,
  ritmo vertical. Cada sección con la forma que pide su contenido (ver anti-patrones).
- **Fotografía**: qué foto abre, cómo se recorta, tamaño, tratamiento, relación texto-imagen.
- **Navegación e interacción**: tipo de cabecera, menú móvil, el único momento de movimiento.

Las tres deben diferir en **composición, tipografía, uso de la foto y navegación**, no solo en
color. Guía de partida: A = la apuesta segura y muy bien ejecutada; B = más personalidad;
C = una lectura alternativa del negocio. [direcciones.md](direcciones.md) describe familias de estilo
como punto de partida (no plantillas).

**Autocrítica obligatoria**: para cada plan pregúntate "¿llegaría a esto mismo con cualquier otro
restaurante/clínica/taller?". Si sí, cambia esa parte y anota qué cambiaste y por qué. Repasa la
lista de [anti-patrones.md](anti-patrones.md) punto por punto.

### 3.3 Construir las propuestas (páginas reales)
Sigue [propuestas-tecnico.md](propuestas-tecnico.md). En resumen:
- Cada propuesta es una portada completa y realista en `web/src/propuestas/<id>/index.astro`, con
  el contenido y las fotos **reales** del cliente, responsive desde 360 px.
- Ficha de cada una en `web/src/propuestas/propuestas.json` (título, concepto, tipografía, paleta).
- Comparador en `http://localhost:4321/propuestas` (`npm run dev:propuestas`).

### 3.4 Revisión antes de enseñar
1. `node tools/capturas.mjs <slug> --propuestas` → abre con Read **todas** las capturas (390 y
   1440 como mínimo) y revisa con la lista visual de la skill `calidad`.
2. Lanza el agente **revisor-diseno** con: rutas de las capturas, el posicionamiento y el plan de
   cada dirección. Corrige lo que marque como "debe corregirse".
3. Repite capturas hasta que no haya problemas graves.

### 3.5 Presentar a Roberto
- Si trabaja en su PC: `cd clientes/<slug>/web && npm run dev:propuestas` y la URL del comparador.
- Si está en el móvil o en la nube: `npm run build:propuestas` y publica `dist-propuestas` como
  artifact privado, o envíale las capturas.
- Para cada propuesta: 2–3 líneas (idea, por qué encaja con el cliente, qué la distingue) y tu
  recomendación razonada. Pide su elección o cambios.

## Fase 4 · Revisión y aprobación

1. **Interpreta** cada comentario en decisiones concretas antes de tocar código y confírmalas en
   una línea si hay ambigüedad. Traducciones habituales:
   - "más premium" → más aire, menos elementos, tipografía más fina o de mayor contraste, fotos más
     grandes y mejor recortadas, paleta más contenida, detalles de precisión (no dorados ni brillos).
   - "más personalidad" → acentuar la única cosa memorable, composición menos simétrica, tipografía
     con carácter, un recurso gráfico propio del negocio.
   - "parece genérica" → volver a 3.1: ¿qué tiene este negocio que no tenga otro? Llevarlo al hero.
   - "más clásico" → serif de texto, simetría puntual, ornamentación mínima y con sentido, ritmo
     regular.
   - "la A con la tipografía de la C" → aplicarlo y comprobar que la combinación sigue siendo
     coherente; si no lo es, ajústala y explica por qué.
2. Cada ronda nueva: actualiza las propuestas (o crea `a2`, `b2` si conviene comparar), capturas de
   la nueva ronda, revisor, y registra en `propuestas/rondas.md` qué se pidió y qué se cambió.
3. **Aprobación**: solo cuando Roberto diga explícitamente que aprueba una dirección. Entonces escribe
   en `PROYECTO.md › Dirección visual aprobada`: propuesta, cambios incluidos, tokens finales (color,
   tipografía, escala), principios de composición, referencias a capturas, fecha. Commit.
   **Sin esta aprobación no empieza la fase 5.**
