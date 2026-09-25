import { Response, NextFunction } from 'express';
import { ITelemetryService } from '../interfaces/telemetry-service.interface.js';
import { telemetryService as defaultTelemetryService } from '../config/container.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';

export class TelemetryController {
  constructor(private readonly telemetryService: ITelemetryService = defaultTelemetryService) {}

  // POST /api/telemetry/event: siempre responde 202, el registro nunca falla de cara al cliente
  recordEvent = async (req: AuthRequest, res: Response) => {
    // Nunca se acepta userId del body: sale exclusivamente del token, o queda null si es anónimo
    const userId = req.user?.id ?? null;

    await this.telemetryService.recordEvent(req.body, userId);

    return res.status(202).end();
  };

  // DELETE /api/users/me/activity
  clearActivity = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      await this.telemetryService.clearActivity(req.user!.id);

      return res.status(200).json({
        message: 'Actividad desvinculada de tu cuenta exitosamente'
      });
    } catch (error) {
      return next(error);
    }
  };
}
