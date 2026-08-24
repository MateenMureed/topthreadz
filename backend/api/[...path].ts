import app from '../src/index';

// Catch-all Vercel Serverless Function for /api/* while retaining Express's
// original request path and every established API contract.
export default app;
