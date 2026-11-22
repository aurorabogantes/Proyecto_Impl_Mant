const { sql, config } = require("../database/connection");

async function obtenerEstudiante(estudianteId) {
    const pool = await sql.connect(config);
    const resultado = await pool.request()
        .input("estudianteId", sql.Int, estudianteId)
        .query("SELECT EstudianteId, Nombre FROM Estudiantes WHERE EstudianteId = @estudianteId");
    return resultado.recordset[0] || null;
}

async function obtenerCurso(cursoId) {
    const pool = await sql.connect(config);
    const resultado = await pool.request()
        .input("cursoId", sql.Int, cursoId)
        .query("SELECT CursoId, Titulo FROM Cursos WHERE CursoId = @cursoId");
    return resultado.recordset[0] || null;
}

module.exports = { obtenerEstudiante, obtenerCurso };
