---
name: calidad
description: Pruebas y control de calidad de una web de cliente (fase 6) - pruebas automáticas, revisión visual con capturas en móvil, tablet y escritorio, revisor de diseño independiente, accesibilidad, SEO, rendimiento y comprobaciones de entrega. Úsala antes de dar por terminada cualquier web o propuesta, y cuando Roberto pregunte si algo funciona.
argument-hint: "[slug]"
---

# Calidad · fase 6

Nada se da por terminado porque compile o "se parezca" al diseño. Se prueba, se mira y se corrige
hasta que esté bien. Lo que no se pueda probar se dice explícitamente.

## Secuencia

1. **Pruebas automáticas** (en `clientes/<slug>/web`):
   ```bash
   npm run verificar
   ```
   `astro check` (tipos) → Vitest (unitarias + integración con BD real si hay módulos) → build →
   Playwright en 390/820/1440 px: todas las páginas del sitemap (HTTP 200, un h1, title,
   description, canonical, sin scroll horizontal, imágenes con alt y dimensiones, axe WCAG 2.1 AA sin
   fallos graves, sin errores de consola), 404, y los flujos de los módulos (p. ej. reserva completa).
   Si algo falla: busca la causa, corrígela, repite. **Nunca** relajes una prueba para que pase; si una
   prueba está mal planteada, explica por qué antes de cambiarla.

2. **Pruebas propias del proyecto**: añade en `tests/e2e/` lo específico (navegación móvil abre y
   cierra con teclado, enlaces de la carta, formularios propios con estados de error y éxito,
   enlaces de WhatsApp/teléfono con el número correcto).

3. **Revisión visual**:
   ```bash
   node tools/capturas.mjs <slug>          # todas las rutas del build, 3 anchos
   ```
   Abre con Read **cada** captura y repasa [checklist-visual.md](checklist-visual.md). Compara con
   las capturas aprobadas de `propuestas/capturas/` (fidelidad).

4. **Revisor independiente**: lanza el agente `revisor-diseno` con las rutas de las capturas finales,
   la dirección aprobada (PROYECTO.md) y las capturas de la propuesta aprobada. Corrige lo marcado como
   "debe corregirse" y repite 3–4 si hubo cambios.

5. **Rendimiento** (si hay Chrome/Chromium disponible):
   ```bash
   npx -y lighthouse http://127.0.0.1:4321/ --only-categories=performance,accessibility,best-practices,seo --form-factor=mobile --screenEmulation.mobile --quiet --chrome-flags="--headless" --output=json --output-path=informes/lighthouse.json
   ```
   (con `npm run preview` arrancado). Objetivo orientativo en móvil: rendimiento ≥ 90, resto ≥ 95.
   Si no se puede ejecutar, dilo y revisa a mano peso de imágenes, JS y fuentes.

6. **Seguridad y datos**: skill `seguridad-rgpd` (checklist completa).

7. **Comprobaciones de entrega**:
   ```bash
   node tools/qa.mjs <slug>
   ```
   Datos PENDIENTE, textos de relleno, marcadores del kit, propuestas en el build, secretos, `.env` en
   Git, imágenes pesadas, robots/sitemap/legales, `npm audit`.

## Informe
Resume en PROYECTO.md (y para la entrega en `entrega/`): qué se probó y cómo, resultados, qué se
corrigió, qué **no** se pudo probar y por qué (p. ej. "envío real de correo: falta SMTP del cliente"),
limitaciones conocidas.

## Al hablar con Roberto
Di exactamente qué está probado. "Las reservas funcionan" solo si el flujo completo pasó contra una
BD real; si los correos se guardaron en local y no se enviaron, dilo así.
