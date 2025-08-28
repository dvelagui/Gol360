import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import express from "express";

const TOKEN_URL = "https://auth.veo.co/oidc/token";
const VEO_API   = "https://api.veo.co";

const cfg = functions.config().veo || {};
const CLIENT_ID = cfg.client_id as string;
const CLIENT_SECRET = (cfg.client_secret as string) || undefined;

async function getAccessToken(): Promise<string> {
  const doc = await admin.firestore().collection("integrations").doc("veo").get();
  const refresh = doc.exists ? (doc.data()?.refresh_token as string) : undefined;
  if (!refresh) throw new Error("No refresh_token saved. Run /auth/veo/login first.");

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refresh,
    client_id: CLIENT_ID,
  });
  if (CLIENT_SECRET) body.set("client_secret", CLIENT_SECRET);

  const r = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const tok = await r.json() as any;
  if (!r.ok) throw new Error(JSON.stringify(tok));
  return tok.access_token as string;
}

export const apiRoutes = (app: express.Express) => {
  // Primera llamada: listar recordings (limit 10)
  app.get("/veo/recordings", async (_req, res) => {
    try {
      const access = await getAccessToken();
      const r = await fetch(`${VEO_API}/recordings?limit=10`, {
        headers: { Authorization: `Bearer ${access}` },
      });
      const data = await r.json();
      res.status(r.ok ? 200 : 400).json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message ?? "Fetch error" });
    }
  });
};
