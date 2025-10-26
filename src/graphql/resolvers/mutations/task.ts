import { prisma, PrismaEnums } from "../../../prisma";
import { getProjectMembership } from "./project";

export default {
  // --- TASK CRUD MUTATIONS ---

  createTask: async (
    _: any,
    { projectId, title }: { projectId: string; title: string },
    context: any
  ) => {
    const userId = context.userId;
    if (!userId) throw new Error("Not authenticated");

    // Requires "MEMBER", "LEAD", "ADMIN", "OWNER" etc.
    const membership = await getProjectMembership(userId, projectId);
    if (
      !membership ||
      ![
        PrismaEnums.ProjectRole.PROJECT_LEAD,
        PrismaEnums.ProjectRole.CONTRIBUTOR,
        PrismaEnums.ProjectRole.PROJECT_VIEWER,
      ].includes(membership.role)
    ) {
      throw new Error(
        "You must be a project contributor or lead to create tasks."
      );
    }

    const task = await prisma.task.create({
      data: {
        title,
        projectId,
      },
    });

    return task;
  },

  updateTask: async (
    _: any,
    { taskId, title }: { taskId: string; title: string },
    context: any
  ) => {
    const userId = context.userId;
    if (!userId) throw new Error("Not authenticated");

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { project: true },
    });
    if (!task) throw new Error("Task not found");

    // Check project role
    const membership = await getProjectMembership(userId, task.projectId);
    if (
      !membership ||
      ![
        PrismaEnums.ProjectRole.PROJECT_LEAD,
        PrismaEnums.ProjectRole.CONTRIBUTOR,
        PrismaEnums.ProjectRole.PROJECT_VIEWER,
      ].includes(membership.role)
    ) {
      throw new Error(
        "You must be a project contributor or lead to update tasks."
      );
    }

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: { title },
    });

    return updated;
  },

  deleteTask: async (_: any, { taskId }: { taskId: string }, context: any) => {
    const userId = context.userId;
    if (!userId) throw new Error("Not authenticated");

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { project: true },
    });
    if (!task) throw new Error("Task not found");

    // Check project role
    const membership = await getProjectMembership(userId, task.projectId);
    if (
      !membership ||
      ![
        PrismaEnums.ProjectRole.PROJECT_LEAD,
        PrismaEnums.ProjectRole.CONTRIBUTOR,
        PrismaEnums.ProjectRole.PROJECT_VIEWER,
      ].includes(membership.role)
    ) {
      throw new Error(
        "You must be a project contributor or lead to delete tasks."
      );
    }

    await prisma.task.delete({ where: { id: taskId } });
    return { success: true, message: "Task deleted" };
  },
};
