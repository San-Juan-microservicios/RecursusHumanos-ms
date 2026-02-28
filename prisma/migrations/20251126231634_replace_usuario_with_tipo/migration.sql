/*
  Warnings:

  - You are about to drop the column `cargo` on the `Empleado` table. All the data in the column will be lost.
  - You are about to drop the `Usuario` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[idTipo]` on the table `Empleado` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `idTipo` to the `Empleado` table without a default value. This is not possible if the table is not empty.
  - Added the required column `password` to the `Empleado` table without a default value. This is not possible if the table is not empty.
  - Added the required column `rol` to the `Empleado` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Empleado" DROP COLUMN "cargo",
ADD COLUMN     "idTipo" INTEGER NOT NULL,
ADD COLUMN     "password" TEXT NOT NULL,
ADD COLUMN     "rol" TEXT NOT NULL;

-- DropTable
DROP TABLE "Usuario";

-- DropEnum
DROP TYPE "cargoEmpleado";

-- CreateTable
CREATE TABLE "Tipo" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Tipo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Empleado_idTipo_key" ON "Empleado"("idTipo");

-- AddForeignKey
ALTER TABLE "Empleado" ADD CONSTRAINT "Empleado_idTipo_fkey" FOREIGN KEY ("idTipo") REFERENCES "Tipo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
