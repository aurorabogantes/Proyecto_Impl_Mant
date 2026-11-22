const PDFDocument = require("pdfkit");
const reportService = require("../services/reportService");

// Un docente/administrador puede ver el reporte de cualquier estudiante;
// un estudiante solo puede ver el suyo propio.
function puedeVerReporte(user, estudianteId) {
    if (user.rol === "docente" || user.rol === "administrador") return true;
    return user.rol === "estudiante" && Number(user.estudianteId) === Number(estudianteId);
}

function validarId(res, valor) {
    if (!/^[1-9]\d*$/.test(valor) || Number(valor) > 2147483647) {
        res.status(400).json({ error: "El identificador debe ser un entero positivo válido" });
        return false;
    }
    return true;
}

function responderError(res, error) {
    if (res.headersSent) {
        res.destroy(error);
        return;
    }
    res.status(error.statusCode || 500).json({ error: error.message });
}

const reportController = {

    // GET /api/reports/student/:estudianteId  (sirve tanto a docente como a padre/tutor)
    async student(req, res) {
        try {
            if (!validarId(res, req.params.estudianteId)) return;
            if (!puedeVerReporte(req.user, req.params.estudianteId)) {
                return res.status(403).json({ error: "No tienes permiso para ver este reporte" });
            }
            const reporte = await reportService.getStudentReport(req.params.estudianteId);
            res.json(reporte);
        } catch (error) {
            responderError(res, error);
        }
    },

    // GET /api/reports/course/:cursoId
    async course(req, res) {
        try {
            if (!validarId(res, req.params.cursoId)) return;
            const reporte = await reportService.getCourseReport(req.params.cursoId);
            res.json(reporte);
        } catch (error) {
            responderError(res, error);
        }
    },

    // GET /api/reports/student/:estudianteId/pdf  -> RF-22
    async studentPdf(req, res) {
        try {
            if (!validarId(res, req.params.estudianteId)) return;
            if (!puedeVerReporte(req.user, req.params.estudianteId)) {
                return res.status(403).json({ error: "No tienes permiso para ver este reporte" });
            }
            const reporte = await reportService.getStudentReport(req.params.estudianteId);

            res.setHeader("Content-Type", "application/pdf");
            res.setHeader("Content-Disposition", `attachment; filename=reporte_estudiante_${req.params.estudianteId}.pdf`);

            const doc = new PDFDocument({ margin: 50 });
            doc.pipe(res);
            doc.on("error", error => responderError(res, error));

            doc.fontSize(18).text("Reporte de desempeño", { align: "center" });
            doc.moveDown();
            doc.fontSize(12).text(`Estudiante: ${reporte.nombre || "N/A"}`);
            doc.text(`Generado el: ${reporte.generadoEl.toLocaleDateString("es-CR")}`);
            doc.moveDown();

            doc.fontSize(14).text("Resumen");
            doc.fontSize(11)
                .text(`Cursos inscritos: ${reporte.resumen.cursosInscritos}`)
                .text(`Cursos completados: ${reporte.resumen.cursosCompletados}`)
                .text(`Avance promedio: ${reporte.resumen.promedioAvance}%`)
                .text(`Tiempo total de uso: ${reporte.resumen.minutosUso} minutos`);
            doc.moveDown();

            doc.fontSize(14).text("Cursos");
            if (reporte.cursos.length === 0) doc.fontSize(11).text("Sin cursos inscritos.");
            reporte.cursos.forEach(c => {
                doc.fontSize(11).text(`- ${c.tituloCurso}: ${c.porcentaje}% (${c.getEstado()}) - Lecciones: ${c.leccionesCompletadas}/${c.totalLecciones}`);
            });
            doc.moveDown();

            doc.fontSize(14).text("Actividad reciente");
            if (reporte.actividadesRecientes.length === 0) doc.fontSize(11).text("Sin actividad registrada.");
            reporte.actividadesRecientes.forEach(a => {
                const fecha = a.FechaCompletado ? new Date(a.FechaCompletado).toLocaleDateString("es-CR") : "";
                doc.fontSize(11).text(`- [${fecha}] ${a.Curso} · ${a.Leccion} (${a.Puntuacion ?? "-"} pts)`);
            });

            doc.end();
        } catch (error) {
            responderError(res, error);
        }
    },

    // GET /api/reports/course/:cursoId/pdf  (solo docente/administrador)
    async coursePdf(req, res) {
        try {
            if (!validarId(res, req.params.cursoId)) return;
            const reporte = await reportService.getCourseReport(req.params.cursoId);

            res.setHeader("Content-Type", "application/pdf");
            res.setHeader("Content-Disposition", `attachment; filename=reporte_curso_${req.params.cursoId}.pdf`);

            const doc = new PDFDocument({ margin: 50 });
            doc.pipe(res);
            doc.on("error", error => responderError(res, error));

            doc.fontSize(18).text("Reporte grupal del curso", { align: "center" });
            doc.moveDown();
            doc.fontSize(12).text(`Curso: ${reporte.tituloCurso || "N/A"}`);
            doc.text(`Generado el: ${reporte.generadoEl.toLocaleDateString("es-CR")}`);
            doc.moveDown();

            doc.fontSize(14).text("Resumen");
            doc.fontSize(11)
                .text(`Total de estudiantes: ${reporte.resumen.totalEstudiantes}`)
                .text(`Completados: ${reporte.resumen.completados}`)
                .text(`Sin avance: ${reporte.resumen.sinAvance}`)
                .text(`Avance promedio: ${reporte.resumen.promedioAvance}%`);
            doc.moveDown();

            doc.fontSize(14).text("Estudiantes");
            if (reporte.estudiantes.length === 0) {
                doc.fontSize(11).text("No hay estudiantes inscritos en este curso.");
            } else {
                reporte.estudiantes.forEach(e => {
                    doc.fontSize(11).text(`- ${e.nombre}: ${e.porcentaje}% (${e.getEstado()}) - Lecciones: ${e.leccionesCompletadas}/${e.totalLecciones}`);
                });
            }

            doc.end();
        } catch (error) {
            responderError(res, error);
        }
    }

};

module.exports = reportController;
