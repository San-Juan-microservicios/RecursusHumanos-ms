-- CreateEnum
CREATE TYPE "cargoEmpleado" AS ENUM ('REPARTIDOR', 'OPERARIO', 'ALMACENERO');

-- CreateTable
CREATE TABLE "Usuario" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "ci" TEXT NOT NULL,
    "password" TEXT NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Empleado" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "ci" TEXT NOT NULL,
    "sueldo" DOUBLE PRECISION NOT NULL,
    "cargo" "cargoEmpleado" NOT NULL,
    "fechaIngreso" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Empleado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permisos" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaFin" TIMESTAMP(3),
    "idEmpleado" INTEGER NOT NULL,

    CONSTRAINT "Permisos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_ci_key" ON "Usuario"("ci");

-- CreateIndex
CREATE UNIQUE INDEX "Empleado_ci_key" ON "Empleado"("ci");

-- AddForeignKey
ALTER TABLE "Permisos" ADD CONSTRAINT "Permisos_idEmpleado_fkey" FOREIGN KEY ("idEmpleado") REFERENCES "Empleado"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
