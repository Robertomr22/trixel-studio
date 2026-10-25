# Mapa de skills y agentes

Las reglas comunes están en `CLAUDE.md` (siempre cargado). Cada skill se carga sola cuando la tarea
encaja con su descripción, o a mano con `/nombre`. Ninguna repite a otra: se enlazan.

| Fase | Skill / agente | Se activa cuando… | Entrada | Salida |
|---|---|---|---|---|
| 1–2 | `/nueva-web` | pides una web o retomas un proyecto | descripción del encargo o slug | proyecto creado, `brief.md`, material inventariado, `negocio.json` |
| 3–4 | `direccion-arte` | toca diseñar, comparar o cambiar propuestas | brief + fotos | `/propuestas` con 3 direcciones, rondas, dirección aprobada en PROYECTO.md |
| 3–6 | agente `revisor-diseno` | tras cada tanda de capturas | rutas de capturas + contexto | crítica priorizada (debe / debería / detalles) |
| 5 | `desarrollo` | hay dirección aprobada | propuesta aprobada | web real |
| 1, 5 | `funciones-negocio` | se decide o se integra una funcionalidad | alcance pedido | alcance acordado, módulo integrado y probado |
| 5–7 | `seguridad-rgpd` | hay datos personales, formularios o antes de entregar | código + tratamientos | checklist de seguridad, textos legales, pendientes del cliente |
| 6 | `calidad` | antes de dar algo por terminado | proyecto | pruebas, capturas, revisor, Lighthouse, `qa.mjs`, informe |
| 7 | `entrega` | toca publicar o entregar | proyecto verificado | README, `.env.example`, instrucciones de hosting, informe |

## Archivos de apoyo (se leen solo cuando hacen falta)
- `nueva-web/`: preguntas.md (por sector), material.md, fuentes-externas.md (Booking, Airbnb, web antigua)
- `direccion-arte/`: anti-patrones.md, direcciones.md (familias de estilo y notas por sector),
  tipografia.md (catálogo verificado en npm), propuestas-tecnico.md
- `desarrollo/`: convenciones.md, imagenes.md
- `funciones-negocio/`: reservas.md (mesa), alojamiento.md (casas rurales), carta.md
- `seguridad-rgpd/`: checklist.md, legal-es.md
- `calidad/`: checklist-visual.md
- `entrega/`: hostinger.md, plantilla-README.md, htaccess-estatico

## Skills de Anthropic que conviven
- `frontend-design` (si está instalada): criterio general de diseño; `direccion-arte` lo concreta
  para Trixel y manda en caso de duda.
- `skill-creator`: para mejorar estas skills con pruebas cuando un proyecto real saque una lección.

## Módulos funcionales
| Módulo | Estado |
|---|---|
| `reservas` (mesa) | ✅ construido y probado |
| `alojamiento` (casas rurales: calendario iCal + solicitud) | Diseñado en `funciones-negocio/alojamiento.md`; se construye cuando el cliente confirme el nivel |
