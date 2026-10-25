/**
 * Casos de uso de reservas: solicitar, confirmar, rechazar, cancelar y crear manualmente.
 * Orquesta reglas (disponibilidad), datos (repositorio) y avisos (correo).
 * Un fallo al enviar un correo nunca pierde la reserva: queda registrado en su historial.
 */
import type { BaseDeDatos } from '../db/conexion';
import type { Reserva } from '../db/esquema';
import { igualSeguro, sha256, tokenAleatorio, validarTokenFormulario } from '../seguridad/tokens';
import {
  correoAvisoRestaurante,
  correoCancelacionRestaurante,
  correoCancelada,
  correoConfirmada,
  correoRechazada,
  correoSolicitudRecibida,
  type Correo,
  type Mensajero,
} from './correo';
import { cabe, comprobarFranja, MENSAJES, servicioDeHora } from './disponibilidad';
import { ahoraEn, sumarDias, type AhoraLocal } from './fechas';
import * as repo from './repositorio';
import type { ConfigReservas } from './tipos';
import type { Solicitud } from './validacion';

export interface Dependencias {
  db: BaseDeDatos;
  enviar: Mensajero;
  config: ConfigReservas;
  restaurante: { nombre: string; telefono?: string | undefined };
  /** URL pública base, sin barra final (para los enlaces de los correos). */
  urlBase: string;
  emailAvisos: string;
  secreto: string;
  ahora?: () => AhoraLocal;
}

export type Resultado<T> = { ok: true; valor: T } | { ok: false; estado: number; mensaje: string };

const fallo = (estado: number, mensaje: string) => ({ ok: false as const, estado, mensaje });

function marco(d: Dependencias) {
  return { restaurante: d.restaurante.nombre, telefono: d.restaurante.telefono, urlSitio: d.urlBase };
}

async function enviarSeguro(d: Dependencias, reservaId: number, correo: Correo) {
  try {
    await d.enviar(correo);
    await repo.registrarEvento(d.db, reservaId, 'correo', `${correo.asunto} → ${correo.para}`);
  } catch (error) {
    console.error(`[reservas] Error enviando correo de la reserva ${reservaId}:`, (error as Error).message);
    await repo.registrarEvento(d.db, reservaId, 'correo_fallido', correo.asunto);
  }
}

function urlCancelar(d: Dependencias, codigo: string, token: string) {
  return `${d.urlBase}/reserva/cancelar?c=${encodeURIComponent(codigo)}&t=${encodeURIComponent(token)}`;
}

export async function solicitarReserva(d: Dependencias, s: Solicitud): Promise<Resultado<Reserva>> {
  if (!d.config.configurado) return fallo(503, 'Las reservas online aún no están activas.');

  const token = validarTokenFormulario(s.t, d.secreto);
  if (token === 'demasiado_rapido' || token === 'invalido') return fallo(400, 'Solicitud rechazada.');
  if (token === 'caducado') return fallo(400, 'La página ha caducado. Recárgala y vuelve a intentarlo.');

  const ahora = (d.ahora ?? (() => ahoraEn(d.config.zonaHoraria)))();
  const tokenCancelacion = tokenAleatorio();
  const resultado = await repo.crearReservaAtomica(
    d.db,
    {
      fecha: s.fecha,
      hora: s.hora,
      servicio: '',
      personas: s.personas,
      nombre: s.nombre,
      email: s.email,
      telefono: s.telefono,
      comentarios: s.comentarios,
      estado: 'pendiente',
      origen: 'web',
      tokenCancelacion: sha256(tokenCancelacion),
      consentimiento: true,
    },
    (ocupacion) => {
      const c = comprobarFranja(d.config, s.fecha, s.hora, s.personas, ocupacion, ahora);
      return c.ok ? { ok: true, servicio: c.servicio.id } : c;
    },
  );

  if (!resultado.ok) {
    if (resultado.motivo === 'duplicada') {
      return fallo(409, 'Ya tienes una solicitud para ese día y servicio. Revisa tu correo.');
    }
    return fallo(resultado.motivo === 'completo' ? 409 : 422, MENSAJES[resultado.motivo]);
  }

  const r = resultado.reserva;
  await enviarSeguro(d, r.id, correoSolicitudRecibida(marco(d), r, urlCancelar(d, r.codigo, tokenCancelacion)));
  await enviarSeguro(d, r.id, correoAvisoRestaurante(marco(d), r, d.emailAvisos, `${d.urlBase}/admin`));
  return { ok: true, valor: r };
}

export async function confirmarReserva(d: Dependencias, id: number): Promise<Resultado<Reserva>> {
  // El token de cancelación original solo existe en el correo del cliente: se genera uno nuevo
  // para el correo de confirmación y se sustituye el hash guardado.
  const tokenNuevo = tokenAleatorio();
  const r = await repo.cambiarEstado(d.db, id, 'confirmada', 'panel');
  if (!r) return fallo(409, 'Esta reserva no se puede confirmar (puede que ya esté gestionada).');
  if (r.email) {
    await repo.cambiarTokenCancelacion(d.db, id, sha256(tokenNuevo));
    await enviarSeguro(d, r.id, correoConfirmada(marco(d), r, urlCancelar(d, r.codigo, tokenNuevo)));
  }
  return { ok: true, valor: r };
}

export async function rechazarReserva(d: Dependencias, id: number, mensaje: string): Promise<Resultado<Reserva>> {
  const r = await repo.cambiarEstado(d.db, id, 'rechazada', mensaje ? `panel: ${mensaje}` : 'panel');
  if (!r) return fallo(409, 'Esta reserva no se puede rechazar.');
  if (r.email) await enviarSeguro(d, r.id, correoRechazada(marco(d), r, mensaje));
  return { ok: true, valor: r };
}

export async function cancelarDesdePanel(d: Dependencias, id: number, avisar: boolean): Promise<Resultado<Reserva>> {
  const r = await repo.cambiarEstado(d.db, id, 'cancelada', 'panel');
  if (!r) return fallo(409, 'Esta reserva no se puede cancelar.');
  if (avisar && r.email) await enviarSeguro(d, r.id, correoCancelada(marco(d), r, false));
  return { ok: true, valor: r };
}

/** Comprueba el enlace del correo sin modificar nada (para mostrar la página de cancelación). */
export async function reservaPorEnlace(d: Dependencias, codigo: string, token: string): Promise<Reserva | null> {
  if (!codigo || !token) return null;
  const r = await repo.buscarPorCodigo(d.db, codigo);
  if (!r?.tokenCancelacion || !igualSeguro(r.tokenCancelacion, sha256(token))) return null;
  return r;
}

export async function cancelarPorEnlace(d: Dependencias, codigo: string, token: string): Promise<Resultado<Reserva>> {
  const r = await reservaPorEnlace(d, codigo, token);
  if (!r) return fallo(404, 'El enlace no es válido o la reserva ya estaba cancelada.');
  const cancelada = await repo.cambiarEstado(d.db, r.id, 'cancelada', 'cliente (enlace del correo)');
  if (!cancelada) return fallo(409, 'Esta reserva ya no se puede cancelar.');
  if (cancelada.email) await enviarSeguro(d, r.id, correoCancelada(marco(d), cancelada, true));
  await enviarSeguro(d, r.id, correoCancelacionRestaurante(marco(d), cancelada, d.emailAvisos));
  return { ok: true, valor: cancelada };
}

export interface DatosManual {
  fecha: string;
  hora: string;
  personas: number;
  nombre: string;
  email: string;
  telefono: string;
  comentarios: string;
  estado: 'pendiente' | 'confirmada';
  /** Permite superar el aforo (decisión del restaurante). */
  forzar: boolean;
}

/** Reserva tomada por teléfono o en persona: cuenta para el aforo igual que las de la web. */
export async function crearReservaManual(d: Dependencias, m: DatosManual): Promise<Resultado<Reserva>> {
  const servicio = servicioDeHora(d.config, m.fecha, m.hora);
  if (!servicio) return fallo(422, 'Esa hora no pertenece a ningún servicio de ese día.');
  const resultado = await repo.crearReservaAtomica(
    d.db,
    {
      fecha: m.fecha,
      hora: m.hora,
      servicio: servicio.id,
      personas: m.personas,
      nombre: m.nombre,
      email: m.email || null,
      telefono: m.telefono || null,
      comentarios: m.comentarios,
      estado: m.estado,
      origen: 'telefono',
      tokenCancelacion: null,
      consentimiento: false,
    },
    (ocupacion) => {
      if (m.forzar) return { ok: true };
      return cabe(servicio, m.hora, m.personas, ocupacion) ? { ok: true } : { ok: false, motivo: 'completo' as const };
    },
  );
  if (!resultado.ok) {
    return fallo(
      409,
      resultado.motivo === 'duplicada'
        ? 'Ya existe una reserva activa con ese email para ese servicio.'
        : 'Se supera el aforo del servicio. Marca "forzar" si quieres aceptarla igualmente.',
    );
  }
  return { ok: true, valor: resultado.reserva };
}

/** Anonimiza reservas antiguas como mucho una vez al día. Se llama al abrir el panel. */
export async function mantenimientoDiario(d: Dependencias): Promise<number> {
  const hoy = (d.ahora ?? (() => ahoraEn(d.config.zonaHoraria)))().fecha;
  if ((await repo.leerAjuste(d.db, 'ultima_anonimizacion')) === hoy) return 0;
  const n = await repo.anonimizarAntiguas(d.db, sumarDias(hoy, -d.config.conservacionDias));
  await repo.guardarAjuste(d.db, 'ultima_anonimizacion', hoy);
  return n;
}
