import { z } from "zod";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { TRPCError } from "@trpc/server";
import { publicProcedure, protectedProcedure } from "../main";
import { db } from "../../db";
import { env } from "../../env";

const JWT_SECRET = env.JWT_SECRET;
const JWT_EXPIRES_IN = "7d"; // 7 days

// Helper to generate JWT token
function generateToken(userId: string, email: string, role: string) {
  return jwt.sign({ userId, email, role }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

// Register new user
export const register = publicProcedure
  .input(
    z.object({
      email: z.string().email(),
      password: z.string().min(8, "Password must be at least 8 characters"),
      name: z.string().optional(),
    }),
  )
  .mutation(async ({ input }) => {
    // Check if user already exists
    const existing = await db.user.findUnique({
      where: { email: input.email },
    });

    if (existing) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "User with this email already exists",
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(input.password, 10);

    // Create user
    const user = await db.user.create({
      data: {
        email: input.email,
        passwordHash,
        name: input.name,
        role: "user",
        subscription: "free",
      },
    });

    // Generate token
    const token = generateToken(user.id, user.email, user.role);

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        subscription: user.subscription,
      },
    };
  });

// Login
export const login = publicProcedure
  .input(
    z.object({
      email: z.string().email(),
      password: z.string(),
    }),
  )
  .mutation(async ({ input }) => {
    // Find user
    const user = await db.user.findUnique({
      where: { email: input.email },
    });

    if (!user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Invalid email or password",
      });
    }

    // Verify password
    const valid = await bcrypt.compare(input.password, user.passwordHash);

    if (!valid) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Invalid email or password",
      });
    }

    // Generate token
    const token = generateToken(user.id, user.email, user.role);

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        subscription: user.subscription,
      },
    };
  });

// Get current user
export const getCurrentUser = protectedProcedure.query(async ({ ctx }) => {
  const user = await db.user.findUnique({
    where: { id: ctx.userId },
  });

  if (!user) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "User not found",
    });
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    subscription: user.subscription,
    createdAt: user.createdAt,
  };
});

// Update profile
export const updateProfile = protectedProcedure
  .input(
    z.object({
      name: z.string().optional(),
      email: z.string().email().optional(),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    // If email is being changed, check if it's already taken
    if (input.email) {
      const existing = await db.user.findUnique({
        where: { email: input.email },
      });

      if (existing && existing.id !== ctx.userId) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Email already in use",
        });
      }
    }

    const user = await db.user.update({
      where: { id: ctx.userId },
      data: input,
    });

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      subscription: user.subscription,
    };
  });

// Change password
export const changePassword = protectedProcedure
  .input(
    z.object({
      currentPassword: z.string(),
      newPassword: z.string().min(8, "Password must be at least 8 characters"),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const user = await db.user.findUnique({
      where: { id: ctx.userId },
    });

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    // Verify current password
    const valid = await bcrypt.compare(
      input.currentPassword,
      user.passwordHash,
    );

    if (!valid) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Current password is incorrect",
      });
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(input.newPassword, 10);

    await db.user.update({
      where: { id: ctx.userId },
      data: { passwordHash },
    });

    return { success: true };
  });
