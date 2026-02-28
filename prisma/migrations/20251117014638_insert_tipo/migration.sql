/*
  Warnings:

  - You are about to drop the column `nombre` on the `Permisos` table. All the data in the column will be lost.
  - Added the required column `tipo` to the `Permisos` table without a default value. This is not possible if the table is not empty.
  - Added the required column `titulo` to the `Permisos` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Permisos" DROP COLUMN "nombre",
ADD COLUMN     "tipo" TEXT NOT NULL,
ADD COLUMN     "titulo" TEXT NOT NULL;
