import { getServerSession } from "next-auth";
import { authOptions } from "@/auth.config";

export async function getSession(req?: any, res?: any): Promise<any> {
  return await getServerSession(req, res, authOptions);
}
