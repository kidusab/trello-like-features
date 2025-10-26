import { PrismaClient } from "./generated/client";
import * as PrismaTypes from "./generated/client";
import * as PrismaEnums from "./generated/enums";

export const prisma = new PrismaClient();
export { PrismaEnums };
export type { PrismaTypes };
