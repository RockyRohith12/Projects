
import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";

import airQualityRoutes from "./routes/airQualityRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";

const app = express();

const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());

// Allow frontend communication
app.use(
    cors({
        origin: "http://localhost:5173",
    })
);

// Parse JSON requests
app.use(express.json({ limit: "10kb" }));

// Health check endpoint
app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        application: "SaansSaathi",
        message: "Backend is running successfully",
    });
});

// API routes
app.use("/api/air-quality", airQualityRoutes);
app.use("/api/ai", aiRoutes);

// Handle unknown API routes
app.use("/api", (req, res) => {
    res.status(404).json({
        success: false,
        message: "API endpoint not found",
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error("Server error:", err.message);

    res.status(500).json({
        success: false,
        message: "Internal server error",
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`SaansSaathi server running on port ${PORT}`);
});
