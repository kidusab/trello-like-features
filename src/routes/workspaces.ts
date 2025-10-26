import { Router } from "express";
import { prisma } from "../prisma";
import { verifyAuth } from "./middlewares/verifyAuth";
import { PrismaEnums } from "../prisma";
import { verifyToAccessWorkspace } from "./middlewares/verifyToAccessWorkspace";

const workspaceRouter = Router();

workspaceRouter.use(verifyAuth);
workspaceRouter.post("/", async (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ message: "Name is required" });
  if (!description)
    return res.status(400).json({ message: "Description is required" });

  const userInfo = res.locals.user;

  const workspace = await prisma.workspace.create({
    data: {
      name,
      description,
      memberships: {
        create: { userId: userInfo.id, role: PrismaEnums.WorkspaceRole.OWNER },
      },
    },
  });

  res
    .status(200)
    .json({ message: "Workspace created successfully", workspace });
});

workspaceRouter.use(verifyToAccessWorkspace);

workspaceRouter.get("/:workspaceId", async (req, res) => {
  const workspace = res.locals.workspace;
  res
    .status(200)
    .json({ workspace, message: "Workspace fetched successfully" });
});
export default workspaceRouter;
