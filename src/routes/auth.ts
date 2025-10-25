import express, { Request, Response } from "express";
import { comparePassword, generateToken, verifyToken } from "../utils/token";
import { prisma } from "../prisma";
import { verifyAuth } from "./middlewares/verifyAuth";

const router = express.Router();

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ message: "Invalid credentials" });

  if (!comparePassword(password, user.password))
    return res.status(401).json({ message: "Invalid credentials" });

  const accessToken = generateToken({ userId: user.id, type: "access" });
  const refreshToken = generateToken({ userId: user.id, type: "refresh" });

  // Extract device metadata
  const deviceInfo = {
    ip:
      req.ip ||
      req.headers["x-forwarded-for"] ||
      req.socket?.remoteAddress ||
      "",
    userAgent: req.headers["user-agent"] || "",
    loginTime: new Date(),
  };

  // Save refresh token and device info in UserDevices table
  await prisma.userDevice.create({
    data: {
      userId: user.id,
      ipAddress: deviceInfo.ip[0],
      userAgent: deviceInfo.userAgent,
      loginTime: deviceInfo.loginTime,
      refreshToken: refreshToken,
    },
  });

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
    },
  });

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 1000 * 60 * 60 * 24 * 30,
  });
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  });
  res.json({ message: "Logged in successfully" });
});

router.post("/refresh", verifyAuth, async (req, res) => {
  const { refreshToken: refToken } = req.body;
  const decoded = verifyToken<{ userId: string; type: "refresh" }>(refToken);
  if (!decoded) return res.status(401).json({ message: "Invalid token" });

  const refreshToken = await prisma.refreshToken.findUnique({
    where: { token: refToken },
  });
  if (!refreshToken) return res.status(401).json({ message: "Invalid token" });

  if (refreshToken.revoked)
    return res.status(401).json({ message: "Token revoked" });

  if (refreshToken.expiresAt < new Date())
    return res.status(401).json({ message: "Token expired" });

  const accessToken = generateToken({
    userId: refreshToken.userId,
    type: "access",
  });
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 1000 * 60 * 60 * 24 * 30,
  });
  res.json({ message: "Token refreshed successfully" });
});

router.post("/logout", verifyAuth, async (req, res) => {
  const { refreshToken: refToken } = req.body;
  const decoded = verifyToken<{ userId: string; type: "refresh" }>(refToken);
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
  res.cookie("accessToken", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
  });
  res.cookie("refreshToken", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
  });
  res.json({ message: "Logged out successfully" });
});

router.get("/me", async (req, res) => {
  const { authorization } = req.headers;
  const accessToken = authorization?.split(" ")[1];
  if (!accessToken) return res.status(401).json({ message: "Unauthorized" });

  const decoded = verifyToken<{ userId: string; type: "access" }>(accessToken);
  if (!decoded) return res.status(401).json({ message: "Invalid token" });

  const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
  if (!user) return res.status(401).json({ message: "User not found" });

  res.json({ user });
});

export default router;
