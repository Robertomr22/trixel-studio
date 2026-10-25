/**
 * Flujo completo en navegador real contra el servidor compilado y la BD de .env.test:
 * cliente solicita → correos → restaurante confirma en el panel → cliente cancela por enlace.
 * Se ejecuta una vez (proyecto "escritorio") porque modifica la base de datos.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { configReservas } from '../../src/data/reservas.config';
import { disponibilidadDelDia } from '../../src/lib/reservas/disponibilidad';
import { ahoraEn, sumarDias } from '../../src/lib/reservas/fechas';

test.describe.configure({ mode: 'serial' });
test.skip(!configReservas.configurado, 'Las reservas no están configuradas (configurado: false)');
test.beforeEach(({}, info) => {
  test.skip(info.project.name !== 'escritorio', 'Solo en un proyecto: modifica la base de datos');
});

const CORREOS = '.correos';
const email = `e2e-${Date.now()}@example.com`;

function correosPara(para: string) {
  if (!existsSync(CORREOS)) return [];
  return readdirSync(CORREOS)
    .sort()
    .map((f) => JSON.parse(readFileSync(`${CORREOS}/${f}`, 'utf8')) as { para: string; asunto: string; texto: string })
    .filter((c) => c.para === para);
}

/** Primer día reservable con al menos una hora libre según la configuración real. */
function proximaFechaAbierta(): string {
  const ahora = ahoraEn(configReservas.zonaHoraria);
  for (let i = 1; i <= configReservas.antelacion.maxDias; i++) {
    const fecha = sumarDias(ahora.fecha, i);
    if (disponibilidadDelDia(configReservas, fecha, 2, [], ahora).franjas.length > 0) return fecha;
  }
  throw new Error('No hay ninguna fecha abierta en el plazo configurado');
}

test('un cliente solicita una reserva con disponibilidad real', async ({ page }) => {
  const fecha = proximaFechaAbierta();
  await page.goto('/reservar');
  await expect(page.getByText('Solicitud enviada')).toBeHidden();
  await expect(page.getByRole('button', { name: 'Solicitar reserva' })).toHaveCSS('opacity', '1');
  await page.getByLabel('Fecha').fill(fecha);
  await page.getByLabel('Personas').selectOption('2');
  const primeraHora = page.locator('.rf__hora:has(input:not(:disabled))').first();
  await expect(primeraHora).toBeVisible();
  await primeraHora.click();
  await page.getByLabel('Nombre').fill('Cliente E2E');
  await page.getByLabel('Teléfono').fill('600 123 456');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Comentarios').fill('Prueba automática');
  await page.getByLabel(/acepto la/).check();
  await page.waitForTimeout(3500); // el servidor rechaza envíos hechos en menos de 3 s
  await page.getByRole('button', { name: 'Solicitar reserva' }).click();

  await expect(page.getByText('Solicitud enviada')).toBeVisible();
  await expect(page.locator('[data-rf-form]')).toBeHidden();
  await expect(page.locator('[data-rf-exito-texto]')).toContainText(/Referencia: [A-Z0-9]{6}/);

  await expect.poll(() => correosPara(email).length).toBe(1);
  expect(correosPara(email)[0]!.asunto).toMatch(/recibida/i);
  expect(correosPara(process.env.EMAIL_AVISOS!).some((c) => c.texto.includes('Cliente E2E'))).toBe(true);
});

test('el panel exige sesión y rechaza contraseñas incorrectas', async ({ page }) => {
  await page.goto('/admin');
  await expect(page).toHaveURL(/\/admin\/login$/);
  await page.getByLabel('Usuario').fill(process.env.ADMIN_USUARIO!);
  await page.getByLabel('Contraseña').fill('contraseña-incorrecta');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByRole('alert')).toContainText('incorrectos');
});

test('el restaurante confirma la solicitud desde el panel', async ({ page }) => {
  await page.goto('/admin/login');
  await page.getByLabel('Usuario').fill(process.env.ADMIN_USUARIO!);
  await page.getByLabel('Contraseña').fill(process.env.TEST_ADMIN_CLAVE!);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByRole('heading', { name: /pendientes/i })).toBeVisible();

  const tarjeta = page.locator('.reserva', { hasText: 'Cliente E2E' });
  await expect(tarjeta).toContainText('2 pers.');
  await tarjeta.getByRole('button', { name: 'Confirmar' }).click();
  await expect(page.getByRole('status')).toContainText('confirmada');
  await expect.poll(() => correosPara(email).length).toBe(2);
  expect(correosPara(email)[1]!.asunto).toMatch(/confirmada/i);
});

test('el cliente cancela con el enlace del correo de confirmación', async ({ page }) => {
  const correo = correosPara(email)[1]!;
  const enlace = new URL(/https?:\/\/\S+\/reserva\/cancelar\S+/.exec(correo.texto)![0]);
  await page.goto(`${enlace.pathname}${enlace.search}`);
  await expect(page.getByRole('heading', { name: '¿Cancelar tu reserva?' })).toBeVisible();
  await page.getByRole('button', { name: 'Sí, cancelar la reserva' }).click();
  await expect(page.getByRole('heading', { name: 'Reserva cancelada' })).toBeVisible();

  await page.goto(`${enlace.pathname}${enlace.search}`);
  await expect(page.getByRole('heading', { name: 'Este enlace ya no es válido' })).toBeVisible();
});

test('la API rechaza bots y formatos no permitidos', async ({ request }) => {
  const formulario = await request.post('/api/reservas', { form: { nombre: 'x' } });
  expect(formulario.status()).toBe(415);

  const conTrampa = await request.post('/api/reservas', {
    data: { fecha: proximaFechaAbierta(), hora: '13:00', personas: 2, nombre: 'Bot', email: 'b@example.com', telefono: '600000000', acepto: true, web: 'http://spam.example', t: 'xxxxxxxxxxxx' },
  });
  expect(conTrampa.status()).toBe(422);

  const sinSesion = await request.post('/admin', { form: { id: '1', accion: 'confirmar' }, maxRedirects: 0 });
  expect([303, 403]).toContain(sinSesion.status());
});
