# Verificación del sistema · 25 oct 2026

Entorno: Linux, Node 22.23.4, Astro 7.4.2, MariaDB 10.11 local, Chromium (Playwright 1.63).

## Qué se probó

| Prueba | Cómo | Resultado |
|---|---|---|
| Crear proyecto limpio | `nuevo-proyecto.mjs verificacion-kit --instalar` | ✅ estructura, Git propio, hook pre-commit, dependencias |
| Añadir módulo de reservas | `modulo.mjs añadir reservas` | ✅ archivos, dependencias, `trixel.json › servidor`, `.env`/`.env.test` con secretos aleatorios, SQL de BD local |
| Tipos | `astro check` (TypeScript strictest) | ✅ 0 errores, 0 avisos |
| Unitarias | Vitest: fechas, disponibilidad, aforo por servicio y franja, cierres, antelación, tokens, contraseñas, limitador, validación | ✅ 21 |
| Integración con BD real | Vitest contra MariaDB: crear, avisos, **14 solicitudes simultáneas con aforo 20 → exactamente 10 aceptadas**, duplicados, tokens falsos/rápidos, confirmar + cancelar con enlace, enlace antiguo invalidado, transiciones inválidas, reservas telefónicas y forzar aforo, anonimización RGPD | ✅ 8 |
| Navegador (390/820/1440) | Playwright + axe en todas las páginas: HTTP 200, h1 único, SEO, canonical, sin scroll horizontal, imágenes, WCAG 2.1 AA sin fallos graves, sin errores de consola, 404 | ✅ |
| Flujo completo de reservas | Playwright: cliente reserva con disponibilidad real → correos → login fallido → login → confirmar → correo → cancelar por enlace → enlace caducado; API rechaza formulario no JSON y bots | ✅ |
| Arranque de producción | `node server.mjs`: migraciones + servidor; `/api/salud` ok; `/admin` → 303 con cabeceras de seguridad | ✅ |
| Propuestas | Rutas `/propuestas/<id>` y comparador en dev y en `build:propuestas`; **ausentes** del build de producción | ✅ |
| Capturas | `capturas.mjs` en modo propuestas (dev) y build (preview) | ✅ |
| QA de entrega | `qa.mjs` detecta PENDIENTE, dominio de ejemplo, modo demo, marcador del kit, legales, secretos, `.env` en Git, `npm audit` | ✅ |
| Aislamiento | Segundo proyecto sin datos del primero, secretos distintos, repos Git independientes, `clientes/` fuera del repo del estudio | ✅ |

## Problemas encontrados y corregidos durante la verificación
- Tablas legales desplazables sin acceso por teclado (axe) → región enfocable con etiqueta.
- Botón "Solicitar reserva" blanco sobre blanco y panel de éxito visible antes de enviar: **los tests
  pasaban; lo detectó la revisión de capturas** → colores por defecto concretos, `[hidden]` forzado y
  test reforzado.
- Comparador en vista escritorio desbordado → columna acotada.
- Enlaces del comparador rotos en el build estático → enlaces relativos según entorno.
- Redirección del panel sin cabeceras de seguridad → middleware reestructurado.
- Una web **sin** módulos de servidor fallaba `astro check` (la configuración importaba `@astrojs/node`
  aunque no estuviera instalado) → importación condicional; probados los dos modos (estático y servidor).
- `$` en el hash de contraseña podía expandirse en `.env` → formato con `:`.

## Pendiente de verificar fuera de este entorno
- Envío real de correo por SMTP (sin buzón aquí; los correos se guardaron en `.correos/`).
- Publicación real en Hostinger Business/Cloud.
- Uso en Windows (PowerShell) en el PC de Roberto: scripts preparados (`cross-env`, `shell` en
  Windows), pendiente de ejecutar allí.
- Claude Code en el PC cargando las skills del proyecto.
- Lighthouse (no ejecutado aquí).
- Caso de prueba con el restaurante real: propuestas visuales, desarrollo y entrega.
