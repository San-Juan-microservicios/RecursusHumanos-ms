export enum EstadoAsistencia {
  PRESENTE = 'PRESENTE',
  AUSENTE  = 'AUSENTE',
  TARDANZA = 'TARDANZA',
  PERMISO  = 'PERMISO',
  FERIADO  = 'FERIADO',
}

export const estadoAsistenciaList = Object.values(EstadoAsistencia);