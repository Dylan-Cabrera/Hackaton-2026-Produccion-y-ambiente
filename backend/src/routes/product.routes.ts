import { Router } from 'express';
import { ProductController } from '../controllers/product.controller.js';
import {
  createProductValidator,
  updateProductValidator,
  productIdValidator,
  searchProductsValidator
} from '../validators/product.validator.js';
import { validateRequest } from '../middlewares/validate-request.js';
import { authenticateToken, requireRole } from '../middlewares/auth.middleware.js';
import { uploadProductImage } from '../middlewares/upload-image.js';

const router = Router();
const productController = new ProductController();

// Búsqueda pública (no requiere sesión)
router.get('/', searchProductsValidator, validateRequest, productController.search);

router.post(
  '/',
  authenticateToken,
  requireRole('PRODUCER'),
  createProductValidator,
  validateRequest,
  productController.create
);

// Declarada antes de '/:id' para que Express no la confunda con un id
router.get('/mine', authenticateToken, requireRole('PRODUCER'), productController.listMine);

// Devuelve la URL pública de la foto; el producto se crea/edita después con esa imageUrl
router.post(
  '/upload-image',
  authenticateToken,
  requireRole('PRODUCER'),
  uploadProductImage,
  productController.uploadImage
);

router.patch(
  '/:id',
  authenticateToken,
  requireRole('PRODUCER'),
  productIdValidator,
  updateProductValidator,
  validateRequest,
  productController.update
);

export default router;
