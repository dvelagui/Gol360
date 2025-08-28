import crypto from "crypto";

const b64url = (buf: Buffer) =>
  buf.toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");

export const generateCodeVerifier = () => b64url(crypto.randomBytes(32));

export const challengeS256 = (verifier: string) => {
  const hash = crypto.createHash("sha256").update(verifier).digest();
  return b64url(hash);
};
