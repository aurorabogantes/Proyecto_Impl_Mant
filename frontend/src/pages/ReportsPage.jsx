import { useState, useEffect } from 'react';
import {
    fetchStudents,
    fetchCourses,
    fetchStudentReport,
    fetchCourseReport,
    downloadStudentReportPdf,
    downloadCourseReportPdf
} from '../services/api';
import Icon from '../components/Icon';

export default function ReportsPage() {
    const [tab, setTab]                 = useState('estudiante');
    const [estudiantes, setEstudiantes] = useState([]);
    const [cursos, setCursos]           = useState([]);
    const [estudianteId, setEstudianteId] = useState('');
    const [cursoId, setCursoId]         = useState('');
    const [reporte, setReporte]         = useState(null);
    const [cargando, setCargando]       = useState(false);
    const [descargando, setDescargando] = useState(false);
    const [error, setError]             = useState('');

    useEffect(() => {
        Promise.all([fetchStudents(), fetchCourses()])
            .then(([estudiantesData, cursosData]) => {
                if (estudiantesData.error) throw new Error(estudiantesData.error);
                if (cursosData.error) throw new Error(cursosData.error);
                if (!Array.isArray(estudiantesData.estudiantes) || !Array.isArray(cursosData)) {
                    throw new Error('No se pudieron cargar los estudiantes y cursos.');
                }
                setEstudiantes(estudiantesData.estudiantes);
                setCursos(cursosData);
            })
            .catch(err => setError(`No se pudieron cargar los filtros: ${err.message}`));
    }, []);

    const cambiarTab = (nuevaTab) => {
        setTab(nuevaTab);
        setReporte(null);
        setError('');
    };

    const verReporteEstudiante = async () => {
        if (!estudianteId) return;
        setCargando(true); setError(''); setReporte(null);
        try {
            const data = await fetchStudentReport(estudianteId);
            if (data.error) throw new Error(data.error);
            setReporte(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setCargando(false);
        }
    };

    const verReporteCurso = async () => {
        if (!cursoId) return;
        setCargando(true); setError(''); setReporte(null);
        try {
            const data = await fetchCourseReport(cursoId);
            if (data.error) throw new Error(data.error);
            setReporte(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setCargando(false);
        }
    };

    const descargarPdf = async () => {
        setDescargando(true); setError('');
        try {
            await downloadStudentReportPdf(estudianteId);
        } catch (err) {
            setError(err.message);
        } finally {
            setDescargando(false);
        }
    };

    const descargarPdfCurso = async () => {
        setDescargando(true); setError('');
        try {
            await downloadCourseReportPdf(cursoId);
        } catch (err) {
            setError(err.message);
        } finally {
            setDescargando(false);
        }
    };

    return (
        <>
            <div className="hero-banner">
                <div className="container text-center">
                    <h1 className="display-5 fw-black mb-2"><Icon name="trophy" /> Reportes de desempeño</h1>
                    <p className="lead mb-0 opacity-90">
                        Revisa el progreso de estudiantes y cursos con métricas claras y visuales
                    </p>
                </div>
            </div>

            <div className="container pb-5">
                <div className="d-flex gap-2 flex-wrap mb-4">
                    <button
                        className={`btn rounded-pill fw-semibold px-4 ${tab === 'estudiante' ? 'btn-primary-custom' : 'btn-outline-secondary'}`}
                        onClick={() => cambiarTab('estudiante')}
                        disabled={cargando}
                    >
                        <Icon name="people" /> Por estudiante
                    </button>
                    <button
                        className={`btn rounded-pill fw-semibold px-4 ${tab === 'curso' ? 'btn-primary-custom' : 'btn-outline-secondary'}`}
                        onClick={() => cambiarTab('curso')}
                        disabled={cargando}
                    >
                        <Icon name="book" /> Por curso
                    </button>
                </div>

                {tab === 'estudiante' && (
                    <div className="filter-bar d-flex gap-3 mb-4 flex-wrap align-items-end">
                        <div className="flex-grow-1" style={{ minWidth: 220 }}>
                            <label className="form-label fw-semibold text-dark">Estudiante</label>
                            <select
                                className="form-select rounded-pill"
                                value={estudianteId}
                                onChange={e => { setEstudianteId(e.target.value); setReporte(null); }}
                                disabled={cargando}
                            >
                                <option value="">Selecciona un estudiante</option>
                                {estudiantes.map(e => (
                                    <option key={e.EstudianteId} value={e.EstudianteId}>{e.Nombre}</option>
                                ))}
                            </select>
                        </div>
                        <button className="btn btn-primary-custom rounded-pill px-4" onClick={verReporteEstudiante} disabled={!estudianteId || cargando}>
                            {cargando ? 'Cargando...' : 'Ver reporte'}
                        </button>
                        {reporte && (
                            <button className="btn btn-outline-secondary rounded-pill px-4" onClick={descargarPdf} disabled={descargando}>
                                {descargando ? 'Generando PDF...' : 'Descargar PDF'}
                            </button>
                        )}
                    </div>
                )}

                {tab === 'curso' && (
                    <div className="filter-bar d-flex gap-3 mb-4 flex-wrap align-items-end">
                        <div className="flex-grow-1" style={{ minWidth: 220 }}>
                            <label className="form-label fw-semibold text-dark">Curso</label>
                            <select
                                className="form-select rounded-pill"
                                value={cursoId}
                                onChange={e => { setCursoId(e.target.value); setReporte(null); }}
                                disabled={cargando}
                            >
                                <option value="">Selecciona un curso</option>
                                {cursos.map(c => (
                                    <option key={c.id} value={c.id}>{c.title}</option>
                                ))}
                            </select>
                        </div>
                        <button className="btn btn-primary-custom rounded-pill px-4" onClick={verReporteCurso} disabled={!cursoId || cargando}>
                            {cargando ? 'Cargando...' : 'Ver reporte'}
                        </button>
                        {reporte && (
                            <button className="btn btn-outline-secondary rounded-pill px-4" onClick={descargarPdfCurso} disabled={descargando}>
                                {descargando ? 'Generando PDF...' : 'Descargar PDF'}
                            </button>
                        )}
                    </div>
                )}

                {error && <div className="alert alert-danger border-0 rounded-4 shadow-sm">{error}</div>}
                {cargando && (
                    <div className="spinner-overlay">
                        <div className="spinner-border text-danger" role="status" />
                    </div>
                )}

                {reporte && tab === 'estudiante' && (
                    <div className="report-card card border-0 p-4 shadow-sm">
                        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                            <div>
                                <h3 className="fw-black mb-1">{reporte.nombre || 'Estudiante'}</h3>
                                <p className="text-muted mb-0">
                                    Generado el {new Date(reporte.generadoEl).toLocaleDateString('es-CR')}
                                </p>
                            </div>
                            <span className="badge rounded-pill text-bg-light px-3 py-2 fw-semibold" style={{ color: '#FF6B6B' }}>
                                <Icon name="trophy" /> Rendimiento
                            </span>
                        </div>

                        <div className="row g-3 mb-4">
                            <div className="col-md-3 col-6">
                                <div className="summary-stat">
                                    <strong>{reporte.resumen.cursosInscritos}</strong>
                                    <span>Cursos inscritos</span>
                                </div>
                            </div>
                            <div className="col-md-3 col-6">
                                <div className="summary-stat accent">
                                    <strong>{reporte.resumen.cursosCompletados}</strong>
                                    <span>Completados</span>
                                </div>
                            </div>
                            <div className="col-md-3 col-6">
                                <div className="summary-stat info">
                                    <strong>{reporte.resumen.promedioAvance}%</strong>
                                    <span>Avance promedio</span>
                                </div>
                            </div>
                            <div className="col-md-3 col-6">
                                <div className="summary-stat success">
                                    <strong>{reporte.resumen.minutosUso}</strong>
                                    <span>Minutos de uso</span>
                                </div>
                            </div>
                        </div>

                        <div className="mb-4">
                            <h5 className="section-title small mb-3">Cursos</h5>
                            {reporte.cursos.length === 0 && <p className="text-muted">Sin cursos inscritos.</p>}
                            <ul className="report-list list-group">
                                {reporte.cursos.map((c, i) => (
                                    <li key={i} className="list-group-item d-flex justify-content-between align-items-center">
                                        <span>{c.tituloCurso} <small className="text-muted">({c.leccionesCompletadas}/{c.totalLecciones} lecciones)</small></span>
                                        <span className="badge rounded-pill text-white" style={{ background: 'linear-gradient(135deg, #FF6B6B, #4ECDC4)' }}>{c.porcentaje}%</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div>
                            <h5 className="section-title small mb-3">Actividad reciente</h5>
                            {reporte.actividadesRecientes.length === 0 && <p className="text-muted">Sin actividad registrada.</p>}
                            <ul className="report-list list-group">
                                {reporte.actividadesRecientes.map((a, i) => (
                                    <li key={i} className="list-group-item">
                                        {a.FechaCompletado && (
                                            <span className="text-muted me-2">
                                                [{new Date(a.FechaCompletado).toLocaleDateString('es-CR')}]
                                            </span>
                                        )}
                                        {a.Curso} · {a.Leccion} ({a.Puntuacion ?? '-'} pts)
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}

                {reporte && tab === 'curso' && (
                    <div className="report-card card border-0 p-4 shadow-sm">
                        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                            <div>
                                <h3 className="fw-black mb-1">{reporte.tituloCurso || 'Curso'}</h3>
                                <p className="text-muted mb-0">
                                    Generado el {new Date(reporte.generadoEl).toLocaleDateString('es-CR')}
                                </p>
                            </div>
                            <span className="badge rounded-pill text-bg-light px-3 py-2 fw-semibold" style={{ color: '#4ECDC4' }}>
                                <Icon name="book" /> Curso
                            </span>
                        </div>

                        <div className="row g-3 mb-4">
                            <div className="col-md-3 col-6">
                                <div className="summary-stat">
                                    <strong>{reporte.resumen.totalEstudiantes}</strong>
                                    <span>Estudiantes</span>
                                </div>
                            </div>
                            <div className="col-md-3 col-6">
                                <div className="summary-stat accent">
                                    <strong>{reporte.resumen.completados}</strong>
                                    <span>Completados</span>
                                </div>
                            </div>
                            <div className="col-md-3 col-6">
                                <div className="summary-stat warning">
                                    <strong>{reporte.resumen.sinAvance}</strong>
                                    <span>Sin avance</span>
                                </div>
                            </div>
                            <div className="col-md-3 col-6">
                                <div className="summary-stat info">
                                    <strong>{reporte.resumen.promedioAvance}%</strong>
                                    <span>Avance promedio</span>
                                </div>
                            </div>
                        </div>

                        {reporte.estudiantes.length === 0 ? (
                            <p className="text-muted">No hay estudiantes inscritos en este curso.</p>
                        ) : (
                            <div className="table-responsive">
                                <table className="table report-table align-middle mb-0">
                                    <thead>
                                        <tr>
                                            <th>Estudiante</th>
                                            <th>Avance</th>
                                            <th>Lecciones</th>
                                            <th>Estado</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reporte.estudiantes.map((e, i) => (
                                            <tr key={i}>
                                                <td className="fw-semibold">{e.nombre}</td>
                                                <td>
                                                    <div className="d-flex align-items-center gap-2">
                                                        <span className="small text-muted">{e.porcentaje}%</span>
                                                        <div className="progress flex-grow-1" style={{ height: 10, borderRadius: 99 }}>
                                                            <div
                                                                className="progress-bar"
                                                                style={{
                                                                    width: `${e.porcentaje}%`,
                                                                    borderRadius: 99,
                                                                    background: e.completado ? '#28a745' : 'linear-gradient(90deg,#FF6B6B,#FFD93D)'
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>{e.leccionesCompletadas}/{e.totalLecciones}</td>
                                                <td>
                                                    <span className={`badge rounded-pill px-3 py-2 ${e.completado ? 'bg-success' : 'bg-warning text-dark'}`}>
                                                        {e.completado ? 'Completado' : Number(e.porcentaje) > 0 ? 'En progreso' : 'Sin avance'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </>
    );
}
