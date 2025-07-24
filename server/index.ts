import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { handleSignup, handleLogin, handleMe, verifyToken } from "./routes/auth";
import { handlePlanTrip, handleGetUserItineraries, handleGetItinerary, handleDeleteItinerary } from "./routes/trips";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));

  // JSON parsing with error handling
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Add request logging for debugging
  app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) {
      console.log(`📡 ${req.method} ${req.path} - Content-Type: ${req.headers['content-type']}`);
    }
    next();
  });

  // Error handler for JSON parsing
  app.use((error: any, req: any, res: any, next: any) => {
    if (error instanceof SyntaxError && 'body' in error) {
      console.error('❌ JSON parsing error:', error.message);
      return res.status(400).json({
        success: false,
        message: 'Invalid JSON in request body'
      });
    }
    next(error);
  });

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    res.json({ message: "Hello from Express server v2!" });
  });

  app.get("/api/demo", handleDemo);

  // Authentication routes
  app.post("/api/auth/signup", handleSignup);
  app.post("/api/auth/login", handleLogin);
  app.get("/api/auth/me", verifyToken, handleMe);

  // Trip planning routes (protected)
  app.post("/api/trips/plan", verifyToken, handlePlanTrip);
  app.get("/api/trips", verifyToken, handleGetUserItineraries);
  app.get("/api/trips/:id", verifyToken, handleGetItinerary);
  app.delete("/api/trips/:id", verifyToken, handleDeleteItinerary);

  return app;
}
