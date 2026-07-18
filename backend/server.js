import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import client from "prom-client";

import { connectDB } from "./config/db.js";
import { notFound, errorHandler } from "./middleware/error.middleware.js";

import authRoutes from "./routes/auth.routes.js";
import leadRoutes from "./routes/lead.routes.js";
import noteRoutes from "./routes/note.routes.js";
import taskRoutes from "./routes/task.routes.js";
import contactRoutes from "./routes/contact.routes.js";
import aiRoutes from "./routes/ai.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";

const app = express();

// Prometheus configuration

// Create a registry to store all Prometheus metrics
const register = new client.Registry();

// Collect default Node.js metrics automatically
client.collectDefaultMetrics({
    register,
    prefix: "crm_", // Every metric will start with crm_
});

// Expose metrics endpoint for Prometheus
app.get("/metrics", async (req, res) => {
    res.set("Content-Type", register.contentType);
    res.end(await register.metrics());
});

// Middleware

app.use(
    cors({
        origin: process.env.CLIENT_URL || "https://localhost:5173",
        credentials: true,
    })
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== "production") {
    app.use(morgan("dev"));
}

//Health check endpoint

app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        status: "ok",
        message: "Server is running",
        timestamp: new Date().toISOString(),
        env: process.env.NODE_ENV,
    });
});

// API Endpoints

app.use("/api/auth", authRoutes);
app.use("/api/leads", leadRoutes);
app.use("/api/notes", noteRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/contacts", contactRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/analytics", analyticsRoutes);

// Error Handling Middleware

app.use(notFound);
app.use(errorHandler);

// Start server

const PORT = process.env.PORT || 8000;

const start = async () => {
    try {
        await connectDB();

        app.listen(PORT, () => {
            console.log(`Server running on port http://localhost:${PORT}`);
        });
    } catch (err) {
        console.log(`Failed to start the server: ${err.message}`);
        process.exit(1);
    }
};

start();

export default app;