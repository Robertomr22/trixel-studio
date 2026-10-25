---
name: seguridad-rgpd
description: Seguridad y protección de datos de una web de cliente para el mercado español - revisión de seguridad del código y del servidor, secretos, cabeceras, formularios, y obligaciones RGPD, LOPDGDD, LSSI y cookies (aviso legal, privacidad, cookies, consentimientos, conservación). Úsala al añadir formularios o datos personales, antes de entregar, o si Roberto pregunta por temas legales o de seguridad.
argument-hint: "[slug]"
---

# Seguridad y protección de datos

No eres abogado: preparas una base técnica y documental correcta y **señalas qué debe revisar un
profesional**. Nunca afirmes que una web "cumple la ley" sin esa revisión.

## 1. Revisión de seguridad ([checklist.md](checklist.md))
Recorre la lista completa sobre el código del proyecto. Para cada punto: ✅ cumplido (y dónde),
❌ problema (y corrígelo) o N/A. Pega el resultado en `entrega/seguridad.md`.

Puntos que más fallan:
- Validación solo en cliente. **Toda entrada se valida en el servidor** (zod) aunque el formulario ya
  la valide.
- Rutas de servidor sin `export const prerender = false` o sin autorización (todo `/admin/*` pasa
  por el middleware).
- Secretos en código o en variables `PUBLIC_*`/`context: 'client'`. Los secretos son
  `context: 'server', access: 'secret'` en `astro:env`.
- Errores que devuelven detalles internos (stack, SQL) al usuario. Al usuario: mensaje genérico;
  al registro: detalle sin datos personales innecesarios.
- Dependencias con vulnerabilidades altas (`npm audit --omit=dev`).

## 2. Protección de datos (España)
Para cada dato personal que recoja la web (formularios, reservas, cuentas):
1. **¿Hace falta?** Minimiza: no pidas DNI, fecha de nacimiento ni datos de salud sin necesidad real.
2. Registra el tratamiento en `src/data/legal.ts` (o `legal.<modulo>.ts`): datos, finalidad, base
   jurídica, conservación, encargados. La política de privacidad se genera de ahí.
3. En el formulario: casilla **no premarcada** de aceptación de la política con enlace, e información
   básica (responsable y finalidad) cerca del botón cuando el formulario recoja datos.
4. Conservación limitada y, si es posible, automática (el módulo de reservas anonimiza).
5. Encargados del tratamiento (hosting, correo, servicios externos): el cliente debe tener contrato o
   aceptar sus condiciones de encargado; anótalo como pendiente del cliente.
6. Datos de salud u otras categorías especiales (clínicas): evita recogerlos por formulario; si es
   imprescindible, **revisión profesional obligatoria** antes de publicar.

Detalle de textos y obligaciones: [legal-es.md](legal-es.md).

## 3. Cookies
- Diseña para **no necesitar banner**: fuentes autoalojadas, sin analítica con cookies, mapas y vídeos
  bajo demanda, sin píxeles. Así basta con la política de cookies informativa.
- Si el cliente quiere analítica: preferir opciones sin cookies (p. ej. Plausible, Umami autoalojado)
  y explicarlo. Con Google Analytics, píxeles o widgets que ponen cookies → banner con consentimiento
  previo, rechazo tan fácil como aceptar y bloqueo real hasta aceptar (presupuestar y revisar).
- Registra cada cookie en `src/data/legal.ts`.

## 4. Antes de publicar
- `node tools/qa.mjs <slug>` sin errores de seguridad.
- Aviso legal con datos reales del titular (no PENDIENTE).
- Lista para el cliente de lo que debe revisar o firmar: textos legales, contratos de encargado,
  registro de actividades de tratamiento si le aplica.
