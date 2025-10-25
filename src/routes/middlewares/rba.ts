import { Request, Response, NextFunction } from "express";
import { prisma, PrismaTypes } from "../../prisma";

export function rba_workspace(allowedRoles: PrismaTypes.WorkspaceRole[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userInfo = res.locals.user;
    if (!userInfo || !userInfo.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userInfo.userId },
    });
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    const workspaceMembership = await prisma.workspaceMembership.findUnique({
      where: {
        userId_workspaceId: {
          userId: userInfo.userId,
          workspaceId: req.params.workspaceId,
        },
      },
    });
    if (!workspaceMembership) {
      return res
        .status(401)
        .json({ message: "Workspace membership not found" });
    }

    if (allowedRoles.includes(workspaceMembership.role)) {
      return next();
    }

    return res
      .status(403)
      .json({ message: "Forbidden: insufficient permissions" });
  };
}

export function rba_project(allowedRoles: PrismaTypes.ProjectRole[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userInfo = res.locals.user;
    if (!userInfo || !userInfo.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userInfo.userId },
    });
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    const projectMembership = await prisma.projectMembership.findUnique({
      where: {
        userId_projectId: {
          userId: userInfo.userId,
          projectId: req.params.projectId,
        },
      },
    });
    if (!projectMembership) {
      return res.status(401).json({ message: "Project membership not found" });
    }

    if (allowedRoles.includes(projectMembership.role)) {
      return next();
    }

    return res
      .status(403)
      .json({ message: "Forbidden: insufficient permissions" });
  };
}
