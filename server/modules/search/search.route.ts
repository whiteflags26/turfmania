
import express from 'express';
import { search, getSearchSuggestions } from './search.controller';
import { standardApiLimiter } from '../../utils/rateLimiter';

const router = express.Router();

// GET /api/v1/search
router.get('/',standardApiLimiter, search);

// GET /api/v1/search/suggestions
router.get('/suggestions',standardApiLimiter, getSearchSuggestions);

export default router;