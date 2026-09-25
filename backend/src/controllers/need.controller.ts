import { Response, NextFunction } from 'express';
import { INeedService } from '../interfaces/need-service.interface.js';
import { INeedMatchingService } from '../interfaces/need-matching-service.interface.js';
import { needService as defaultNeedService, needMatchingService as defaultNeedMatchingService } from '../config/container.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import { Category } from '../constants/catalog.constants.js';

export class NeedController {
  constructor(
    private readonly needService: INeedService = defaultNeedService,
    private readonly needMatchingService: INeedMatchingService = defaultNeedMatchingService
  ) {}

  // POST /api/needs
  create = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.needService.create(req.user!.id, req.body);

      return res.status(201).json({
        message: 'Necesidad publicada exitosamente',
        data: result
      });
    } catch (error) {
      return next(error);
    }
  };

  // GET /api/needs
  search = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { category, locality, lat, lng, limit, offset } = req.query;

      const result = await this.needService.search(
        {
          category: category as Category | undefined,
          locality: locality as string | undefined,
          lat: lat as unknown as number | undefined,
          lng: lng as unknown as number | undefined,
          limit: limit as unknown as number | undefined,
          offset: offset as unknown as number | undefined
        },
        { userId: req.user?.id ?? null, role: req.user?.role ?? null }
      );

      return res.status(200).json({
        message: 'Necesidades obtenidas exitosamente',
        data: result.items,
        pagination: { limit: result.limit, offset: result.offset, total: result.total }
      });
    } catch (error) {
      return next(error);
    }
  };

  // GET /api/needs/mine
  listMine = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const needs = await this.needService.listMine(req.user!.id);

      return res.status(200).json({
        message: 'Necesidades obtenidas exitosamente',
        data: needs
      });
    } catch (error) {
      return next(error);
    }
  };

  // GET /api/needs/for-me
  forMe = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const needs = await this.needMatchingService.getForProducer(req.user!.id);

      return res.status(200).json({
        message: 'Necesidades para vos obtenidas exitosamente',
        data: needs
      });
    } catch (error) {
      return next(error);
    }
  };

  // GET /api/needs/:id
  getById = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const need = await this.needService.getById(Number(req.params.id), {
        userId: req.user?.id ?? null,
        role: req.user?.role ?? null
      });

      return res.status(200).json({
        message: 'Necesidad obtenida exitosamente',
        data: need
      });
    } catch (error) {
      return next(error);
    }
  };

  // PATCH /api/needs/:id
  update = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const need = await this.needService.update(Number(req.params.id), req.user!.id, req.body);

      return res.status(200).json({
        message: 'Necesidad actualizada exitosamente',
        data: need
      });
    } catch (error) {
      return next(error);
    }
  };

  // GET /api/needs/:id/matches
  getMatches = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { radiusKm, limit } = req.query;
      const result = await this.needMatchingService.getMatchesFor(
        Number(req.params.id),
        { userId: req.user!.id, role: req.user!.role },
        {
          radiusKm: radiusKm as unknown as number | undefined,
          limit: limit as unknown as number | undefined
        }
      );

      return res.status(200).json({
        message: 'Matches obtenidos exitosamente',
        data: result
      });
    } catch (error) {
      return next(error);
    }
  };
}
