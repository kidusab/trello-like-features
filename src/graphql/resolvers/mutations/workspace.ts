import { prisma } from "../../../prisma";
import { PrismaTypes } from "../../../prisma";

export default {
  // Creates a workspace, assigning creator as OWNER
  createWorkspace: async (_: any, { name }: { name: string }, context: any) => {
    const userId = context.userId;
    if (!userId) throw new Error("Not authenticated");

    return await prisma.$transaction(async (tx) => {
      const workspace = await tx.workspace.create({
        data: {
          name,
          memberships: {
            create: [
              {
                userId,
                role: "OWNER",
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
        ...workspace,
        members: workspace.memberships,
      };
    });
  },

  addWorkspaceMember: async (
    _: any,
    { workspaceId, userEmail }: { workspaceId: string; userEmail: string },
    context: any
  ) => {
    const userId = context.userId;
    if (!userId) throw new Error("Not authenticated");

    const callerMembership = await prisma.workspaceMembership.findUnique({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId,
        },
      },
    });
    if (!callerMembership || callerMembership.role !== "OWNER") {
      throw new Error("Must be workspace owner to add members");
    }

    const user = await prisma.user.findUnique({
      where: { email: userEmail },
    });
    if (!user) throw new Error("User does not exist");

    const exists = await prisma.workspaceMembership.findUnique({
      where: {
        userId_workspaceId: {
          userId: user.id,
          workspaceId,
        },
      },
    });
    if (exists) throw new Error("User is already a member");

    const member = await prisma.workspaceMembership.create({
      data: {
        userId: user.id,
        workspaceId,
        role: "MEMBER",
      },
      include: {
        user: true,
      },
    });
    return member;
  },

  removeWorkspaceMember: async (
    _: any,
    { workspaceId, memberId }: { workspaceId: string; memberId: string },
    context: any
  ) => {
    const userId = context.userId;
    if (!userId) throw new Error("Not authenticated");

    const callerMembership = await prisma.workspaceMembership.findUnique({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId,
        },
      },
    });
    if (!callerMembership || callerMembership.role !== "OWNER") {
      throw new Error("Must be workspace owner to remove members");
    }

    const member = await prisma.workspaceMembership.findUnique({
      where: {
        userId_workspaceId: {
          userId: memberId,
          workspaceId,
        },
      },
    });

    if (!member) throw new Error("Member not found");
    if (member.role === "OWNER")
      throw new Error("Cannot remove the workspace owner");

    await prisma.workspaceMembership.delete({
      where: {
        userId_workspaceId: {
          userId: memberId,
          workspaceId,
        },
      },
    });

    return { success: true, message: "Member removed" };
  },

  updateWorkspaceMemberRole: async (
    _: any,
    {
      workspaceId,
      memberId,
      newRole,
    }: {
      workspaceId: string;
      memberId: string;
      newRole: PrismaTypes.WorkspaceRole;
    },
    context: any
  ) => {
    const userId = context.userId;
    if (!userId) throw new Error("Not authenticated");

    const callerMembership = await prisma.workspaceMembership.findUnique({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId,
        },
      },
    });
    if (!callerMembership || callerMembership.role !== "OWNER") {
      throw new Error("Must be workspace owner to update member roles");
    }

    // Ensure not updating owner role
    const member = await prisma.workspaceMembership.findUnique({
      where: {
        userId_workspaceId: {
          userId: memberId,
          workspaceId,
        },
      },
    });
    if (!member) throw new Error("Member not found");
    if (member.role === "OWNER")
      throw new Error("Cannot change the role of the owner");

    const updated = await prisma.workspaceMembership.update({
      where: {
        userId_workspaceId: {
          userId: memberId,
          workspaceId,
        },
      },
      data: {
        role: newRole,
      },
      include: {
        user: true,
      },
    });

    return {
      success: true,
      message: "Role updated",
      ...updated,
    };
  },
};
