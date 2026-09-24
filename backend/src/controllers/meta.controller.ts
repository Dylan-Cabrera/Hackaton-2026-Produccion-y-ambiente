import { Request, Response } from 'express';
import { CATEGORIES, STOCK_UNITS, INSTITUTION_TYPES } from '../constants/catalog.constants.js';
import { LOCALITIES } from '../constants/localities.constants.js';

// Catálogos estáticos que el frontend consume para no tener copias propias
// desactualizadas (categorías, unidades, localidades, tipos de institución).
export class MetaController {
  get = (_req: Request, res: Response) => {
    return res.status(200).json({
      message: 'Metadatos obtenidos exitosamente',
      data: {
        categories: CATEGORIES,
        stockUnits: STOCK_UNITS,
        localities: LOCALITIES,
        institutionTypes: INSTITUTION_TYPES
      }
    });
  };
}
