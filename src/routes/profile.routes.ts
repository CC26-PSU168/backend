import { Router } from 'express';
import { ProfileController } from '../controllers/profile.controller';
import { authenticate } from '../middlewares/authenticate';

const router = Router();

router.use(authenticate);

router.get('/', ProfileController.getProfile);
router.put('/', ProfileController.updateProfile);
router.put('/password', ProfileController.updatePassword);
router.put('/notifications', ProfileController.updateNotifications);
router.delete('/', ProfileController.deleteAccount);

export default router;
