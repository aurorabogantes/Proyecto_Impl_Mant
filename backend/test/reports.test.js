const { test, after } = require("node:test");
const assert = require("node:assert/strict");
const { inflateSync } = require("node:zlib");
const express = require("express");
const jwt = require("jsonwebtoken");
const repository = require("../src/repositories/ReportRepository");
const progressService = require("../src/services/progressService");
const reportService = require("../src/services/reportService");
const StudentProgress = require("../src/models/StudentProgress");
const { JWT_SECRET } = require("../src/middleware/authMiddleware");

function textoPdf(bytes) {
    const pdf = bytes.toString("latin1");
    const streams = [...pdf.matchAll(/stream\r?\n([\s\S]*?)\r?\nendstream/g)];
    return streams.map(stream => {
        const content = inflateSync(Buffer.from(stream[1], "latin1")).toString("latin1");
        return [...content.matchAll(/<([0-9a-f]+)>/gi)]
            .map(match => Buffer.from(match[1], "hex").toString("latin1"))
            .join("");
    }).join("");
}

const original = {
    estudiante: repository.obtenerEstudiante,
    curso: repository.obtenerCurso,
    progresoEstudiante: progressService.getProgressByStudent,
    historial: progressService.getActivityHistory,
    tiempo: progressService.getTotalUsageTime,
    progresoCurso: progressService.getProgressByCourse
};

repository.obtenerEstudiante = async id => Number(id) === 99 ? null : { Nombre: "Ana" };
repository.obtenerCurso = async id => Number(id) === 99 ? null : { Titulo: "Scratch" };
progressService.getProgressByStudent = async id => Number(id) === 2 ? [] : [
    new StudentProgress({ tituloCurso: "Scratch", porcentaje: 50, leccionesCompletadas: 2, totalLecciones: 4 }),
    new StudentProgress({ tituloCurso: "Web", porcentaje: 100, completado: true, leccionesCompletadas: 3, totalLecciones: 3 })
];
progressService.getActivityHistory = async id => Number(id) === 2 ? [] : Array.from({ length: 12 }, (_, i) => ({ Leccion: `Lección ${i}` }));
progressService.getTotalUsageTime = async () => 40;
progressService.getProgressByCourse = async id => Number(id) === 2 ? [] : [
    new StudentProgress({ nombre: "Ana", porcentaje: 0, leccionesCompletadas: 0, totalLecciones: 4 }),
    new StudentProgress({ nombre: "Luis", porcentaje: 100, completado: true, leccionesCompletadas: 4, totalLecciones: 4 })
];

after(() => {
    repository.obtenerEstudiante = original.estudiante;
    repository.obtenerCurso = original.curso;
    progressService.getProgressByStudent = original.progresoEstudiante;
    progressService.getActivityHistory = original.historial;
    progressService.getTotalUsageTime = original.tiempo;
    progressService.getProgressByCourse = original.progresoCurso;
});

test("reportes calculan resúmenes y conservan la identidad sin registros relacionados", async () => {
    const estudiante = await reportService.getStudentReport(1);
    assert.equal(estudiante.nombre, "Ana");
    assert.deepEqual(estudiante.resumen, { cursosInscritos: 2, cursosCompletados: 1, promedioAvance: 75, minutosUso: 40 });
    assert.equal(estudiante.actividadesRecientes.length, 10);
    const sinCursos = await reportService.getStudentReport(2);
    assert.equal(sinCursos.nombre, "Ana");
    assert.equal(sinCursos.resumen.promedioAvance, 0);

    const curso = await reportService.getCourseReport(1);
    assert.equal(curso.tituloCurso, "Scratch");
    assert.deepEqual(curso.resumen, { totalEstudiantes: 2, completados: 1, sinAvance: 1, promedioAvance: 50 });
    const sinEstudiantes = await reportService.getCourseReport(2);
    assert.equal(sinEstudiantes.tituloCurso, "Scratch");
    assert.equal(sinEstudiantes.resumen.totalEstudiantes, 0);
    await assert.rejects(reportService.getStudentReport(99), { statusCode: 404 });
    await assert.rejects(reportService.getCourseReport(99), { statusCode: 404 });
});

test("rutas validan permisos e identificadores y generan ambos PDF", async () => {
    const app = express();
    app.use("/api/reports", require("../src/routes/reportRoutes"));
    const server = await new Promise(resolve => {
        const listening = app.listen(0, "127.0.0.1", () => resolve(listening));
    });
    const base = `http://127.0.0.1:${server.address().port}/api/reports`;
    const docente = jwt.sign({ rol: "docente" }, JWT_SECRET);
    const alumno = jwt.sign({ rol: "estudiante", estudianteId: 1 }, JWT_SECRET);
    const get = (path, token) => fetch(base + path, { headers: token ? { Authorization: `Bearer ${token}` } : {} });

    try {
        assert.equal((await get("/student/1")).status, 401);
        assert.equal((await get("/student/2", alumno)).status, 403);
        assert.equal((await get("/course/1", alumno)).status, 403);
        for (const path of ["/student/abc", "/student/0/pdf", "/course/2147483648", "/course/1.5/pdf"]) {
            assert.equal((await get(path, docente)).status, 400, path);
        }
        for (const path of ["/student/99", "/student/99/pdf", "/course/99", "/course/99/pdf"]) {
            assert.equal((await get(path, docente)).status, 404, path);
        }
        const ownReport = await get("/student/1", alumno);
        assert.equal(ownReport.status, 200);
        assert.equal((await ownReport.json()).resumen.cursosInscritos, 2);
        for (const path of ["/student/1/pdf", "/course/1/pdf", "/student/2/pdf", "/course/2/pdf"]) {
            const response = await get(path, docente);
            assert.equal(response.status, 200, path);
            assert.match(response.headers.get("content-type"), /^application\/pdf/);
            assert.match(response.headers.get("content-disposition"), /attachment/);
            const bytes = Buffer.from(await response.arrayBuffer());
            assert.equal(bytes.subarray(0, 5).toString(), "%PDF-");
            assert.match(bytes.subarray(-30).toString(), /%%EOF/);
            const texto = textoPdf(bytes);
            if (path === "/student/1/pdf") {
                assert.match(texto, /Ana/);
                assert.match(texto, /Scratch: 50%/);
                assert.match(texto, /Lecciones: 2\/4/);
            } else if (path === "/course/1/pdf") {
                assert.match(texto, /Scratch/);
                assert.match(texto, /Ana: 0% \(Sin avance\)/);
                assert.match(texto, /Luis: 100% \(Completado\)/);
            } else if (path === "/student/2/pdf") {
                assert.match(texto, /Sin cursos inscritos/);
            } else {
                assert.match(texto, /No hay estudiantes inscritos/);
            }
        }
    } finally {
        await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    }
});
