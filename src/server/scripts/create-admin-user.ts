import { db } from "../db";
import bcrypt from "bcryptjs";

async function createAdminUser() {
  const email = "admin@afilli.com";
  const password = "admin123"; // Change this in production!

  // Check if admin already exists
  const existing = await db.user.findUnique({
    where: { email },
  });

  if (existing) {
    console.log("✅ Admin user already exists:", email);
    console.log("User ID:", existing.id);
    return existing;
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 10);

  // Create admin user
  const user = await db.user.create({
    data: {
      email,
      passwordHash,
      name: "Admin User",
      role: "admin",
      subscription: "enterprise",
    },
  });

  console.log("✅ Created admin user:", email);
  console.log("User ID:", user.id);
  console.log("Password:", password);
  console.log("\n⚠️  Please change the password after first login!");

  return user;
}

createAdminUser()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });
