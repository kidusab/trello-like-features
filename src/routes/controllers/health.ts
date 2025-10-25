import { prisma } from "../prisma";
import { tryCatch } from "../utils/try_catch";
import { Request, Response } from "express";

export async function healthController(req: Request, res: Response) {
  const { error } = await tryCatch(prisma.$queryRaw`SELECT 1 as CONNECTED`);

  if (error) {
    res.status(500).json({ apiWorking: true, databaseConnected: false });
    return;
  }

  res.status(200).json({ apiWorking: true, databaseConnected: true });
}
