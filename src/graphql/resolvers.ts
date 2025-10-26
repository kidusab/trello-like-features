import { prisma, PrismaTypes } from "../prisma";
import { abstractEmail } from "../utils/string";
import { hashPassword, comparePassword, generateToken } from "../utils/token";

export const resolvers = {
  Query: {
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
  },

  Mutation: {
    register: async (
      _: any,
      { email, password }: { email: string; password: string }
    ) => {
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser)
        return { accessToken: null, refreshToken: null, user: null };

      const hashedPassword = await hashPassword(password);
      const user = await prisma.user.create({
        data: { email, password: hashedPassword },
      });

      const accessToken = generateToken({ userId: user.id, type: "access" });
      const refreshToken = generateToken({ userId: user.id, type: "refresh" });
      await prisma.refreshToken.create({
        data: {
          userId: user.id,
          token: refreshToken,
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
        },
      });

      return {
        accessToken,
        refreshToken,
        user,
      };
    },

    forgotPassword: async (
      _: any,
      { email }: { email: string },
      context: any
    ) => {
      const userId = context.userId;
      if (!userId) return { success: false, message: "Not authenticated" };

      //TODO: SEND RESET EMAIL HERE
      const token = generateToken({ userId, type: "password-reset" });
      await prisma.passwordResetToken.create({
        data: {
          userId,
          token,
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
        },
      });

      return {
        success: true,
        message: `Reset link was sent to your email.  ${abstractEmail(email)}`,
      };
    },

    updatePassword: async (
      _: any,
      {
        currentPassword,
        newPassword,
      }: { currentPassword: string; newPassword: string },
      context: any
    ) => {
      const userId = context.userId;
      if (!userId) return { success: false, message: "Not authenticated" };

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) return { success: false, message: "User not found" };

      const valid = comparePassword(currentPassword, user.password);
      if (!valid)
        return { success: false, message: "Current password is incorrect" };

      const hashedPassword = await hashPassword(newPassword);
      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
      });

      return { success: true, message: "Password updated successfully" };
    },

    // Creates a workspace, assigning creator as OWNER
    createWorkspace: async (
      _: any,
      { name }: { name: string },
      context: any
    ) => {
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
                  role: "OWNER", // Enum in Prisma model
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
  },
};
