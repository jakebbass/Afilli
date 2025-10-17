import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import jwt from "jsonwebtoken";
import { env } from "../env";

// Context type for authenticated users
interface Context {
  userId?: string;
  userEmail?: string;
  userRole?: string;
}

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  sse: {
    enabled: true,
    client: {
      reconnectAfterInactivityMs: 5000,
    },
    ping: {
      enabled: true,
      intervalMs: 2500,
    },
  },
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

// Helper to verify JWT token
function verifyToken(token: string): {
  userId: string;
  email: string;
  role: string;
} {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as {
      userId: string;
      email: string;
      role: string;
    };
    return decoded;
  } catch {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Invalid or expired token",
    });
  }
}

// Middleware to check authentication
const isAuthenticated = t.middleware(async ({ ctx, next }) => {
  // Check for authorization header
  const authHeader = (
    ctx as unknown as { req?: { headers?: { authorization?: string } } }
  ).req?.headers?.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "No token provided",
    });
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  const decoded = verifyToken(token);

  return next({
    ctx: {
      userId: decoded.userId,
      userEmail: decoded.email,
      userRole: decoded.role,
    },
  });
});

export const createCallerFactory = t.createCallerFactory;
export const createTRPCRouter = t.router;
export const baseProcedure = t.procedure;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(isAuthenticated);
