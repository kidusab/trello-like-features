import { prisma } from "../prisma";
import { Request } from "express";
import { verifyToken } from "../utils/token";

export const context = async ({ req }: { req: Request }) => {
  try {
    const adminToken =
      (req.cookies.adminToken as string) ??
      req.headers.authorization?.split(" ")[1];

    if (adminToken) {
      const decoded = verifyToken<{ id: string }>(adminToken);
      if (!decoded) return { adminId: null };

      const admin = await prisma.admin.findUnique({
        where: { id: decoded.id },
      });
      if (!admin) return { adminId: null };

      return { adminId: admin.id, admin };
    }

    const token =
      (req.cookies.accessToken as string) ??
      req.headers.authorization?.split(" ")[1];
    if (!token) return { userId: null };

    const decoded = verifyToken<{ userId: string; type: "access" }>(token);
    if (!decoded) return { userId: null };

    if (decoded.type !== "access") return { userId: null };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });
    if (!user) return { userId: null };

    return { userId: user.id, user };
  } catch (error) {
    console.error("Error verifying token", error);
    return { userId: null };
  }
};
