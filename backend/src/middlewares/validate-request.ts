import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

export const validateRequest = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Errores de validación en los campos',
      errors: errors.array().map((err) => ({
        field: 'path' in err ? err.path : undefined,
        message: err.msg
      }))
    });
  }

  return next();
};
