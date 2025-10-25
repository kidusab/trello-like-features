import express, { Request, Response } from "express";
import {
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  hashPassword,
  verifyAccessToken,
  verifyRefreshToken,
} from "../utils/token";
import { prisma } from "../prisma";

const router = express.Router();

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ message: "Invalid credentials" });

  if (!comparePassword(password, user.password))
    return res.status(401).json({ message: "Invalid credentials" });

  const accessToken = generateAccessToken({ userId: user.id });
  const refreshToken = generateRefreshToken({ userId: user.id });

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
    },
  });

  res.json({ accessToken, refreshToken });
});

router.post("/refresh", async (req, res) => {
  const { refreshToken: refToken } = req.body;
  const decoded = verifyRefreshToken(refToken) as { userId: string };
  if (!decoded) return res.status(401).json({ message: "Invalid token" });

  const refreshToken = await prisma.refreshToken.findUnique({
    where: { token: refToken },
  });
  if (!refreshToken) return res.status(401).json({ message: "Invalid token" });

  if (refreshToken.revoked)
    return res.status(401).json({ message: "Token revoked" });

  if (refreshToken.expiresAt < new Date())
    return res.status(401).json({ message: "Token expired" });

  const accessToken = generateAccessToken({ userId: refreshToken.userId });
  res.json({ accessToken });
});

router.post("/logout", async (req, res) => {
  const { refreshToken: refToken } = req.body;
  const decoded = verifyRefreshToken(refToken) as { userId: string };
  if (!decoded) return res.status(401).json({ message: "Invalid token" });

  const refreshToken = await prisma.refreshToken.findUnique({
    where: { token: refToken },
  });
  if (!refreshToken) return res.status(401).json({ message: "Invalid token" });

  if (refreshToken.revoked)
    return res.status(401).json({ message: "Token revoked" });

  if (refreshToken.expiresAt < new Date())
    return res.status(401).json({ message: "Token expired" });

  await prisma.refreshToken.update({
    where: { token: refToken },
    data: { revoked: true },
  });
  res.json({ message: "Logged out successfully" });
});

router.get("/me", async (req, res) => {
  const { authorization } = req.headers;
  const accessToken = authorization?.split(" ")[1];
  if (!accessToken) return res.status(401).json({ message: "Unauthorized" });

  const decoded = verifyAccessToken(accessToken) as { userId: string };
  if (!decoded) return res.status(401).json({ message: "Invalid token" });

  const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
  if (!user) return res.status(401).json({ message: "User not found" });

  res.json({ user });
});

export default router;
