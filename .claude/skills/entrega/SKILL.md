---
name: entrega
description: Prepara una web de cliente para publicarla y entregarla (fase 7) - elegir el despliegue según el hosting (Hostinger u otro), build final, README del proyecto, variables de entorno de ejemplo, instrucciones de publicación, informe de pruebas, limitaciones y mantenimiento. Úsala cuando la web haya pasado la fase de calidad o cuando Roberto pregunte cómo publicar.
argument-hint: "[slug]"
---

# Entrega · fase 7

**Nunca publiques, subas a producción, cambies DNS o dominios ni contrates nada sin autorización
explícita de Roberto en el chat.** Preparas todo para que publicar sea un paso corto y seguro.

## 1. Comprobar el destino
Lee el hosting en PROYECTO.md y consulta [hostinger.md](hostinger.md). Decide:

| La web… | Hosting necesario | Despliegue |
|---|---|---|
| es estática (`trixel.json › servidor: false`) | Cualquiera (incluso Hostinger Premium/Single) | Subir `dist/` a `public_html` + `.htaccess` |
| tiene servidor (reservas, panel, formularios propios) | Node.js: Hostinger Business o Cloud, o VPS | App Node desde GitHub o zip, entrada `server.mjs`, BD MySQL, SMTP |

Si el plan del cliente no admite lo que la web necesita, **para y explica las opciones** (cambiar de
plan, mover esa función a un servicio externo, versión sin servidor) con costes. No adaptes en
silencio.

## 2. Verificación final
`npm run verificar` y `node tools/qa.mjs <slug>` sin errores (salvo los que dependen de datos de
producción que aún no existen, anotados). Capturas finales en `entrega/capturas/`.

## 3. Paquete de entrega (`clientes/<slug>/`)
- `web/README.md` a partir de [plantilla-README.md](plantilla-README.md): qué es, requisitos,
  instalación local, variables de entorno, publicación, mantenimiento, actualización, copias de
  seguridad, funcionalidades, pruebas, limitaciones.
- `web/.env.example` completo y **sin valores reales**.
- `entrega/informe-qa.md` (lo genera qa.mjs) + resumen de pruebas manuales y visuales.
- `entrega/seguridad.md` (checklist de `seguridad-rgpd`).
- `entrega/pendiente-cliente.md`: lo que el cliente debe aportar, validar o firmar.
- Para estático: `cp .claude/skills/entrega/htaccess-estatico clientes/<slug>/web/public/.htaccess`
  antes del build.
- Commit final y etiqueta: `git -C clientes/<slug> tag v1.0`.

## 4. Publicación (solo con autorización)
Sigue el procedimiento de [hostinger.md](hostinger.md) con Roberto. Después:
- `https://<dominio>/api/salud` → `{"ok":true}` (si hay servidor).
- Prueba real: un formulario/reserva de verdad, el correo llega, se gestiona en el panel y se cancela.
- HTTPS activo y redirección desde http y www.
- Enviar sitemap en Google Search Console y revisar ficha de Google Business (enlace a la web).
- Anotar fecha, versión y URL en PROYECTO.md.

## 5. Explicación para el cliente
Un resumen breve en lenguaje claro: cómo usar el panel (si hay), a quién avisar si algo falla, qué
incluye el mantenimiento, qué datos debe mantener actualizados (horarios, carta).
