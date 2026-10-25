# Arquitectura y decisiones

## Principio
La **técnica se reutiliza**; la **estética no**. El kit no trae ningún diseño: cada web nace de su
propia dirección de arte. Lo que se repite entre clientes (SEO, legales, pruebas, reservas) está
resuelto y probado una vez.

## Stack

| Pieza | Elección | Por qué | Alternativas descartadas |
|---|---|---|---|
| Framework | **Astro 7** | HTML estático por defecto (rápido, SEO, sirve en cualquier hosting) y servidor solo en las rutas que lo necesitan; control total del HTML/CSS | Next.js: obliga a servidor Node siempre en Hostinger y empuja a React en todo; WordPress: menos control de diseño y más mantenimiento |
| Lenguaje | TypeScript estricto (`strictest`) | Errores detectados antes de publicar | — |
| Estilos | CSS propio por proyecto con tokens | Evita la estética de librería; cada web con identidad | Tailwind por defecto (empuja a la misma estética); se puede usar si un proyecto lo justifica |
| Fuentes | `@fontsource` autoalojadas | Rendimiento, sin enviar datos a Google, sin banner | Google Fonts CDN |
| Servidor | `@astrojs/node` standalone | Compatible con Hostinger Business/Cloud | Funciones serverless (no disponibles en Hostinger) |
| Base de datos | MySQL/MariaDB + Drizzle ORM | Incluida en Hostinger; consultas tipadas y parametrizadas; migraciones versionadas | SQLite (persistencia dudosa en apps gestionadas) |
| Correo | SMTP del dominio (nodemailer) | Sin coste añadido; en local se guarda en `.correos/` | Resend/Brevo (opción si hay problemas de entrega) |
| Pruebas | Vitest, Playwright, axe-core | Unitarias, integración con BD real y navegador real en 3 tamaños | — |
| Calidad visual | Capturas + agente revisor | Detecta lo que los tests no ven (p. ej. un botón blanco sobre blanco pasó los tests y lo detectó la captura) | — |

## Activación del servidor
`web/trixel.json` declara módulos y si hay servidor. `astro.config.mjs` lo lee: añade el adaptador
Node y el esquema de variables de entorno de cada módulo (`web/trixel/<modulo>.mjs`). Sin módulos de
servidor, el build es 100 % estático.

## Aislamiento entre clientes
- Cada cliente en `clientes/<slug>/` con su propio repositorio Git (ignorado por el del estudio).
- `nuevo-proyecto.mjs` copia solo `kit/base`; nunca lee otros clientes.
- Secretos generados aleatoriamente por proyecto (`modulo.mjs`), en `.env` ignorado por Git, con
  hook `pre-commit` que bloquea `.env` y patrones de secretos.
- Claude no puede leer `.env` (`.claude/settings.json › deny`).
- Regla en CLAUDE.md: un proyecto por sesión.

## Propuestas visuales
Páginas Astro reales en `src/propuestas/<id>/`, inyectadas solo en desarrollo o con `PROPUESTAS=1`
por la integración `src/integrations/propuestas.ts`, más un comparador en `/propuestas`. Usan los
mismos datos y fotos que la web final, así que lo aprobado es lo que se construye.

## Riesgos conocidos
| Riesgo | Mitigación |
|---|---|
| Hostinger duerme las apps Node sin tráfico | Primera visita más lenta; el resto de la web es estática y no se ve afectada |
| Entregabilidad del correo SMTP | SPF/DKIM/DMARC en la entrega; si falla, servicio transaccional |
| Límite de peticiones en memoria (se reinicia con la app) | Es una capa más junto a campo trampa y token |
| Playwright fijado a 1.63 | Actualizar junto con los navegadores (`npx playwright install chromium`) |
| Cambios de Astro mayores | Actualizar el kit, pasar `npm run verificar` en un proyecto de prueba antes de usarlo |
