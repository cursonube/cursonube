/**
 * Documento 2, sección 2 / Documento 9, sección 5: disparado por Enrollment
 * al completar el 100% de las clases de un curso — escuchado por
 * Certificates para generar el PDF, sin que Enrollment sepa que
 * Certificates existe.
 */
export const COURSE_COMPLETED_EVENT = 'course.completed';

export class CourseCompletedEvent {
  constructor(
    public readonly inscripcionId: string,
    public readonly tenantId: string,
  ) {}
}
