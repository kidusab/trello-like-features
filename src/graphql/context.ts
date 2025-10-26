import { prisma, PrismaTypes } from "../prisma";
import { Request } from "express";
import { verifyToken } from "../utils/token";

export const context = async ({ req }: { req: Request }) => {
  const cookies = req.cookies;

  try {
    const data: { [key: string]: any } = {};

    for await (const [key, value] of Object.entries(cookies)) {
      if (key === "accessToken" || key === "refreshToken") {
        const token = value as string;
        if (!token) continue;

        const decoded = verifyToken<{ userId: string; type: "access" }>(token);
        if (!decoded) continue;

        if (decoded.type !== "access") continue;

        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
        });
        if (!user) continue;

        data.userId = decoded.userId;
        data.user = user;
      } else if (key === "adminToken") {
        const token = value as string;
        if (!token) continue;

        const decoded = verifyToken<{ id: string }>(token);
        if (!decoded) continue;

        const admin = await prisma.admin.findUnique({
          where: { id: decoded.id },
        });
        if (!admin) continue;

        data.adminId = decoded.id;
        data.admin = admin;
      }
    }

    return data;
  } catch (error) {
    console.error("Error verifying token", error);
    return {};
  }
};
