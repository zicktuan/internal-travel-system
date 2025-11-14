// src/routes/test.routes.ts
import { Router } from 'express';
import { 
  testSuccess, 
  testCreated, 
  testError, 
  testValidationError, 
  testServerError 
} from '../controllers/test.controller.js';

const router = Router();

router.get('/success', testSuccess);
router.post('/created', testCreated);
router.get('/not-found', testError);
router.get('/validation-error', testValidationError);
router.get('/server-error', testServerError);

export default router;