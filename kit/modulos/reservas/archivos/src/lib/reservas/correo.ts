/**
 * Envío de correos. En producción usa SMTP (p. ej. el buzón del dominio en Hostinger).
 * Sin SMTP configurado y fuera de producción, los correos se guardan en .correos/ para
 * revisarlos: NO se envían y así se indica en el registro.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import nodemailer from 'nodemailer';
import { fechaLarga } from './fechas';
import type { Reserva } from '../db/esquema';

export interface Correo {
  para: string;
  asunto: string;
  texto: string;
  html: string;
  responderA?: string | undefined;
}

export type Mensajero = (correo: Correo) => Promise<void>;

export interface OpcionesSmtp {
  host: string;
  puerto: number;
  usuario: string;
  clave: string;
  remitente: string;
}

export function mensajeroSmtp(o: OpcionesSmtp): Mensajero {
  const transporte = nodemailer.createTransport({
    host: o.host,
    port: o.puerto,
    secure: o.puerto === 465,
    auth: { user: o.usuario, pass: o.clave },
  });
  return async (c) => {
    await transporte.sendMail({
      from: o.remitente,
      to: c.para,
      subject: c.asunto,
      text: c.texto,
      html: c.html,
      ...(c.responderA && { replyTo: c.responderA }),
    });
  };
}

/** Guarda cada correo como archivo en `carpeta` (desarrollo y pruebas). */
export function mensajeroLocal(carpeta = '.correos'): Mensajero {
  return async (c) => {
    await mkdir(carpeta, { recursive: true });
    const nombre = `${new Date().toISOString().replace(/[:.]/g, '-')}-${Math.random().toString(36).slice(2, 7)}.json`;
    await writeFile(`${carpeta}/${nombre}`, JSON.stringify(c, null, 2), 'utf8');
    console.info(`[correo local, NO enviado] ${c.para} · ${c.asunto}`);
  };
}

const esc = (v: string) =>
  v.replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]!);

interface Marco {
  restaurante: string;
  urlSitio: string;
  telefono?: string | undefined;
}

function plantilla(m: Marco, titulo: string, parrafos: string[], filas: [string, string][], enlace?: { texto: string; url: string }) {
  const texto = [
    titulo,
    '',
    ...parrafos,
    '',
    ...filas.map(([k, v]) => `${k}: ${v}`),
    ...(enlace ? ['', `${enlace.texto}: ${enlace.url}`] : []),
    '',
    `${m.restaurante}${m.telefono ? ` · ${m.telefono}` : ''}`,
    m.urlSitio,
  ].join('\n');

  const html = `<!doctype html><html lang="es"><body style="margin:0;padding:24px;background:#f4f3f0;font-family:Georgia,serif;color:#1d1d1b">
<div style="max-width:520px;margin:0 auto;background:#fff;padding:32px">
<p style="margin:0 0 4px;font:600 12px/1.4 Arial,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#6b6963">${esc(m.restaurante)}</p>
<h1 style="margin:0 0 20px;font-size:24px;line-height:1.2;font-weight:normal">${esc(titulo)}</h1>
${parrafos.map((p) => `<p style="margin:0 0 14px;font:15px/1.6 Arial,sans-serif">${esc(p)}</p>`).join('')}
<table style="width:100%;border-collapse:collapse;margin:18px 0;font:14px/1.5 Arial,sans-serif">
${filas.map(([k, v]) => `<tr><td style="padding:6px 0;color:#6b6963;width:40%">${esc(k)}</td><td style="padding:6px 0">${esc(v)}</td></tr>`).join('')}
</table>
${enlace ? `<p style="margin:20px 0 0;font:14px Arial,sans-serif"><a href="${esc(enlace.url)}" style="color:#1d1d1b">${esc(enlace.texto)}</a></p>` : ''}
<p style="margin:28px 0 0;font:12px/1.5 Arial,sans-serif;color:#6b6963">${esc(m.restaurante)}${m.telefono ? ` · ${esc(m.telefono)}` : ''}<br>${esc(m.urlSitio)}</p>
</div></body></html>`;
  return { texto, html };
}

function filasReserva(r: Reserva): [string, string][] {
  return [
    ['Referencia', r.codigo],
    ['Fecha', fechaLarga(r.fecha)],
    ['Hora', r.hora],
    ['Personas', String(r.personas)],
    ['A nombre de', r.nombre],
  ];
}

export function correoSolicitudRecibida(m: Marco, r: Reserva, urlCancelar: string): Correo {
  const { texto, html } = plantilla(
    m,
    'Hemos recibido tu solicitud de reserva',
    [
      'Gracias. Tu reserva está pendiente de confirmación: te escribiremos en cuanto la revisemos.',
      'Si cambias de planes, puedes cancelarla con el enlace de abajo.',
    ],
    filasReserva(r),
    { texto: 'Cancelar la solicitud', url: urlCancelar },
  );
  return { para: r.email!, asunto: `Solicitud de reserva recibida · ${m.restaurante}`, texto, html };
}

export function correoAvisoRestaurante(m: Marco, r: Reserva, para: string, urlPanel: string): Correo {
  const filas: [string, string][] = [
    ...filasReserva(r),
    ['Teléfono', r.telefono ?? '—'],
    ['Email', r.email ?? '—'],
    ['Comentarios', r.comentarios || '—'],
  ];
  const { texto, html } = plantilla(m, 'Nueva solicitud de reserva', ['Revísala y confírmala desde el panel.'], filas, {
    texto: 'Abrir el panel de reservas',
    url: urlPanel,
  });
  return {
    para,
    asunto: `Nueva reserva ${r.codigo}: ${r.personas} pers. · ${r.fecha} ${r.hora}`,
    texto,
    html,
    responderA: r.email ?? undefined,
  };
}

export function correoConfirmada(m: Marco, r: Reserva, urlCancelar?: string): Correo {
  const { texto, html } = plantilla(
    m,
    'Tu reserva está confirmada',
    ['Te esperamos. Si no puedes venir, avísanos para liberar la mesa.'],
    filasReserva(r),
    urlCancelar ? { texto: 'Cancelar la reserva', url: urlCancelar } : undefined,
  );
  return { para: r.email!, asunto: `Reserva confirmada · ${m.restaurante}`, texto, html };
}

export function correoRechazada(m: Marco, r: Reserva, mensaje: string): Correo {
  const parrafos = ['Lo sentimos, no podemos atender tu solicitud para esa fecha y hora.'];
  if (mensaje.trim()) parrafos.push(mensaje.trim());
  parrafos.push('Si quieres, prueba con otra hora o llámanos.');
  const { texto, html } = plantilla(m, 'No podemos confirmar tu reserva', parrafos, filasReserva(r));
  return { para: r.email!, asunto: `Sobre tu solicitud de reserva · ${m.restaurante}`, texto, html };
}

export function correoCancelada(m: Marco, r: Reserva, porCliente: boolean): Correo {
  const { texto, html } = plantilla(
    m,
    'Reserva cancelada',
    [porCliente ? 'Hemos cancelado tu reserva como pediste.' : 'Tu reserva ha sido cancelada por el restaurante.'],
    filasReserva(r),
  );
  return { para: r.email!, asunto: `Reserva cancelada · ${m.restaurante}`, texto, html };
}

export function correoCancelacionRestaurante(m: Marco, r: Reserva, para: string): Correo {
  const { texto, html } = plantilla(m, 'Un cliente ha cancelado su reserva', ['La mesa vuelve a estar libre.'], filasReserva(r));
  return { para, asunto: `Cancelada ${r.codigo}: ${r.personas} pers. · ${r.fecha} ${r.hora}`, texto, html };
}
