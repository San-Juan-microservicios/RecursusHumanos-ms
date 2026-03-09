-- CreateEnum
CREATE TYPE "EstadoAsistencia" AS ENUM ('PRESENTE', 'AUSENTE', 'TARDANZA', 'PERMISO', 'FERIADO');

-- CreateEnum
CREATE TYPE "EstadoPlanilla" AS ENUM ('BORRADOR', 'CERRADA');

-- CreateTable
CREATE TABLE "Asistencia" (
    "id" SERIAL NOT NULL,
    "idEmpleado" INTEGER NOT NULL,
    "fecha" DATE NOT NULL,
    "estado" "EstadoAsistencia" NOT NULL,
    "observacion" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Asistencia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Planilla" (
    "id" SERIAL NOT NULL,
    "mes" INTEGER NOT NULL,
    "anio" INTEGER NOT NULL,
    "estado" "EstadoPlanilla" NOT NULL DEFAULT 'BORRADOR',
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cerradoEn" TIMESTAMP(3),

    CONSTRAINT "Planilla_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DetallePlanilla" (
    "id" SERIAL NOT NULL,
    "idPlanilla" INTEGER NOT NULL,
    "idEmpleado" INTEGER NOT NULL,
    "salarioBase" DOUBLE PRECISION NOT NULL,
    "diasTrabajados" INTEGER NOT NULL,
    "diasAusente" INTEGER NOT NULL,
    "descuentos" DOUBLE PRECISION NOT NULL,
    "totalAPagar" DOUBLE PRECISION NOT NULL,
    "observacion" TEXT,

    CONSTRAINT "DetallePlanilla_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Asistencia_idEmpleado_fecha_key" ON "Asistencia"("idEmpleado", "fecha");

-- CreateIndex
CREATE UNIQUE INDEX "Planilla_mes_anio_key" ON "Planilla"("mes", "anio");

-- CreateIndex
CREATE UNIQUE INDEX "DetallePlanilla_idPlanilla_idEmpleado_key" ON "DetallePlanilla"("idPlanilla", "idEmpleado");

-- AddForeignKey
ALTER TABLE "Asistencia" ADD CONSTRAINT "Asistencia_idEmpleado_fkey" FOREIGN KEY ("idEmpleado") REFERENCES "Empleado"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetallePlanilla" ADD CONSTRAINT "DetallePlanilla_idPlanilla_fkey" FOREIGN KEY ("idPlanilla") REFERENCES "Planilla"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetallePlanilla" ADD CONSTRAINT "DetallePlanilla_idEmpleado_fkey" FOREIGN KEY ("idEmpleado") REFERENCES "Empleado"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
