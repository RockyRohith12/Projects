
import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";

import airQualityRoutes from "./routes/airQualityRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import weatherRoutes from "./routes/weatherRoutes.js";
import nearbyPlacesRoutes from "./routes/nearbyPlacesRoutes.js";
import forecastRoutes from "./routes/forecastRoutes.js";
import historicalAirQualityRoutes from "./routes/historicalAirQualityRoutes.js";

const app = express();

const PORT = process.env.PORT || 5000;

// ==========================================
// 1. SECURITY MIDDLEWARE
// ==========================================

app.use(helmet());

// ==========================================
// 2. CORS CONFIGURATION
// ==========================================

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
  })
);

// ==========================================
// 3. REQUEST BODY PARSER
// ==========================================

app.use(express.json({ limit: "10kb" }));

// ==========================================
// 4. HEALTH CHECK ENDPOINT
// ==========================================

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    application: "SaansSaathi",
    message: "Backend is running successfully",
  });
});

// ==========================================
// 5. API ROUTES
// ==========================================

app.use("/api/air-quality", airQualityRoutes);

app.use("/api/ai", aiRoutes);

app.use("/api/weather", weatherRoutes);

app.use("/api/nearby-places", nearbyPlacesRoutes);

app.use("/api/forecast", forecastRoutes);

// Historical AQI endpoint
app.use(
  "/api/historical-air-quality",
  historicalAirQualityRoutes
);

// ==========================================
// 6. HANDLE UNKNOWN API ROUTES
// ==========================================

app.use("/api", (req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found",
  });
});

// ==========================================
// 7. GLOBAL ERROR HANDLER
// ==========================================

app.use((err, req, res, next) => {
  console.error("Server error:", err.message);

  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});

// ==========================================
// 8. START SERVER
// ==========================================

app.listen(PORT, "0.0.0.0", () => {
  console.log(`SaansSaathi server running on port ${PORT}`);
});