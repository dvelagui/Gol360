import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { authRoutes } from "./veo/auth";
import { apiRoutes } from "./veo/api";

admin.initializeApp();

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(express.json());

// Rutas OAuth (login/callback) y API (primer fetch a Veo)
authRoutes(app);
apiRoutes(app);

export const api = functions.https.onRequest(app);
