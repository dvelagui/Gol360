import type { Request, Response } from "express";
import { generateCodeVerifier, challengeS256 } from "./pkce";
import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import express from "express";

const AUTH_URL  = "https://auth.veo.co/oidc/auth";
const TOKEN_URL = "https://auth.veo.co/oidc/token";

const cfg = functions.config().veo || {};
const CLIENT_ID = cfg.client_id as string;
const CLIENT_SECRET = (cfg.client_secret as string) || undefined; // opcional
const REDIRECT_URI = cfg.redirect_uri as string;

const setCookie = (res: Response, name: string, value: string) => {
  res.cookie(name, value, { httpOnly: true, secure: true, sameSite: "lax", maxAge: 10 * 60 * 1000 });
};

const getCookie = (req: Request, name: string) => (req.cookies ? req.cookies[name] : undefined);

export const authRoutes = (app: express.Express) => {
  // 1) Iniciar login con PKCE
  app.get("/auth/veo/login", async (_req, res) => {
    const verifier = generateCodeVerifier();
    const challenge = challengeS256(verifier);
    const state = Math.random().toString(36).slice(2);

    setCookie(res, "veo_verifier", verifier);
    setCookie(res, "veo_state", state);

    const url = new URL(AUTH_URL);
    url.searchParams.set("client_id", CLIENT_ID);
    url.searchParams.set("redirect_uri", REDIRECT_URI);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", "openid offline_access api");
    url.searchParams.set("code_challenge", challenge);
    url.searchParams.set("code_challenge_method", "S256");
    url.searchParams.set("state", state);

    res.redirect(url.toString());
  });

  // 2) Callback: code -> tokens (guarda refresh_token)
  app.get("/auth/veo/callback", async (req, res) => {
    try {
      const { code, state } = req.query as { code?: string; state?: string };
      if (!code || state !== getCookie(req, "veo_state")) return res.status(400).send("Invalid state");

      const body = new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: REDIRECT_URI,
        client_id: CLIENT_ID,
        code_verifier: getCookie(req, "veo_verifier") as string,
      });
      if (CLIENT_SECRET) body.set("client_secret", CLIENT_SECRET);

      const r = await fetch(TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
      });
      const tok = await r.json() as any;
      if (!r.ok) return res.status(400).json(tok);

      await admin.firestore().collection("integrations").doc("veo").set({
        refresh_token: tok.refresh_token ?? null,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });

      return res.redirect("/?veo=connected");
    } catch (e: any) {
      return res.status(500).send(e.message ?? "Auth error");
    }
  });
};
