# Trixel Studio

Sistema interno de Trixel Web para crear webs profesionales con Claude Code: del encargo a la web
publicada, con propuestas visuales, desarrollo, pruebas y entrega.

## Requisitos (una vez)

| Herramienta | Versión | Para qué |
|---|---|---|
| Node.js | ≥ 22.23.4 (LTS 22 o 24) | Astro 7 y los scripts |
| Git | cualquiera reciente | Versiones y puntos de control |
| Claude Code | actual | Trabajar con el sistema |
| Docker Desktop | opcional | Base de datos local para webs con reservas |

En Windows (PowerShell):
```powershell
winget install OpenJS.NodeJS.LTS Git.Git
git clone https://github.com/<usuario>/trixel-studio.git
cd trixel-studio
```
Claude Code: instálalo con el instalador oficial (https://code.claude.com/docs). El navegador de
pruebas (Chromium para Playwright) se instala solo al crear el primer proyecto con `--instalar`.

## Uso diario

```powershell
cd trixel-studio
claude
```
Y en Claude Code, en lenguaje normal:

> /nueva-web Quiero una web para un restaurante mediterráneo de Málaga, elegante, oscuro, con
> fotos grandes, carta, opiniones reales y reservas.

El sistema guía las fases y pide lo necesario. Una conversación por proyecto (`/clear` entre clientes).

| Quiero… | Dile a Claude |
|---|---|
| Empezar una web | `/nueva-web <descripción>` |
| Seguir una web | `/nueva-web <slug>` o "seguimos con <slug>" |
| Ver las propuestas | `cd clientes/<slug>/web` → `npm run dev:propuestas` → http://localhost:4321/propuestas |
| Pedir cambios | "Me gusta la B con la tipografía de la A, más premium" |
| Aprobar | "Apruebo la propuesta B con estos cambios" |
| Revisar calidad | "Pasa el control de calidad" |
| Preparar publicación | "Prepara la entrega para Hostinger" |

## Estructura

```
CLAUDE.md            reglas comunes (prioridades, prohibiciones, flujo)
.claude/skills/      nueva-web · direccion-arte · desarrollo · funciones-negocio ·
                     seguridad-rgpd · calidad · entrega
.claude/agents/      revisor-diseno (crítica visual independiente)
kit/base/            plantilla técnica neutra (Astro 7 + TS)
kit/modulos/         funcionalidades probadas (reservas)
tools/               nuevo-proyecto · modulo · capturas · qa
docs/                arquitectura · mantenimiento · hoja de ruta · plantillas
clientes/            proyectos (cada uno con su propio Git; fuera del repo del estudio)
```

## Comandos

```bash
node tools/nuevo-proyecto.mjs <slug> --nombre "Nombre" --sector restaurante --instalar
node tools/modulo.mjs listar
node tools/modulo.mjs añadir reservas <slug>
node tools/capturas.mjs <slug> --propuestas
node tools/capturas.mjs <slug>
node tools/qa.mjs <slug> --completo
```

Más: [docs/arquitectura.md](docs/arquitectura.md) · [docs/mantenimiento.md](docs/mantenimiento.md) ·
[docs/hoja-de-ruta.md](docs/hoja-de-ruta.md)
