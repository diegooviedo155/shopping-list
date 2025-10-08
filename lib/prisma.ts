import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const prisma = globalForPrisma.prisma ?? new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
})

// Ensure connection is established
if (!globalForPrisma.prisma) {
  prisma.$connect().catch((error) => {
    // Silent error handling
  })
}

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

export default prisma
