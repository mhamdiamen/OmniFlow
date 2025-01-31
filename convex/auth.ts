import { convexAuth, getAuthUserId } from "@convex-dev/auth/server";
import GitHub from "@auth/core/providers/github";
import Google from "@auth/core/providers/google";
import { Password } from "@convex-dev/auth/providers/Password";
import { DataModel } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { checkPermission } from "./lib/permissions";
import { Id } from "./_generated/dataModel";

const CustomPassword = Password<DataModel>({
  profile(params) {
    return {
      email: params.email as string,
      name: params.name as string,
      createdAt: Date.now(),
    };
  },
});

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [GitHub, Google, CustomPassword],
  callbacks: {
    async afterUserCreatedOrUpdated(ctx, args) {
      if (args.existingUserId) return;

      let defaultRole = await ctx.db
        .query("roles")
        .filter(q => q.eq(q.field("companyId"), undefined))
        .first();

      if (!defaultRole) {
        const roleId = await ctx.db.insert("roles", {
          companyId: undefined,
          name: "Default",
          permissions: [],
        });

        defaultRole = await ctx.db.get(roleId);
      }

      if (defaultRole?._id) {
        await ctx.db.patch(args.userId, {
          roleId: defaultRole._id as Id<"roles">,
        });
      }
    }
  },
});

export const getMe = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const user = await ctx.db.get(userId);
    if (!user) return null;

    const role = user.roleId ? await ctx.db.get(user.roleId as Id<"roles">) : null;

    return {
      id: userId,
      companyId: user.companyId,
      role: role?.name || "Guest",
      permissions: role?.permissions || [],
    };
  },
});

export const updateUserRole = mutation({
  args: {
    userId: v.id("users"),
    newRoleId: v.id("roles"),
  },
  handler: async (ctx, args) => {
    const adminId = await getAuthUserId(ctx);
    if (!adminId) throw new Error("Not signed in");

    const canUpdateRoles = await checkPermission(ctx, adminId, "manage_users");
    if (!canUpdateRoles) throw new Error("Insufficient permissions");

    await ctx.db.patch(args.userId, { roleId: args.newRoleId });
  },
});
