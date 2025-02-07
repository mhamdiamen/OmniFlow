import { query } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getCompanyByOwner = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("User not authenticated");

    // Fetch the company where the user is the owner
    const company = await ctx.db
      .query("companies")
      .withIndex("ownerId", (q) => q.eq("ownerId", userId))
      .first();

    return company ? { ...company, logoUrl: company.logoUrl || "" } : null;

  },
});