/*
  Warnings:

  - Made the column `created_at` on table `apartments` required. This step will fail if there are existing NULL values in that column.
  - Made the column `status` on table `apartments` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "apartments" ADD COLUMN     "description" TEXT,
ALTER COLUMN "created_at" SET NOT NULL,
ALTER COLUMN "updated_at" DROP DEFAULT,
ALTER COLUMN "status" SET NOT NULL;

-- AlterTable
ALTER TABLE "projects" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "visits" ALTER COLUMN "updated_at" DROP DEFAULT;
