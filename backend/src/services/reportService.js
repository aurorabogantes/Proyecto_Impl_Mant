const progressService = require("./progressService");
const repository = require("../repositories/ReportRepository");

function noEncontrado(mensaje) {
    const error = new Error(mensaje);
    error.statusCode = 404;
    return error;
}

class ReportService {

    // RF-19 / RF-21: reporte individual (docente o padre/tutor)
    async getStudentReport(estudianteId) {
        const estudiante = await repository.obtenerEstudiante(estudianteId);
        if (!estudiante) throw noEncontrado("Estudiante no encontrado");
        const [cursos, historial, minutosUso] = await Promise.all([
            progressService.getProgressByStudent(estudianteId),
            progressService.getActivityHistory(estudianteId),
            progressService.getTotalUsageTime(estudianteId)
        ]);

        const cursosCompletados = cursos.filter(c => c.completado).length;
        const promedioAvance = cursos.length > 0
            ? Math.round(cursos.reduce((sum, c) => sum + Number(c.porcentaje), 0) / cursos.length)
            : 0;

        return {
            estudianteId: Number(estudianteId),
            nombre: estudiante.Nombre,
            generadoEl: new Date(),
            resumen: {
                cursosInscritos: cursos.length,
                cursosCompletados,
                promedioAvance,
                minutosUso
            },
            cursos,
            actividadesRecientes: historial.slice(0, 10)
        };
    }

    // RF-20: reporte grupal por curso, para el docente
    async getCourseReport(cursoId) {
        const curso = await repository.obtenerCurso(cursoId);
        if (!curso) throw noEncontrado("Curso no encontrado");
        const estudiantes = await progressService.getProgressByCourse(cursoId);

        const promedioAvance = estudiantes.length > 0
            ? Math.round(estudiantes.reduce((sum, e) => sum + Number(e.porcentaje), 0) / estudiantes.length)
            : 0;

        return {
            cursoId: Number(cursoId),
            tituloCurso: curso.Titulo,
            generadoEl: new Date(),
            resumen: {
                totalEstudiantes: estudiantes.length,
                completados: estudiantes.filter(e => e.completado).length,
                sinAvance: estudiantes.filter(e => Number(e.porcentaje) === 0).length,
                promedioAvance
            },
            estudiantes
        };
    }
}

module.exports = new ReportService();
