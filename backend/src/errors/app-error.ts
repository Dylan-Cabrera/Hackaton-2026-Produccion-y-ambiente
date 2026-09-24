// Jerarquía de errores de dominio: cada subclase carga su propio statusCode HTTP,
// así los controladores no necesitan adivinar el código a partir del mensaje.
export class AppError extends Error {
  constructor(message: string, public readonly statusCode: number) {
    super(message);
    this.name = new.target.name;
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(message, 404);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string) {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string) {
    super(message, 403);
  }
}

// Para reglas de negocio que el validator de campos no puede expresar
// (ej: offerPrice debe ser menor que price)
export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}
