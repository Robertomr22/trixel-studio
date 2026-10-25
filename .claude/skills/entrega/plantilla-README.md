# {Nombre del negocio} · web

Web de {nombre} ({dominio}) desarrollada por Trixel Web. Versión {v} · {fecha}.

## Qué incluye
- Páginas: …
- Funcionalidades: … (con su alcance; p. ej. "Reservas: solicitud con aforo real por servicio y
  confirmación desde /admin")

## Tecnología
Astro {versión} + TypeScript. {Estática | Servidor Node con MySQL}. Sin cookies de terceros.

## Requisitos
- Node.js ≥ 22.23 y npm
- {MySQL/MariaDB 10.6+} {Docker opcional para la BD local}

## Trabajar en local
```bash
npm install
{docker compose -f docker-compose.bd.yml up -d && npm run db:migrar}
npm run dev        # http://localhost:4321
```

## Variables de entorno
Ver `.env.example`. Nunca subir `.env` al repositorio.
| Variable | Para qué |
|---|---|

## Pruebas
`npm run verificar` (tipos, unitarias, integración, build, navegador en móvil/tablet/escritorio).
Resultado de la entrega: `../entrega/informe-qa.md`.

## Publicación
{Pasos concretos para el hosting de este cliente}

## Mantenimiento
- Cambiar horarios, teléfono, dirección: `src/data/negocio.json`.
- {Carta: `src/data/carta.ts`}
- {Reservas: configuración en `src/data/reservas.config.ts`; cierres y vacaciones en `cierres`.}
- Actualizar dependencias: `npm outdated`, actualizar, `npm run verificar`, publicar.
- Copias de seguridad: {qué y cada cuánto}. Restaurar: {cómo}.

## Limitaciones conocidas
- …

## Contacto técnico
Trixel Web · {email}
