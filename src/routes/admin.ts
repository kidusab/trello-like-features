import { Router } from "express";
import { prisma, PrismaEnums } from "../prisma";
import { comparePassword, generateToken, hashPassword } from "../utils/token";
import { verifyAdmin } from "./middlewares/verifyAdmin";

const adminRouter = Router();

adminRouter.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const admin = await prisma.admin.findUnique({ where: { email } });

  if (!admin) {
    return res.status(401).json({ message: "Admin not found" });
  }

  if (!comparePassword(password, admin.password))
    return res.status(401).json({ message: "Invalid credentials" });

  const token = generateToken({ id: admin.id }, 1000 * 60 * 60 * 24);
  res.cookie("adminToken", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 1000 * 60 * 60 * 24 * 30,
  });
  res.status(200).json({ message: "Admin logged in successfully" });
});

adminRouter.use(verifyAdmin);

adminRouter.post("/logout", (req, res) => {
  res.clearCookie("adminToken");
  res.status(200).json({ message: "Admin logged out successfully" });
});

adminRouter.post("/ban/user", async (req, res) => {
  const { id } = req.body;

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return res.status(404).json({ message: "User not found" });

  if (user.globalStatus === PrismaEnums.GlobalStatus.BANNED)
    return res.status(400).json({ message: "User already banned" });

  const bannedUser = await prisma.user.update({
    where: { id },
    data: { globalStatus: PrismaEnums.GlobalStatus.BANNED },
  });
  if (!bannedUser) return res.status(404).json({ message: "User not found" });

  res.status(200).json({ message: "User banned successfully" });
});

adminRouter.post("/unban/user", async (req, res) => {
  const { id } = req.body;

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return res.status(404).json({ message: "User not found" });
  if (user.globalStatus === PrismaEnums.GlobalStatus.ACTIVE)
    return res.status(400).json({ message: "User already active" });

  const activeUser = await prisma.user.update({
    where: { id },
    data: { globalStatus: PrismaEnums.GlobalStatus.ACTIVE },
  });
  if (!activeUser) return res.status(404).json({ message: "User not found" });

  res.status(200).json({ message: "User active successfully" });
});

export default adminRouter;
