import express from 'express';
import { 
  register, 
  login, 
  registerBike, 
  trackBikeActivity, 
  getUserDashboard, 
  addUserWithRole, 
  getAllBikesForUser,
  getBikeHistory
} from '../controllers/register.js';
import { isAuthenticated } from '../middleware/auth.js';

const router = express.Router();

// User Registration
router.post('/register', register);

// User Login
router.post('/login', login);

// Register a Bike (Authenticated)
router.post('/bike/register', isAuthenticated, registerBike);

router.get('/bike/:bikeId/history', isAuthenticated, getBikeHistory);
// Track Bike Activity (Authenticated)
router.post('/bike/activity', isAuthenticated, trackBikeActivity);

// Get User Dashboard (Authenticated)
router.get('/dashboard', isAuthenticated, getUserDashboard);

// Add a User with Role (Authenticated)
router.post('/user/add', isAuthenticated, addUserWithRole);

// Get All Bikes for a User (Authenticated)
router.get('/bikes', isAuthenticated, getAllBikesForUser);

export default router;
