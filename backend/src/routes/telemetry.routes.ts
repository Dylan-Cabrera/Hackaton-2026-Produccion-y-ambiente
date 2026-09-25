import { Router } from 'express';
import { TelemetryController } from '../controllers/telemetry.controller.js';
import { telemetryEventValidator } from '../validators/telemetry.validator.js';
import { validateRequest } from '../middlewares/validate-request.js';
import { optionalAuth } from '../middlewares/auth.middleware.js';

const router = Router();
const telemetryController = new TelemetryController();

// Público, con sesión opcional: si hay token válido, el evento queda asociado al usuario
router.post('/event', optionalAuth, telemetryEventValidator, validateRequest, telemetryController.recordEvent);

export default router;
