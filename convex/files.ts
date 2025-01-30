import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const getFileUrl = query({
  args: {
    storageId: v.id("_storage"),
  },
  handler: async (ctx, { storageId }) => {
    try {
      const url = await ctx.storage.getUrl(storageId);
      if (!url) {
        console.error("Image URL not found for storageId:", storageId);
        return null;
      }
      console.log("Generated URL:", url); // Log the generated URL
      return url;
    } catch (error) {
      console.error("Failed to fetch image URL:", error);
      return null;
    }
  },
});
export const deleteById = mutation({
  args: {
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    return await ctx.storage.delete(args.storageId);
  },
});