import { prisma } from "../../prisma";

export default {
  getWorkspace: async (_: any, { id }: { id: string }, context: any) => {
    const userId = context.userId;
    if (!userId) return null;

    const membership = await prisma.workspaceMembership.findUnique({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId: id,
        },
      },
    });

    if (!membership) return null;

    const workspace = await prisma.workspace.findUnique({
      where: { id },
      include: {
        memberships: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!workspace) return null;
    return {
      ...workspace,
      members: workspace.memberships,
    };
  },

  getAllWorkspaces: async (_: any, __: any, context: any) => {
    const adminId = context.adminId;
    if (!adminId) return [];

    const admin = await prisma.admin.findUnique({ where: { id: adminId } });
    if (!admin) return [];

    const workspaces = await prisma.workspace.findMany({
      include: {
        memberships: {
          include: {
            user: true,
          },
        },
      },
    });

    return workspaces.map((w) => ({
      ...w,
      members: w.memberships,
    }));
  },

  getProject: async (_: any, { id }: { id: string }, context: any) => {
    const userId = context.userId;
    if (!userId) return null;

    const projectMembership = await prisma.projectMembership.findUnique({
      where: { userId_projectId: { userId, projectId: id } },
    });

    if (!projectMembership) return null;

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        memberships: {
          include: { user: true },
        },
      },
    });
    if (!project) return null;

    return {
      ...project,
      members: project.memberships,
    };
  },
  getAllProjects: async (_: any, __: any, context: any) => {
    const userId = context.userId;
    if (!userId) return [];

    // Return all projects where user is a project member
    const memberships = await prisma.projectMembership.findMany({
      where: { userId },
      include: {
        project: {
          include: {
            memberships: {
              include: { user: true },
            },
          },
        },
      },
    });
    return memberships.map((m) => ({
      ...m.project,
      members: m.project.memberships,
    }));
  },
};
