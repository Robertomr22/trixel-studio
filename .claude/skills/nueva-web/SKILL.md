---
name: nueva-web
description: Inicia o retoma una web de cliente de Trixel. Úsala cuando Roberto pida una web nueva ("quiero una web para…"), cuando diga /nueva-web, o cuando quiera continuar un proyecto existente de clientes/. Cubre las fases 1 (descubrimiento y brief) y 2 (material del cliente) y deja el proyecto listo para las propuestas visuales.
argument-hint: "[slug-del-proyecto o descripción del encargo]"
---

# Nueva web · fases 1 y 2

Objetivo: entender el negocio lo bastante bien como para diseñar con criterio, con el **mínimo de
preguntas** y **sin inventar nada**. Al terminar: `brief.md` completo, material inventariado y
proyecto listo para `direccion-arte`.

## 0. ¿Proyecto nuevo o existente?

- Si `$ARGUMENTS` es un slug de `clientes/` → lee su `PROYECTO.md` y continúa en la fase indicada
  (si ya está en fase 3 o posterior, pasa a la skill correspondiente).
- Si es un encargo nuevo:
  1. Propón un slug corto (`casa-lola`, `reformas-nerja`).
  2. `node tools/nuevo-proyecto.mjs <slug> --nombre "<nombre>" --sector <sector> --instalar`
  3. A partir de aquí trabaja SOLO en `clientes/<slug>/`.

## 1. Descubrimiento

1. **Analiza la petición** antes de preguntar. Extrae lo que ya se sabe y escríbelo en `brief.md`.
   Deduce lo razonable del sector (p. ej. un restaurante quiere reservas o llamadas), pero márcalo
   como supuesto.
2. **Clasifica lo que falta** (ver [preguntas.md](preguntas.md)):
   - *Crítico* (cambia el resultado y no puedes decidirlo tú): objetivo principal, alcance de cada
     funcionalidad, contenido real disponible, hosting si hay funciones con servidor, dirección de estilo
     si no la ha dado.
   - *Secundario*: lo decides tú con una recomendación profesional de una línea.
3. **Pregunta solo lo crítico**, agrupado, con AskUserQuestion (máx. 4 preguntas, 2–4 opciones,
   la recomendada primera con "(Recomendado)"). Si la petición ya es clara, no preguntes: avanza.
4. **Funcionalidades complejas**: antes de aceptarlas, fija el alcance con la matriz de
   `funciones-negocio` (p. ej. reservas: solicitud simple / solicitud + confirmación / disponibilidad
   automática). Explica coste de mantenimiento y dependencias.
5. **Hosting**: si alguna función necesita servidor (reservas, panel, formularios propios), confirma
   que el hosting lo admite antes de diseñar la arquitectura (ver skill `entrega`, hostinger.md).
6. Completa `brief.md` (lo desconocido como **PENDIENTE**) y resume a Roberto en 5–8 líneas qué has
   entendido y qué supones. Si corrige algo, actualiza.

## 2. Material

1. Pide el material con la lista de [material.md](material.md) adaptada al sector, diciendo **cómo**
   enviarlo (originales, no capturas de WhatsApp; logo en vector; carta en PDF o foto nítida).
2. Cuando llegue, cópialo a `recursos/` (fotos, logo, textos, referencias) sin modificar los
   originales.
3. **Examina cada foto** (ábrela con Read): contenido, nitidez, luz, encuadre, resolución, si sirve
   como imagen principal, recortes posibles. Rellena el inventario de `recursos/LEEME.md`.
4. Vuelca los datos reales a `web/src/data/negocio.json` (nombre, contacto, dirección, horarios,
   titular legal). Lo que falte: `"PENDIENTE: …"`.
5. Si falta material importante, propón alternativas y di cuáles necesitan su aprobación:
   - Fotos: sesión fotográfica (lo mejor), fotos de móvil guiadas (te paso indicaciones), bancos con
     licencia comercial verificada (Unsplash/Pexels) **solo** para ambiente genérico, nunca para
     platos, local o equipo, y siempre listadas como provisionales.
   - Textos: los redacto a partir de lo que cuente el cliente y él los valida.
6. Actualiza `PROYECTO.md` (fase, decisiones, pendientes del cliente) y haz commit en el repo del
   cliente: `git -C clientes/<slug> add -A && git -C clientes/<slug> commit -m "Fase 1-2: brief y material"`.

## Puerta de salida

Pasa a `direccion-arte` cuando: el objetivo y las funcionalidades están claros, hay suficiente
material real para que las propuestas sean realistas (o Roberto acepta seguir con provisionales
marcadas) y los datos legales del titular están pedidos.
