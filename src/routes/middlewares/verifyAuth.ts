import { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../../utils/token";
import { prisma } from "../../prisma";

export async function verifyAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const token = req.headers.authorization?.split(" ")[1] as string;
  console.log(token);
  if (!token)
    return res.status(401).json({ message: "Unauthorized: No token provided" });

  const decoded = verifyAccessToken(token) as { userId: string };
  if (!decoded)
    return res.status(401).json({ message: "Unauthorized: Invalid token" });

  const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
  if (!user)
    return res.status(401).json({ message: "Unauthorized: User not found" });

  res.locals.user = decoded;
  next();
}
