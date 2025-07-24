import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { handleSignup, handleLogin, handleMe, verifyToken } from "./routes/auth";
import { handlePlanTrip, handleGetUserItineraries, handleGetItinerary } from "./routes/trips";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

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

  return app;
}
