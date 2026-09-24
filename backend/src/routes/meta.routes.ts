import { Router } from 'express';
import { MetaController } from '../controllers/meta.controller.js';

const router = Router();
const metaController = new MetaController();

router.get('/', metaController.get);

export default router;
