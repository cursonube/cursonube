-- AlterTable
ALTER TABLE "cursonube_staff" ADD COLUMN     "two_factor_habilitado" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "two_factor_secret" TEXT;
