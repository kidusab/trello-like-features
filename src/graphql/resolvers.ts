import { prisma, PrismaEnums, PrismaTypes } from "../prisma";
import { abstractEmail } from "../utils/string";
import { hashPassword, comparePassword, generateToken } from "../utils/token";

// Helper to check project role membership
async function getProjectMembership(userId: string, projectId: string) {
  return prisma.projectMembership.findUnique({
    where: {
      userId_projectId: {
        userId,
        projectId,
      },
    },
  });
}

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
      if (
        !membership ||
        membership.role !== PrismaEnums.ProjectRole.PROJECT_LEAD
      )
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
        throw new Error(
          "Only project owner or project lead can remove members"
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
        !["OWNER", "ADMIN", "LEAD", "MEMBER"].includes(membership.role)
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
        !["OWNER", "ADMIN", "LEAD", "MEMBER"].includes(membership.role)
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

    deleteTask: async (
      _: any,
      { taskId }: { taskId: string },
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
        !["OWNER", "ADMIN", "LEAD", "MEMBER"].includes(membership.role)
      ) {
        throw new Error(
          "You must be a project contributor or lead to delete tasks."
        );
      }

      await prisma.task.delete({ where: { id: taskId } });
      return { success: true, message: "Task deleted" };
    },
  }, // end Mutation
};
