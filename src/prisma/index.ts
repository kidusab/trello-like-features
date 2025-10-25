import { PrismaClient } from "./generated/client";
import * as PrismaTypes from "./generated/client";

export const prisma = new PrismaClient();
export type { PrismaTypes };
