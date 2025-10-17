import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function setup() {
  console.log("Running standalone setup...");
  
  try {
    // Test database connection
    await prisma.$connect();
    console.log("✅ Database connected");
    
    // Run any other setup tasks here (migrations are handled by Prisma automatically)
    
    console.log("✅ Standalone setup complete");
  } catch (error) {
    console.error("❌ Setup failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run setup if this file is executed directly
if (require.main === module) {
  setup()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error("Fatal error during setup:", error);
      process.exit(1);
    });
}

export { setup };
