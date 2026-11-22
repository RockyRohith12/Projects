
import express from "express";
import { fetchAirQuality } from "../controllers/airQualityController.js";

const router = express.Router();

router.get("/", fetchAirQuality);

export default router;
