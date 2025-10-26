import { NextFunction, Request, Response } from "express";
import { verifyToken } from "../../utils/token";
import { prisma } from "../../prisma";

export async function verifyAdmin(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const token =
    (req.cookies.adminToken as string) ??
    (req.headers.authorization?.split(" ")[1] as string);

  if (!token)
    return res.status(401).json({ message: "Unauthorized: No token provided" });

  const decoded = verifyToken<{ id: string }>(token);
  if (!decoded)
    return res.status(401).json({ message: "Unauthorized: Invalid token" });

  const admin = await prisma.admin.findUnique({ where: { id: decoded.id } });
  if (!admin)
    return res.status(401).json({ message: "Unauthorized: Admin not found" });

  res.locals.admin = admin;
  next();
}
