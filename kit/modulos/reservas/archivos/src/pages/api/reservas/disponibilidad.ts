import type { APIRoute } from 'astro';
import { disponibilidadDelDia, MENSAJES, rangoReservable } from '../../../lib/reservas/disponibilidad';
import { ahoraEn } from '../../../lib/reservas/fechas';
import { ocupacionDelDia } from '../../../lib/reservas/repositorio';
import { crearTokenFormulario } from '../../../lib/seguridad/tokens';
import { dependencias, ipDe, json, limites } from '../../../lib/servidor/contexto';

export const prerender = false;

export const GET: APIRoute = async (contexto) => {
  if (!limites.disponibilidad.permitir(ipDe(contexto))) {
    return json({ error: 'demasiadas_peticiones', mensaje: 'Demasiadas consultas. Espera un momento.' }, 429);
  }
  const d = dependencias();
  if (!d.config.configurado) {
    return json({ error: 'no_configurado', mensaje: 'Las reservas online aún no están activas.' }, 503);
  }

  const parametros = contexto.url.searchParams;
  const fecha = parametros.get('fecha') ?? '';
  const personas = Number.parseInt(parametros.get('personas') ?? '', 10);
  const ahora = ahoraEn(d.config.zonaHoraria);

  const base = {
    rango: rangoReservable(d.config, ahora),
    personas: d.config.personas,
    textoGrupos: d.config.textoGrupos,
    t: crearTokenFormulario(d.secreto),
  };

  if (!fecha) return json(base);
  if (!Number.isInteger(personas)) {
    return json({ error: 'personas', mensaje: 'Indica el número de personas.' }, 400);
  }

  try {
    const ocupacion = await ocupacionDelDia(d.db, fecha);
    const dia = disponibilidadDelDia(d.config, fecha, personas, ocupacion, ahora);
    return json({
      ...base,
      fecha,
      franjas: dia.franjas,
      ...(dia.motivo && {
        motivo: dia.motivo,
        mensaje: dia.motivo === 'cerrado' && dia.detalle ? `${MENSAJES.cerrado} (${dia.detalle})` : MENSAJES[dia.motivo],
      }),
    });
  } catch (error) {
    console.error('[reservas] Error consultando disponibilidad:', (error as Error).message);
    return json({ error: 'servidor', mensaje: 'No hemos podido consultar la disponibilidad. Inténtalo de nuevo.' }, 500);
  }
};
