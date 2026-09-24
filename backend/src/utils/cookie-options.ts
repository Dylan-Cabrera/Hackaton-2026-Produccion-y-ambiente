import { CookieOptions } from 'express';

// Configuración de la cookie HTTP-Only donde se guarda el token de sesión
export const getCookieOptions = (): CookieOptions => ({
  httpOnly: true, // Protege contra ataques XSS (JavaScript no puede leerla)
  secure: process.env.NODE_ENV === 'production', // Solo HTTPS en producción
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 24 * 60 * 60 * 1000 // 24 horas de duración
});
