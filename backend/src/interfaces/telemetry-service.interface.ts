import { TelemetryEventInput } from './telemetry.types.js';

export interface ITelemetryService {
  // userId: sale del token si hay sesión, o null si es un visitante anónimo.
  // Nunca lanza: los fallos se loguean internamente y no cambian la respuesta al cliente.
  recordEvent(input: TelemetryEventInput, userId: number | null): Promise<void>;
}
