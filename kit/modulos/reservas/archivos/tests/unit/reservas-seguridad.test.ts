import { describe, expect, it } from 'vitest';
import { hashClave, verificarClave } from '../../src/lib/seguridad/clave';
import { Limitador } from '../../src/lib/seguridad/limite';
import { codigoReserva, crearTokenFormulario, firmar, validarTokenFormulario, verificar } from '../../src/lib/seguridad/tokens';
import { solicitudSchema } from '../../src/lib/reservas/validacion';

const SECRETO = 'x'.repeat(40);

describe('contraseñas', () => {
  it('verifica la contraseña correcta y rechaza la incorrecta', async () => {
    const hash = await hashClave('una clave larga y segura');
    expect(hash.startsWith('scrypt:')).toBe(true);
    expect(await verificarClave('una clave larga y segura', hash)).toBe(true);
    expect(await verificarClave('otra clave', hash)).toBe(false);
    expect(await verificarClave('x', 'formato-roto')).toBe(false);
  });
});

describe('tokens firmados', () => {
  it('detecta manipulaciones', () => {
    const t = firmar({ u: 'admin' }, SECRETO);
    expect(verificar(t, SECRETO)).toEqual({ u: 'admin' });
    expect(verificar(t, 'y'.repeat(40))).toBeNull();
    const [datos, f] = t.split('.');
    const falso = Buffer.from(JSON.stringify({ u: 'otro' })).toString('base64url');
    expect(verificar(`${falso}.${f}`, SECRETO)).toBeNull();
    expect(verificar(`${datos}`, SECRETO)).toBeNull();
  });

  it('el token de formulario exige un tiempo mínimo y caduca', () => {
    const t = crearTokenFormulario(SECRETO, 1_000_000);
    expect(validarTokenFormulario(t, SECRETO, { ahoraMs: 1_001_000 })).toBe('demasiado_rapido');
    expect(validarTokenFormulario(t, SECRETO, { ahoraMs: 1_010_000 })).toBe('ok');
    expect(validarTokenFormulario(t, SECRETO, { ahoraMs: 1_000_000 + 3 * 3600_000 })).toBe('caducado');
    expect(validarTokenFormulario('basura', SECRETO)).toBe('invalido');
  });

  it('genera códigos sin caracteres ambiguos', () => {
    for (let i = 0; i < 200; i++) expect(codigoReserva()).toMatch(/^[A-HJKMNP-Z2-9]{6}$/);
  });
});

describe('limitador', () => {
  it('bloquea al superar el máximo y libera al pasar la ventana', () => {
    const l = new Limitador(2, 1000);
    expect(l.permitir('ip', 0)).toBe(true);
    expect(l.permitir('ip', 10)).toBe(true);
    expect(l.permitir('ip', 20)).toBe(false);
    expect(l.permitir('otra', 20)).toBe(true);
    expect(l.permitir('ip', 1500)).toBe(true);
  });
});

describe('validación de la solicitud', () => {
  const valida = {
    fecha: '2026-11-13',
    hora: '21:00',
    personas: '2',
    nombre: 'Ana García',
    email: 'ANA@Ejemplo.com ',
    telefono: '+34 600 111 222',
    acepto: true,
    t: 'token-de-prueba',
  };

  it('acepta y normaliza una solicitud correcta', () => {
    const r = solicitudSchema.parse(valida);
    expect(r.email).toBe('ana@ejemplo.com');
    expect(r.personas).toBe(2);
  });

  it('rechaza el campo trampa, la falta de consentimiento y caracteres de control', () => {
    expect(solicitudSchema.safeParse({ ...valida, web: 'http://spam' }).success).toBe(false);
    expect(solicitudSchema.safeParse({ ...valida, acepto: false }).success).toBe(false);
    expect(solicitudSchema.safeParse({ ...valida, nombre: 'Ana\u0000' }).success).toBe(false);
    expect(solicitudSchema.safeParse({ ...valida, telefono: '123' }).success).toBe(false);
  });
});
