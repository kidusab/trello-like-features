import { prisma } from "../../../prisma";
import { hashPassword, comparePassword } from "../../../utils/token";
import { generateToken } from "../../../utils/token";
import { abstractEmail } from "../../../utils/string";

export default {
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
};
