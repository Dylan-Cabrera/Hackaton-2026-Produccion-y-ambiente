import { Request, Response, NextFunction } from 'express';
import { IProductService } from '../interfaces/product-service.interface.js';
import { productService as defaultProductService } from '../config/container.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';

export class ProductController {
  constructor(private readonly productService: IProductService = defaultProductService) {}

  create = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const product = await this.productService.create(req.user!.id, req.body);

      return res.status(201).json({
        message: 'Producto creado exitosamente',
        data: product
      });
    } catch (error) {
      return next(error);
    }
  };

  update = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const product = await this.productService.update(Number(req.params.id), req.user!.id, req.body);

      return res.status(200).json({
        message: 'Producto actualizado exitosamente',
        data: product
      });
    } catch (error) {
      return next(error);
    }
  };

  // GET /api/products/mine: inventario completo del productor autenticado
  listMine = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const products = await this.productService.listMine(req.user!.id);

      return res.status(200).json({
        message: 'Productos obtenidos exitosamente',
        data: products
      });
    } catch (error) {
      return next(error);
    }
  };

  // GET /api/producers/:id/products: catálogo público de un productor
  getByProducer = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const products = await this.productService.listByProducer(Number(req.params.id));

      return res.status(200).json({
        message: 'Productos obtenidos exitosamente',
        data: products
      });
    } catch (error) {
      return next(error);
    }
  };
}
