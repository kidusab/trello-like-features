import { prisma, PrismaEnums } from "../../../prisma";
import { getProjectMembership } from "./project";

export default {
  createTask: async (
    _: any,
    {
      projectId,
      title,
      assigneeId,
    }: { projectId: string; title: string; assigneeId: string },
    context: any
  ) => {
    const userId = context.userId;
    if (!userId) throw new Error("Not authenticated");

    const membership = await getProjectMembership(userId, projectId);

    if (!membership) throw new Error("You are not a member of this project");
    if (membership.role === PrismaEnums.ProjectRole.PROJECT_VIEWER) {
      throw new Error("You are not a contributor of this project");
    }

    if (assigneeId) {
      const assigneeMembership = await getProjectMembership(
        assigneeId,
        projectId
      );

      if (!assigneeMembership)
        throw new Error("Assignee is not a member of this project");

      if (assigneeMembership.role === PrismaEnums.ProjectRole.PROJECT_VIEWER)
        throw new Error("Assignee is not a contributor of this project");
    }

    const task = await prisma.task.create({
      data: {
        title,
        projectId,
        assignees: {
          connect: {
            id: userId,
          },
        },
        assignments: {
          create: {
            userId: assigneeId,
          },
        },
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
