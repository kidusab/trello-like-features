import { NextFunction, Request, Response } from "express";
import { prisma } from "../../prisma";

export async function verifyToAccessWorkspace(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const workspaceId = req.params.workspaceId as string;
  if (!workspaceId)
    return res.status(400).json({ message: "Workspace id is required" });

  const userId = res.locals.user?.id;
  if (!userId)
    return res.status(401).json({ message: "Unauthorized: No user id" });

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    include: { memberships: true },
  });
  if (!workspace)
    return res.status(404).json({ message: "Workspace not found" });

  const membership = workspace.memberships.find(
    (membership) => membership.userId === userId
  );
  if (!membership) return res.status(403).json({ message: "Forbidden" });

  res.locals.workspace = workspace;
  return next();
}
