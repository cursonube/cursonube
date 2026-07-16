-- CreateEnum
CREATE TYPE "AcademiaEstado" AS ENUM ('Activa', 'Suspendida', 'Cancelada');

-- CreateEnum
CREATE TYPE "PlantillaNombre" AS ENUM ('Creator', 'Academy', 'Business', 'Modern', 'Dark');

-- CreateEnum
CREATE TYPE "CursonubeStaffRol" AS ENUM ('SuperAdmin', 'Soporte');

-- CreateEnum
CREATE TYPE "AcademiaUsuarioRol" AS ENUM ('Owner', 'Administrador', 'Profesor', 'Editor');

-- CreateEnum
CREATE TYPE "AcademiaUsuarioEstado" AS ENUM ('Activo', 'InvitadoPendiente', 'Desactivado');

-- CreateEnum
CREATE TYPE "PlanSlug" AS ENUM ('Free', 'Starter', 'Pro', 'Business');

-- CreateEnum
CREATE TYPE "ProveedorBilling" AS ENUM ('MercadoPago');

-- CreateEnum
CREATE TYPE "SuscripcionEstado" AS ENUM ('Activa', 'Pausada', 'Vencida', 'Cancelada');

-- CreateEnum
CREATE TYPE "TipoAcceso" AS ENUM ('Gratis', 'PagoUnico');

-- CreateEnum
CREATE TYPE "EstadoCurso" AS ENUM ('Borrador', 'Publicado');

-- CreateEnum
CREATE TYPE "VideoProvider" AS ENUM ('YoutubeNoListado');

-- CreateEnum
CREATE TYPE "TipoAdjunto" AS ENUM ('Pdf', 'Archivo', 'Link');

-- CreateEnum
CREATE TYPE "TipoPagina" AS ENUM ('Home', 'Cursos', 'SobreNosotros', 'Contacto', 'Faq', 'Politicas', 'Login', 'Custom');

-- CreateEnum
CREATE TYPE "EstadoPagina" AS ENUM ('Borrador', 'Publicada');

-- CreateEnum
CREATE TYPE "TipoBloque" AS ENUM ('Hero', 'Texto', 'Imagen', 'Video', 'Cursos', 'Instructor', 'Testimonios', 'Faq', 'Cta', 'Newsletter', 'Contacto', 'Footer');

-- CreateEnum
CREATE TYPE "OrigenLead" AS ENUM ('Newsletter', 'Contacto');

-- CreateEnum
CREATE TYPE "ProveedorPago" AS ENUM ('MercadoPago');

-- CreateEnum
CREATE TYPE "EstadoConexion" AS ENUM ('Conectada', 'Desconectada', 'Revocada');

-- CreateEnum
CREATE TYPE "EstadoInscripcion" AS ENUM ('Activa', 'Completada', 'Cancelada');

-- CreateEnum
CREATE TYPE "EstadoPago" AS ENUM ('Aprobado', 'Pendiente', 'Rechazado', 'Reembolsado');

-- CreateTable
CREATE TABLE "plantillas" (
    "id" UUID NOT NULL,
    "nombre" "PlantillaNombre" NOT NULL,
    "config_base" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plantillas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academias" (
    "id" UUID NOT NULL,
    "subdominio" TEXT NOT NULL,
    "dominio_propio" TEXT,
    "nombre" TEXT NOT NULL,
    "plantilla_id" UUID NOT NULL,
    "logo_url" TEXT,
    "color_primario" TEXT NOT NULL,
    "color_secundario" TEXT NOT NULL,
    "imagen_principal_url" TEXT,
    "plan_id" UUID NOT NULL,
    "estado" "AcademiaEstado" NOT NULL DEFAULT 'Activa',
    "onboarding_completo" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "academias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cursonube_staff" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "rol" "CursonubeStaffRol" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cursonube_staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academia_usuarios" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT,
    "rol" "AcademiaUsuarioRol" NOT NULL,
    "estado" "AcademiaUsuarioEstado" NOT NULL DEFAULT 'InvitadoPendiente',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "academia_usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alumnos" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT,
    "nombre" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alumnos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "planes" (
    "id" UUID NOT NULL,
    "slug" "PlanSlug" NOT NULL,
    "max_profesores_editores" INTEGER NOT NULL,
    "max_alumnos" INTEGER,
    "max_cursos" INTEGER,
    "dominio_propio_habilitado" BOOLEAN NOT NULL,
    "marca_cursonube_visible" BOOLEAN NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "planes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suscripciones_academia" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "plan_id" UUID NOT NULL,
    "proveedor_billing" "ProveedorBilling" NOT NULL,
    "external_subscription_id" TEXT NOT NULL,
    "estado" "SuscripcionEstado" NOT NULL,
    "fecha_inicio" TIMESTAMP(3) NOT NULL,
    "fecha_proxima_facturacion" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "suscripciones_academia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cursos" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "titulo" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "tipo_acceso" "TipoAcceso" NOT NULL,
    "precio_centavos" INTEGER,
    "moneda" TEXT,
    "imagen_portada_url" TEXT,
    "estado" "EstadoCurso" NOT NULL DEFAULT 'Borrador',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "cursos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "curso_instructores" (
    "curso_id" UUID NOT NULL,
    "academia_usuario_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "curso_instructores_pkey" PRIMARY KEY ("curso_id","academia_usuario_id")
);

-- CreateTable
CREATE TABLE "modulos" (
    "id" UUID NOT NULL,
    "curso_id" UUID NOT NULL,
    "titulo" TEXT NOT NULL,
    "orden" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "modulos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clases" (
    "id" UUID NOT NULL,
    "modulo_id" UUID NOT NULL,
    "titulo" TEXT NOT NULL,
    "orden" INTEGER NOT NULL,
    "video_provider" "VideoProvider",
    "video_external_id" TEXT,
    "contenido_texto" TEXT,
    "duracion_estimada_minutos" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "clases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clase_adjuntos" (
    "id" UUID NOT NULL,
    "clase_id" UUID NOT NULL,
    "tipo" "TipoAdjunto" NOT NULL,
    "url" TEXT NOT NULL,
    "nombre_visible" TEXT NOT NULL,
    "orden" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clase_adjuntos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "paginas" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "tipo" "TipoPagina" NOT NULL,
    "slug" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "estado" "EstadoPagina" NOT NULL DEFAULT 'Borrador',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "paginas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bloques" (
    "id" UUID NOT NULL,
    "pagina_id" UUID NOT NULL,
    "tipo" "TipoBloque" NOT NULL,
    "orden" INTEGER NOT NULL,
    "propiedades" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bloques_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leads" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "origen" "OrigenLead" NOT NULL,
    "nombre" TEXT,
    "email" TEXT NOT NULL,
    "mensaje" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cuentas_pago_creador" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "proveedor" "ProveedorPago" NOT NULL,
    "external_account_id" TEXT NOT NULL,
    "access_token_encriptado" TEXT NOT NULL,
    "estado_conexion" "EstadoConexion" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cuentas_pago_creador_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inscripciones" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "alumno_id" UUID NOT NULL,
    "curso_id" UUID NOT NULL,
    "estado" "EstadoInscripcion" NOT NULL DEFAULT 'Activa',
    "fecha_inscripcion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_completado" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "inscripciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "progreso_clases" (
    "inscripcion_id" UUID NOT NULL,
    "clase_id" UUID NOT NULL,
    "completado" BOOLEAN NOT NULL DEFAULT false,
    "fecha_completado" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "progreso_clases_pkey" PRIMARY KEY ("inscripcion_id","clase_id")
);

-- CreateTable
CREATE TABLE "pagos" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "inscripcion_id" UUID NOT NULL,
    "proveedor" "ProveedorPago" NOT NULL,
    "external_payment_id" TEXT NOT NULL,
    "monto_centavos" INTEGER NOT NULL,
    "moneda" TEXT NOT NULL,
    "estado" "EstadoPago" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "pagos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certificados" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "inscripcion_id" UUID NOT NULL,
    "url_pdf" TEXT NOT NULL,
    "codigo_verificacion" TEXT NOT NULL,
    "fecha_emision" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "certificados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "staff_id" UUID NOT NULL,
    "tenant_id" UUID,
    "accion" TEXT NOT NULL,
    "metadata" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "plantillas_nombre_key" ON "plantillas"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "academias_subdominio_key" ON "academias"("subdominio");

-- CreateIndex
CREATE UNIQUE INDEX "academias_dominio_propio_key" ON "academias"("dominio_propio");

-- CreateIndex
CREATE UNIQUE INDEX "cursonube_staff_email_key" ON "cursonube_staff"("email");

-- CreateIndex
CREATE INDEX "academia_usuarios_tenant_id_idx" ON "academia_usuarios"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "academia_usuarios_tenant_id_email_key" ON "academia_usuarios"("tenant_id", "email");

-- CreateIndex
CREATE INDEX "alumnos_tenant_id_idx" ON "alumnos"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "alumnos_tenant_id_email_key" ON "alumnos"("tenant_id", "email");

-- CreateIndex
CREATE UNIQUE INDEX "planes_slug_key" ON "planes"("slug");

-- CreateIndex
CREATE INDEX "suscripciones_academia_tenant_id_idx" ON "suscripciones_academia"("tenant_id");

-- CreateIndex
CREATE INDEX "cursos_tenant_id_idx" ON "cursos"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "cursos_tenant_id_slug_key" ON "cursos"("tenant_id", "slug");

-- CreateIndex
CREATE INDEX "modulos_curso_id_idx" ON "modulos"("curso_id");

-- CreateIndex
CREATE INDEX "clases_modulo_id_idx" ON "clases"("modulo_id");

-- CreateIndex
CREATE INDEX "clase_adjuntos_clase_id_idx" ON "clase_adjuntos"("clase_id");

-- CreateIndex
CREATE INDEX "paginas_tenant_id_idx" ON "paginas"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "paginas_tenant_id_slug_key" ON "paginas"("tenant_id", "slug");

-- CreateIndex
CREATE INDEX "bloques_pagina_id_idx" ON "bloques"("pagina_id");

-- CreateIndex
CREATE INDEX "leads_tenant_id_idx" ON "leads"("tenant_id");

-- CreateIndex
CREATE INDEX "cuentas_pago_creador_tenant_id_idx" ON "cuentas_pago_creador"("tenant_id");

-- CreateIndex
CREATE INDEX "inscripciones_tenant_id_idx" ON "inscripciones"("tenant_id");

-- CreateIndex
CREATE INDEX "inscripciones_alumno_id_idx" ON "inscripciones"("alumno_id");

-- CreateIndex
CREATE INDEX "inscripciones_curso_id_idx" ON "inscripciones"("curso_id");

-- CreateIndex
CREATE INDEX "pagos_tenant_id_idx" ON "pagos"("tenant_id");

-- CreateIndex
CREATE INDEX "pagos_inscripcion_id_idx" ON "pagos"("inscripcion_id");

-- CreateIndex
CREATE UNIQUE INDEX "certificados_inscripcion_id_key" ON "certificados"("inscripcion_id");

-- CreateIndex
CREATE UNIQUE INDEX "certificados_codigo_verificacion_key" ON "certificados"("codigo_verificacion");

-- CreateIndex
CREATE INDEX "certificados_tenant_id_idx" ON "certificados"("tenant_id");

-- CreateIndex
CREATE INDEX "audit_logs_tenant_id_idx" ON "audit_logs"("tenant_id");

-- CreateIndex
CREATE INDEX "audit_logs_staff_id_idx" ON "audit_logs"("staff_id");

-- AddForeignKey
ALTER TABLE "academias" ADD CONSTRAINT "academias_plantilla_id_fkey" FOREIGN KEY ("plantilla_id") REFERENCES "plantillas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academias" ADD CONSTRAINT "academias_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "planes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academia_usuarios" ADD CONSTRAINT "academia_usuarios_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "academias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alumnos" ADD CONSTRAINT "alumnos_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "academias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suscripciones_academia" ADD CONSTRAINT "suscripciones_academia_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "academias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suscripciones_academia" ADD CONSTRAINT "suscripciones_academia_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "planes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cursos" ADD CONSTRAINT "cursos_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "academias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curso_instructores" ADD CONSTRAINT "curso_instructores_curso_id_fkey" FOREIGN KEY ("curso_id") REFERENCES "cursos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curso_instructores" ADD CONSTRAINT "curso_instructores_academia_usuario_id_fkey" FOREIGN KEY ("academia_usuario_id") REFERENCES "academia_usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "modulos" ADD CONSTRAINT "modulos_curso_id_fkey" FOREIGN KEY ("curso_id") REFERENCES "cursos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clases" ADD CONSTRAINT "clases_modulo_id_fkey" FOREIGN KEY ("modulo_id") REFERENCES "modulos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clase_adjuntos" ADD CONSTRAINT "clase_adjuntos_clase_id_fkey" FOREIGN KEY ("clase_id") REFERENCES "clases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paginas" ADD CONSTRAINT "paginas_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "academias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bloques" ADD CONSTRAINT "bloques_pagina_id_fkey" FOREIGN KEY ("pagina_id") REFERENCES "paginas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "academias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cuentas_pago_creador" ADD CONSTRAINT "cuentas_pago_creador_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "academias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inscripciones" ADD CONSTRAINT "inscripciones_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "academias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inscripciones" ADD CONSTRAINT "inscripciones_alumno_id_fkey" FOREIGN KEY ("alumno_id") REFERENCES "alumnos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inscripciones" ADD CONSTRAINT "inscripciones_curso_id_fkey" FOREIGN KEY ("curso_id") REFERENCES "cursos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progreso_clases" ADD CONSTRAINT "progreso_clases_inscripcion_id_fkey" FOREIGN KEY ("inscripcion_id") REFERENCES "inscripciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progreso_clases" ADD CONSTRAINT "progreso_clases_clase_id_fkey" FOREIGN KEY ("clase_id") REFERENCES "clases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos" ADD CONSTRAINT "pagos_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "academias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos" ADD CONSTRAINT "pagos_inscripcion_id_fkey" FOREIGN KEY ("inscripcion_id") REFERENCES "inscripciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificados" ADD CONSTRAINT "certificados_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "academias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificados" ADD CONSTRAINT "certificados_inscripcion_id_fkey" FOREIGN KEY ("inscripcion_id") REFERENCES "inscripciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "cursonube_staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "academias"("id") ON DELETE SET NULL ON UPDATE CASCADE;
