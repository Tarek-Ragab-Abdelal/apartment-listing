-- CreateTable
CREATE TABLE "apartments" (
    "id" SERIAL NOT NULL,
    "unitName" TEXT NOT NULL,
    "project" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "priceEgp" INTEGER NOT NULL,
    "description" TEXT,
    "images" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "apartments_pkey" PRIMARY KEY ("id")
);
