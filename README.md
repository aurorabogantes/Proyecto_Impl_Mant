# KodKids — Portal de Cursos Interactivos de Programación Infantil

Plataforma educativa para niños con cursos de programación, sistema de gamificación (puntos, insignias, niveles, desafíos) y biblioteca multimedia.

---

## Tecnologías

| Capa       | Tecnología                              |
|------------|-----------------------------------------|
| Frontend   | React 18, Vite, Bootstrap 5, React Router 6 |
| Backend    | Node.js, Express 4                      |
| Base de datos | SQL Server (mssql / msnodesqlv8)     |
| API externa | Open Trivia Database (opentdb.com)    |
| Reportes   | PDFKit                                  |

---

## Estructura del proyecto

```
Proyecto_Arquitectura/
├── backend/
│   ├── app.js                         # Punto de entrada, registro de rutas
│   ├── package.json
│   └── src/
│       ├── database/
│       │   ├── connection.js          # Configuración de conexión a SQL Server
│       │   └── schema.sql             # Script completo de creación de BD e inserts
│       ├── models/
│       │   ├── Badge.js
│       │   ├── Challenge.js
│       │   ├── Course.js
│       │   ├── StudentProgress.js
│       │   └── User.js
│       ├── repositories/
│       │   ├── CourseRepository.js
│       │   ├── GamificationRepository.js
│       │   ├── MediaRepository.js
│       │   └── ProgressRepository.js
│       ├── services/
│       │   ├── courseService.js
│       │   ├── gamificationService.js
│       │   ├── mediaService.js
│       │   ├── progressService.js
│       │   └── reportService.js
│       ├── controllers/
│       │   ├── courseController.js
│       │   ├── gamificationController.js
│       │   ├── mediaController.js
│       │   ├── progressController.js
│       │   ├── reportController.js
│       │   └── userController.js
│       └── routes/
│           ├── courseRoutes.js
│           ├── gamificationRoutes.js
│           ├── mediaRoutes.js
│           ├── progressRoutes.js
│           ├── reportRoutes.js
│           └── userRoutes.js
└── frontend/
    ├── index.html
    ├── vite.config.js
    ├── package.json
    └── src/
        ├── App.jsx
        ├── main.jsx
        ├── index.css
        ├── components/
        │   ├── Navbar.jsx
        │   └── Footer.jsx
        ├── context/
        │   └── UserContext.jsx
        ├── pages/
        │   ├── CoursesPage.jsx
        │   ├── CourseDetailPage.jsx
        │   ├── GamificationPage.jsx
        │   └── MediaLibraryPage.jsx
        └── services/
            └── api.js
```

---

## Configuración de la base de datos

### 1. Abrir `backend/src/database/connection.js` y ajustar las credenciales

```js
const config = {
    user: "sa",
    password: "Admin1234!",
    server: "AURORAPC\\SQL2022",   // nombre de tu instancia de SQL Server
    database: "InnovacionEducativa",
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};
```

### 2. Ejecutar el script de base de datos

Abrir **SQL Server Management Studio**, conectarse a la instancia y ejecutar:

```
backend/src/database/schema.sql
```

El script crea la base de datos `InnovacionEducativa` con todas las tablas, índices y datos iniciales (cursos, lecciones, recursos multimedia, niveles, insignias y desafíos).

Este script está pensado para crear una base de datos nueva; no debe ejecutarse
completo sobre una base de datos existente, pues incluye `CREATE DATABASE` y
`CREATE TABLE`. Para comprobar el estado de una instalación existente, utiliza
las consultas de la sección siguiente.

---

## Tablas de la base de datos

El esquema define **13 tablas**, por lo que supera el mínimo de 10. Las
relaciones entre ellas se implementan con claves primarias y foráneas:

| Tabla               | Descripción                                           |
|---------------------|-------------------------------------------------------|
| `Cursos`            | Catálogo de cursos de programación                    |
| `Lecciones`         | Lecciones de cada curso                               |
| `MediaItems`        | Videos e imágenes asociados a cada curso              |
| `Estudiantes`       | Estudiantes registrados (incluye puntos y racha)      |
| `EstudianteCurso`   | Inscripciones y porcentaje de avance por curso        |
| `ProgresoLeccion`   | Avance individual por lección (puntuación + fecha)    |
| `SesionUso`         | Registro diario de minutos de uso por estudiante      |
| `Insignias`         | Catálogo de insignias/badges disponibles              |
| `EstudianteInsignia`| Insignias obtenidas por cada estudiante               |
| `Desafios`          | Catálogo de desafíos/retos de gamificación            |
| `ProgresoDesafio`   | Progreso de cada estudiante en los desafíos           |
| `Niveles`           | Niveles de gamificación con rangos de puntos          |
| `Usuarios`          | Usuarios del sistema para autenticación y control de roles (estudiante, docente y administrador) |

### Relaciones

| Tabla dependiente | Clave foránea | Tabla referenciada | Relación |
|-------------------|---------------|--------------------|----------|
| `Lecciones` | `CursoId` | `Cursos(CursoId)` | Un curso tiene muchas lecciones. |
| `MediaItems` | `CursoId` | `Cursos(CursoId)` | Un curso tiene muchos recursos multimedia. |
| `EstudianteCurso` | `EstudianteId` | `Estudiantes(EstudianteId)` | Relaciona estudiantes con cursos. |
| `EstudianteCurso` | `CursoId` | `Cursos(CursoId)` | Relaciona cursos con estudiantes. |
| `EstudianteInsignia` | `EstudianteId` | `Estudiantes(EstudianteId)` | Relaciona estudiantes con insignias. |
| `EstudianteInsignia` | `InsigniaId` | `Insignias(InsigniaId)` | Relaciona insignias con estudiantes. |
| `ProgresoDesafio` | `EstudianteId` | `Estudiantes(EstudianteId)` | Relaciona estudiantes con desafíos. |
| `ProgresoDesafio` | `DesafioId` | `Desafios(DesafioId)` | Relaciona desafíos con estudiantes. |
| `ProgresoLeccion` | `EstudianteId` | `Estudiantes(EstudianteId)` | Relaciona estudiantes con lecciones. |
| `ProgresoLeccion` | `LeccionId` | `Lecciones(LeccionId)` | Relaciona lecciones con estudiantes. |
| `SesionUso` | `EstudianteId` | `Estudiantes(EstudianteId)` | Un estudiante puede tener varias sesiones de uso. |
| `Usuarios` | `EstudianteId` | `Estudiantes(EstudianteId)` | Una cuenta de estudiante puede vincularse con un estudiante; docentes y administradores pueden dejarlo vacío. |

`EstudianteCurso`, `EstudianteInsignia`, `ProgresoDesafio` y `ProgresoLeccion`
son tablas intermedias que permiten relacionar varios registros de ambos lados.
`ProgresoLeccion` también impide registrar dos veces la misma combinación de
estudiante y lección.

`Niveles` es un catálogo independiente: el nivel de un estudiante se calcula
comparando sus puntos con `MinPuntos` y `MaxPuntos`. No existe una clave
foránea directa hacia esa tabla, por lo que no se almacena un nivel que pueda
quedar desactualizado al cambiar los puntos.

### Comprobar una base de datos existente

En SQL Server Management Studio, selecciona `InnovacionEducativa` y ejecuta:

```sql
-- Número de tablas de usuario y sus nombres.
SELECT COUNT(*) AS TotalTablas FROM sys.tables;
SELECT SCHEMA_NAME(schema_id) AS Esquema, name AS Tabla
FROM sys.tables
ORDER BY Esquema, Tabla;

-- Claves foráneas y su estado.
SELECT
    OBJECT_SCHEMA_NAME(parent_object_id) AS EsquemaOrigen,
    OBJECT_NAME(parent_object_id) AS TablaOrigen,
    name AS ClaveForanea,
    OBJECT_SCHEMA_NAME(referenced_object_id) AS EsquemaDestino,
    OBJECT_NAME(referenced_object_id) AS TablaDestino,
    is_disabled AS Deshabilitada,
    is_not_trusted AS NoValidada
FROM sys.foreign_keys
ORDER BY EsquemaOrigen, TablaOrigen, ClaveForanea;
```

Una clave foránea habilitada y validada muestra `0` en ambas columnas de estado.
Los nombres y las tablas de una instalación existente pueden diferir del
esquema: por ejemplo, la base de datos revisada contiene `RecursosMultimedia`
en lugar de `MediaItems`. El backend consulta `MediaItems`, por lo que esa
diferencia debe resolverse antes de utilizar las funciones multimedia de esa
instalación; no se modifica automáticamente al actualizar esta documentación.

---

## Instalación y ejecución

### Backend

```bash
cd backend
npm install
npm run dev        # nodemon (desarrollo)
# o
npm start          # node (producción)
```

El servidor queda en `http://localhost:3000`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

La app queda en `http://localhost:5173`. El proxy de Vite redirige `/api/*` al backend automáticamente.

---

## API — Endpoints principales

### Cursos
| Método | Ruta                          | Descripción                        |
|--------|-------------------------------|------------------------------------|
| GET    | `/api/courses`                | Lista todos los cursos             |
| GET    | `/api/courses/:id`            | Detalle de un curso (con lecciones y multimedia) |
| POST   | `/api/courses/:id/enroll`     | Inscribir un estudiante            |

### Gamificación
| Método | Ruta                          | Descripción                        |
|--------|-------------------------------|------------------------------------|
| GET    | `/api/gamification/dashboard` | Panel completo del estudiante (`?estudianteId=1`) |
| GET    | `/api/gamification/trivia`    | 5 preguntas desde Open Trivia DB   |
| POST   | `/api/gamification/progress`  | Actualizar progreso de un desafío  |
| POST   | `/api/gamification/points`    | Sumar puntos a un estudiante       |

### Progreso
| Método | Ruta                                              | Descripción               |
|--------|---------------------------------------------------|---------------------------|
| GET    | `/api/progress/student/:estudianteId`             | Progreso por estudiante   |
| GET    | `/api/progress/course/:cursoId`                   | Progreso por curso        |
| POST   | `/api/progress/complete-lesson`                   | Marcar lección completada |
| POST   | `/api/progress/time`                              | Registrar tiempo de uso   |

### Multimedia
| Método | Ruta                  | Descripción                           |
|--------|-----------------------|---------------------------------------|
| GET    | `/api/media/library`  | Todos los recursos (`?type=video|image`) |

### Reportes
| Método | Ruta                                   | Descripción                          |
|--------|----------------------------------------|--------------------------------------|
| GET    | `/api/reports/student/:estudianteId`   | Reporte individual (JSON)            |
| GET    | `/api/reports/course/:cursoId`         | Reporte grupal por curso (JSON)      |
| GET    | `/api/reports/student/:id/pdf`         | Reporte individual (PDF descargable) |

### Autenticación

| Método | Ruta              | Descripción       |
|--------|-------------------|-------------------|
| POST | /api/auth/register  | Registrar usuario |
| POST | /api/auth/login     | Iniciar sesión    |

---

## Módulos del portal

### Portal de cursos
- Listado con búsqueda y filtros por nivel y categoría
- Tarjetas con thumbnail, descripción, nivel, rango de edad, duración y puntos
- Vista de detalle con lecciones y reproductor multimedia integrado
- Botón de inscripción conectado a la BD

### Módulo de gamificación
- Panel con nivel actual, barra de progreso XP y racha de días
- Galería de insignias (obtenidas vs. bloqueadas)
- Retos diarios/semanales con barras de progreso
- **Trivia en tiempo real** con preguntas de tecnología obtenidas desde [Open Trivia Database](https://opentdb.com) (sin API key)

### Biblioteca multimedia
- Filtro por tipo: videos, imágenes o todo
- Videos de YouTube embebidos
- Lightbox para imágenes

---

## Autenticación

El sistema incorpora un módulo de autenticación para administrar el acceso de los usuarios a la plataforma.

### Características

- Registro e inicio de sesión de usuarios.
- Gestión de roles:
  - Estudiante
  - Docente
  - Administrador
- Asociación entre la tabla `Usuarios` y `Estudiantes` para los usuarios con rol de estudiante.
- Almacenamiento seguro de contraseñas mediante hash.
## Autores

- **Kevin González** — Diseño de BD, módulo de cursos y recursos multimedia
- **José Esquivel** — Seguimiento de progreso, reportes para docentes/padres, integración de gamificación y multimedia con la BD
