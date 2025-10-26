import { PrismaEnums, PrismaTypes, prisma } from "../../../prisma";

export async function getProjectMembership(userId: string, projectId: string) {
  return prisma.projectMembership.findUnique({
    where: {
      userId_projectId: {
        userId,
        projectId,
      },
    },
  });
}

export default {
  // Create Project
  createProject: async (
    _: any,
    { workspaceId, name }: { workspaceId: string; name: string },
    context: any
  ) => {
    const userId = context.userId;
    if (!userId) throw new Error("Not authenticated");

    // Must be workspace member or owner
    const workspaceMembership = await prisma.workspaceMembership.findUnique({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId,
        },
      },
    });
    if (
      !workspaceMembership ||
      !["OWNER", "MEMBER"].includes(workspaceMembership.role)
    ) {
      throw new Error(
        "You must be a workspace OWNER, MEMBER to create a project."
      );
    }

    const project = await prisma.project.create({
      data: {
        name,
        workspaceId,
        memberships: {
          create: [
            {
              userId,
              role: PrismaEnums.ProjectRole.PROJECT_LEAD,
            },
          ],
        },
      },
      include: {
        memberships: {
          include: { user: true },
        },
      },
    });
    return {
      ...project,
      members: project.memberships,
    };
  },

  // Update Project
  updateProject: async (
    _: any,
    { projectId, name }: { projectId: string; name: string },
    context: any
  ) => {
    const userId = context.userId;
    if (!userId) throw new Error("Not authenticated");

    // Must be project member (any role)
    const membership = await getProjectMembership(userId, projectId);
    if (!membership) throw new Error("Not a member of this project");

    const updated = await prisma.project.update({
      where: { id: projectId },
      data: { name },
      include: {
        memberships: {
          include: { user: true },
        },
      },
    });
    return {
      ...updated,
      members: updated.memberships,
    };
  },

  // Delete Project
  deleteProject: async (
    _: any,
    { projectId }: { projectId: string },
    context: any
  ) => {
    const userId = context.userId;
    if (!userId) throw new Error("Not authenticated");

    // Only project OWNER can delete
    const membership = await getProjectMembership(userId, projectId);
    if (!membership || membership.role !== PrismaEnums.ProjectRole.PROJECT_LEAD)
      throw new Error("Only the project owner can delete the project");

    await prisma.project.delete({ where: { id: projectId } });
    return { success: true, message: "Project deleted" };
  },

  // Add Project Member
  addProjectMember: async (
    _: any,
    { projectId, userEmail }: { projectId: string; userEmail: string },
    context: any
  ) => {
    const userId = context.userId;
    if (!userId) throw new Error("Not authenticated");

    const callerMembership = await getProjectMembership(userId, projectId);
    if (!callerMembership) throw new Error("Not a member of this project");
    if (
      callerMembership.role !== PrismaEnums.ProjectRole.PROJECT_LEAD &&
      callerMembership.role !== PrismaEnums.ProjectRole.PROJECT_VIEWER
    )
      throw new Error("Only project owner or project lead can add members");

    const user = await prisma.user.findUnique({
      where: { email: userEmail },
    });
    if (!user) throw new Error("User does not exist");

    const exists = await prisma.projectMembership.findUnique({
      where: {
        userId_projectId: {
          userId: user.id,
          projectId,
        },
      },
    });
    if (exists) throw new Error("User is already a member of this project");

    const member = await prisma.projectMembership.create({
      data: {
        userId: user.id,
        projectId,
        role: PrismaEnums.ProjectRole.CONTRIBUTOR,
      },
      include: {
        user: true,
      },
    });
    return member;
  },

  // Remove Project Member
  removeProjectMember: async (
    _: any,
    { projectId, memberId }: { projectId: string; memberId: string },
    context: any
  ) => {
    const userId = context.userId;
    if (!userId) throw new Error("Not authenticated");

    const callerMembership = await getProjectMembership(userId, projectId);
    if (!callerMembership) throw new Error("Not a member of this project");
    if (
      callerMembership.role !== PrismaEnums.ProjectRole.PROJECT_LEAD &&
      callerMembership.role !== PrismaEnums.ProjectRole.PROJECT_VIEWER
    )
      throw new Error("Only project owner or project lead can remove members");

    const member = await prisma.projectMembership.findUnique({
      where: {
        userId_projectId: {
          userId: memberId,
          projectId,
        },
      },
    });

    if (!member) throw new Error("Project member not found");
    if (member.role === PrismaEnums.ProjectRole.PROJECT_LEAD)
      throw new Error("Cannot remove the project owner");

    await prisma.projectMembership.delete({
      where: {
        userId_projectId: {
          userId: memberId,
          projectId,
        },
      },
    });

    return { success: true, message: "Project member removed" };
  },

  // Update Project Member Role (NEW! per the instructions)
  updateProjectMemberRole: async (
    _: any,
    {
      projectId,
      memberId,
      newRole,
    }: {
      projectId: string;
      memberId: string;
      newRole: PrismaTypes.ProjectRole;
    },
    context: any
  ) => {
    const userId = context.userId;
    if (!userId) throw new Error("Not authenticated");

    // Only project OWNER or ADMIN can update roles
    const callerMembership = await getProjectMembership(userId, projectId);
    if (!callerMembership) throw new Error("Not a member of this project");
    if (
      callerMembership.role !== PrismaEnums.ProjectRole.PROJECT_LEAD &&
      callerMembership.role !== PrismaEnums.ProjectRole.PROJECT_VIEWER
    )
      throw new Error(
        "Only project owner or project lead can update project member roles"
      );

    const member = await prisma.projectMembership.findUnique({
      where: {
        userId_projectId: {
          userId: memberId,
          projectId,
        },
      },
    });
    if (!member) throw new Error("Project member not found");
    if (member.role === PrismaEnums.ProjectRole.PROJECT_LEAD)
      throw new Error("Cannot change the owner's role");

    const updated = await prisma.projectMembership.update({
      where: {
        userId_projectId: {
          userId: memberId,
          projectId,
        },
      },
      data: { role: newRole },
      include: { user: true },
    });

    return {
      success: true,
      message: "Project member role updated",
      previousRole: member.role,
      newRole: updated.role,
    };
  },
};
