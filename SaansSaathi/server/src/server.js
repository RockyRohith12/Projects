import express from "express";
import cors from "cors";
import helmet from "helmet";
import airQualityRoutes from "./routes/airQualityRoutes.js";

const app = express();

const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());

// Allow frontend communication
app.use(cors({
    origin: "http://localhost:5173"
}));

// Parse JSON requests
app.use(express.json());

// Health check endpoint
app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        application: "SaansSaathi",
        message: "Backend is running successfully"
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`SaansSaathi server running on port ${PORT}`);
});

app.use("/api/air-quality", airQualityRoutes);