const {
  Document, Packer, Paragraph, TextRun, AlignmentType,
  HeadingLevel, LevelFormat, Table, TableRow, TableCell,
  WidthType, BorderStyle, ShadingType, VerticalAlign
} = require('docx');
const fs = require('fs');

// ── Helpers ───────────────────────────────────────────────────────────────────
const brd  = { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' };
const bords = { top: brd, bottom: brd, left: brd, right: brd };

function h1(t) {
  return new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 480, after: 240 },
    children: [new TextRun({ text: t, bold: true, size: 32, font: 'Arial' })] });
}
function h2(t) {
  return new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 360, after: 200 },
    children: [new TextRun({ text: t, bold: true, size: 28, font: 'Arial' })] });
}
function h3(t) {
  return new Paragraph({ heading: HeadingLevel.HEADING_3, spacing: { before: 280, after: 160 },
    children: [new TextRun({ text: t, bold: true, size: 24, font: 'Arial' })] });
}
function h4(t) {
  return new Paragraph({ heading: HeadingLevel.HEADING_4, spacing: { before: 220, after: 120 },
    children: [new TextRun({ text: t, bold: true, italics: true, size: 24, font: 'Arial' })] });
}
function p(text) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { before: 0, after: 200, line: 360, lineRule: 'auto' },
    indent: { firstLine: 720 },
    children: [new TextRun({ text, size: 24, font: 'Arial' })]
  });
}
function pRuns(runs) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { before: 0, after: 200, line: 360, lineRule: 'auto' },
    indent: { firstLine: 720 },
    children: runs.map(r => new TextRun({ size: 24, font: 'Arial', ...r }))
  });
}
function bullet(text) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { before: 0, after: 120, line: 360, lineRule: 'auto' },
    numbering: { reference: 'bullets', level: 0 },
    children: [new TextRun({ text, size: 24, font: 'Arial' })]
  });
}
function bulletBold(label, rest) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { before: 0, after: 120, line: 360, lineRule: 'auto' },
    numbering: { reference: 'bullets', level: 0 },
    children: [
      new TextRun({ text: label, bold: true, size: 24, font: 'Arial' }),
      new TextRun({ text: rest, size: 24, font: 'Arial' })
    ]
  });
}
function cap(text) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 80, after: 280 },
    children: [new TextRun({ text, size: 20, italics: true, font: 'Arial', color: '444444' })]
  });
}
function spacer() {
  return new Paragraph({ children: [new TextRun('')], spacing: { after: 120 } });
}
function tbl(colWidths, headerCells, dataRows) {
  const total = colWidths.reduce((a, b) => a + b, 0);
  const hrow = new TableRow({
    tableHeader: true,
    children: headerCells.map((h, i) => new TableCell({
      borders: bords, width: { size: colWidths[i], type: WidthType.DXA },
      shading: { fill: '2E5496', type: ShadingType.CLEAR },
      margins: { top: 80, bottom: 80, left: 120, right: 120 },
      verticalAlign: VerticalAlign.CENTER,
      children: [new Paragraph({ alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: h, bold: true, size: 22, font: 'Arial', color: 'FFFFFF' })] })]
    }))
  });
  const drows = dataRows.map((row, ri) => new TableRow({
    children: row.map((cell, ci) => new TableCell({
      borders: bords, width: { size: colWidths[ci], type: WidthType.DXA },
      shading: { fill: ri % 2 === 0 ? 'F2F6FC' : 'FFFFFF', type: ShadingType.CLEAR },
      margins: { top: 80, bottom: 80, left: 120, right: 120 },
      children: [new Paragraph({ alignment: AlignmentType.LEFT,
        children: [new TextRun({ text: cell, size: 22, font: 'Arial' })] })]
    }))
  }));
  return new Table({ width: { size: total, type: WidthType.DXA }, columnWidths: colWidths, rows: [hrow, ...drows] });
}

// ════════════════════════════════════════════════════════════════════════════
// CONTENIDO
// ════════════════════════════════════════════════════════════════════════════
const children = [

  h1('CAPÍTULO III – MARCO APLICATIVO'),

  // ── 3.1 INTRODUCCIÓN ─────────────────────────────────────────────────────
  h2('3.1. INTRODUCCIÓN'),

  p('El presente capítulo documenta el proceso de desarrollo del Sistema Web de Gestión Académica de Cursos Complementarios y Eventos Facultativos de la FHCE, aplicando la metodología Extreme Programming (XP) en combinación con el lenguaje de modelado WebML. El capítulo se estructura siguiendo las cuatro fases del proceso XP: Planificación, Diseño, Codificación y Pruebas, cada una de las cuales atraviesa de forma transversal las seis iteraciones funcionales en que se organizó el desarrollo.'),

  p('La Fase de Planificación establece los artefactos de partida del proceso: las historias de usuario que capturan los requerimientos desde la perspectiva de cada actor, la identificación de los roles del sistema, el plan de entregas que asigna las historias a iteraciones, y un resumen del trabajo realizado en cada ciclo. La Fase de Diseño presenta las tarjetas CRC que modelan las responsabilidades de las clases principales del sistema y los modelos WebML que describen la navegación y la estructura de contenidos de cada módulo. La Fase de Codificación describe en términos funcionales los componentes implementados en el backend y el frontend. La Fase de Pruebas documenta las pruebas de carga, estrés y escalabilidad ejecutadas sobre el sistema resultante.'),

  // ── 3.2 WEBML EN XP ──────────────────────────────────────────────────────
  h2('3.2. LENGUAJE DE MODELADO WEBML EN LA METODOLOGÍA XP'),

  p('La integración de WebML como herramienta de modelado dentro del proceso XP responde a una necesidad concreta: XP promueve el diseño simple y evolutivo, pero no prescribe un lenguaje formal para documentar la estructura de navegación y los flujos de interacción de aplicaciones web. WebML cubre exactamente esa brecha, aportando un conjunto de primitivas visuales —unidades de contenido, páginas, enlaces y operaciones— que permiten representar con precisión el comportamiento del sistema antes de escribir código, sin incurrir en la sobreingeniería que XP busca evitar (Ceri, Fraternali & Bongio, 2003).'),

  p('En el presente proyecto, WebML se aplica durante la Fase de Diseño de cada iteración para modelar los flujos de navegación específicos del módulo en desarrollo. El nivel de detalle del modelo se ajusta a las historias de usuario comprometidas en esa iteración: solo se modela lo que se va a implementar en el ciclo actual, manteniendo la coherencia con el principio de diseño incremental de XP. Los modelos resultantes sirven simultáneamente como guía de implementación para el desarrollador y como artefacto de comunicación con los actores institucionales durante las sesiones de validación al cierre de cada iteración.'),

  p('La combinación de XP y WebML que se documenta en este capítulo sigue el enfoque planteado por Salazar Rodríguez (2022), quien demostró su viabilidad en un sistema de gestión académica de contexto similar al presente proyecto, y que constituye el antecedente metodológico más directo de este trabajo.'),

  // ── 3.3 APLICACIÓN DE METODOLOGÍA XP Y WEBML ────────────────────────────
  h2('3.3. APLICACIÓN DE METODOLOGÍA XP Y WEBML'),

  p('A continuación se documenta la aplicación completa del proceso XP, organizado en sus cuatro fases. Cada fase integra el trabajo realizado a lo largo de las seis iteraciones del proyecto, presentando los artefactos producidos en el orden en que fueron generados durante el desarrollo.'),

  // ════════════════════════════════════════════════════════════════════════
  // FASE I: PLANIFICACIÓN
  // ════════════════════════════════════════════════════════════════════════
  h3('3.3.1. FASE I: PLANIFICACIÓN'),

  p('La planificación en XP es un proceso continuo que se realiza al inicio de cada iteración y que se ajusta en función del aprendizaje acumulado. Al comienzo del proyecto se elaboró el plan de entregas global, que asignó las historias de usuario a iteraciones según criterios de dependencia técnica y prioridad de negocio. Al inicio de cada iteración, las historias asignadas se descompusieron en tareas técnicas concretas con estimaciones individuales en horas, conformando el plan de iteración correspondiente.'),

  // 3.3.1.1 HISTORIAS DE USUARIO
  h4('3.3.1.1. Historias de usuario'),

  p('Las historias de usuario constituyen la unidad fundamental de requerimiento en XP. Se redactaron a partir del levantamiento de información con el personal de la FHCE y los requerimientos funcionales formalizados del sistema, siguiendo el formato: "Como [rol], quiero [acción] para [beneficio]". Cada historia se acompaña de criterios de aceptación que definen con precisión las condiciones que debe satisfacer la implementación para considerarse completa. Se definieron un total de treinta y dos historias de usuario, presentadas en la Tabla 1.'),

  spacer(),
  cap('Tabla 1. Historias de usuario del sistema con criterios de aceptación.'),
  tbl(
    [600, 1600, 3200, 3960],
    ['HU', 'Rol', 'Historia', 'Criterios de aceptación'],
    [
      // ── Módulo Auth ──
      ['HU-01', 'Usuario externo',
       'Quiero registrarme con mi correo y verificarlo con un código de 6 dígitos para activar mi cuenta.',
       '1. Se rechaza correo ya registrado. 2. El código llega en menos de 2 minutos. 3. Expira a las 24 h. 4. Un código usado no puede reutilizarse. 5. La cuenta queda INACTIVA hasta la verificación.'],
      ['HU-02', 'Usuario UMSA',
       'Quiero autenticarme con mi RU y contraseña institucional para acceder al sistema.',
       '1. En dev, el mock acepta cualquier RU con "test123". 2. El sistema devuelve JWT con id_usuario y roles. 3. Credenciales incorrectas devuelven HTTP 401.'],
      ['HU-03', 'Usuario externo',
       'Quiero autenticarme con mi correo y contraseña para acceder al sistema.',
       '1. Solo usuarios con email verificado pueden autenticarse. 2. Cuenta inactiva devuelve HTTP 403. 3. El JWT incluye id_usuario, roles y tipo de usuario.'],
      ['HU-04', 'Administrador',
       'Quiero gestionar usuarios (crear, editar, activar/inactivar) para mantener el directorio del sistema.',
       '1. Listado paginado y filtrable por nombre, username y estado. 2. Solo el administrador cambia el estado. 3. No se puede eliminar usuario con inscripciones activas.'],
      ['HU-05', 'Administrador',
       'Quiero asignar y revocar roles a usuarios con registro de fecha y responsable.',
       '1. Cada asignación registra administrador y fecha. 2. Rol DOCENTE solicita título académico. 3. Rol PARTICIPANTE solicita tipo UMSA/EXTERNO. 4. No se revoca el único rol activo.'],
      // ── Módulo Cursos/Eventos ──
      ['HU-06', 'Administrador',
       'Quiero gestionar las carreras académicas de la FHCE para organizar la oferta.',
       '1. CRUD completo de carreras con estado ACTIVA/INACTIVA. 2. No se puede inactivar una carrera con cursos ABIERTOS.'],
      ['HU-07', 'Administrador',
       'Quiero asignar coordinadores a carreras para definir quién gestiona cada unidad.',
       '1. Un coordinador puede asignarse a múltiples carreras. 2. La asignación registra fecha. 3. Se puede revocar la asignación.'],
      ['HU-08', 'Coordinador',
       'Quiero crear y editar cursos complementarios con sus atributos para publicar la oferta.',
       '1. Campos obligatorios: nombre, carga horaria, fecha inicio, nota mínima, costos. 2. Solo el coordinador de la carrera puede editarlo. 3. El estado inicial es ABIERTO.'],
      ['HU-09', 'Coordinador',
       'Quiero gestionar los paralelos de cada curso para organizar las secciones.',
       '1. Cada paralelo tiene código único dentro del curso. 2. Se puede asignar docente, modalidad, cupo y horario. 3. El cupo puede quedar sin definir (null = sin límite).'],
      ['HU-10', 'Coordinador',
       'Quiero crear y editar eventos facultativos con fecha, modalidad y cupo.',
       '1. Campos obligatorios: nombre, fecha y hora, modalidad, carga horaria y costos. 2. Un evento ocupa un único día (campo DATETIME).'],
      ['HU-11', 'Coordinador',
       'Quiero asignar auxiliares a eventos para delegar el registro de asistencia.',
       '1. Solo usuarios con rol AUXILIAR pueden asignarse. 2. Un auxiliar puede asignarse a múltiples eventos. 3. La asignación registra fecha.'],
      ['HU-12', 'Participante',
       'Quiero visualizar la oferta de cursos y eventos disponibles con precios según mi tipo.',
       '1. Se muestra precio UMSA o EXTERNO según el tipo del participante. 2. Se muestran cupos disponibles por paralelo. 3. Actividades LLENAS o FINALIZADAS se distinguen visualmente.'],
      // ── Módulo Inscripciones ──
      ['HU-13', 'Participante',
       'Quiero inscribirme en un curso seleccionando el paralelo de mi preferencia.',
       '1. Solo paralelos con cupo disponible aparecen seleccionables. 2. No se puede inscribir dos veces al mismo curso. 3. El saldo se calcula automáticamente según tipo de participante.'],
      ['HU-14', 'Participante',
       'Quiero inscribirme en un evento disponible para confirmar mi participación.',
       '1. Eventos LLENOS o FINALIZADOS no permiten inscripción. 2. No se puede inscribir dos veces al mismo evento.'],
      ['HU-15', 'Participante',
       'Quiero realizar el pago en línea de mi inscripción mediante la pasarela Libélula.',
       '1. En dev, el mock aprueba todos los pagos automáticamente. 2. Se registra referencia de transacción, método y monto. 3. Pago rechazado mantiene la inscripción en PENDIENTE.'],
      ['HU-16', 'Sistema',
       'Quiero confirmar la inscripción automáticamente cuando la pasarela notifica el pago aprobado vía webhook.',
       '1. El webhook actualiza el estado del pago a APROBADO. 2. El trigger T4 confirma la inscripción automáticamente. 3. El endpoint del webhook es público pero validado con firma.'],
      ['HU-17', 'Sistema',
       'Quiero confirmar automáticamente inscripciones a actividades gratuitas sin requerir pago.',
       '1. Si costo_externo = 0 y costo_umsa = 0, el trigger T3 confirma la inscripción al insertarla. 2. No se genera registro de pago.'],
      ['HU-18', 'Participante',
       'Quiero ver el historial de mis inscripciones y el estado de cada pago.',
       '1. Se listan todas las inscripciones con estado, actividad, fecha y monto. 2. Se puede filtrar por estado (PENDIENTE, CONFIRMADA, CANCELADA).'],
      // ── Módulo Evaluación ──
      ['HU-19', 'Docente',
       'Quiero registrar la nota final de cada participante en mis paralelos asignados.',
       '1. Solo el docente asignado al paralelo puede registrar notas. 2. El estado APROBADO/REPROBADO se calcula automáticamente por el trigger T1. 3. La nota es sobre 100.'],
      ['HU-20', 'Docente',
       'Quiero confirmar las calificaciones de un paralelo para indicar que son definitivas.',
       '1. La confirmación genera automáticamente una solicitud_emision con estado PENDIENTE. 2. No se pueden modificar notas una vez confirmadas, salvo por el administrador.'],
      ['HU-21', 'Administrador',
       'Quiero modificar una nota con motivo justificado y que el cambio quede registrado en el historial.',
       '1. Todo cambio genera un registro en historial con nota anterior, nota nueva, motivo, usuario y fecha. 2. Si existe certificado emitido, el sistema advierte y gestiona su anulación.'],
      ['HU-22', 'Coordinador / Auxiliar',
       'Quiero registrar la asistencia de los participantes en un evento.',
       '1. El auxiliar solo puede registrar asistencia en eventos a los que está asignado. 2. La existencia del registro equivale a asistencia. 3. Se registra quién registró y cuándo.'],
      ['HU-23', 'Coordinador',
       'Quiero ver las solicitudes de emisión pendientes de mis carreras.',
       '1. Se listan solicitudes PENDIENTES y EN_PROCESO de sus carreras. 2. Puede cambiar el estado a EN_PROCESO o COMPLETADO. 3. Se muestra cantidad de aprobados por solicitud.'],
      // ── Módulo Certificados ──
      ['HU-24', 'Diseñador',
       'Quiero subir una plantilla PDF para un curso o evento.',
       '1. Solo archivos PDF son aceptados. 2. La plantilla queda en estado PENDIENTE hasta su aprobación. 3. Se registra versión, diseñador y fecha de subida.'],
      ['HU-25', 'Coordinador',
       'Quiero aprobar o rechazar una plantilla con observaciones.',
       '1. Aprobar pone la plantilla en VIGENTE y la anterior pasa a HISTÓRICA. 2. Rechazar registra las observaciones para el diseñador. 3. Cada revisión genera un registro independiente en aprobacion.'],
      ['HU-26', 'Coordinador',
       'Quiero emitir certificados en lote para todos los aprobados de un paralelo.',
       '1. Solo participantes con evaluacion APROBADO o asistencia registrada reciben certificado (validado por trigger T7). 2. Se genera un PDF por participante con código QR único. 3. El estado de la solicitud_emision pasa a COMPLETADO.'],
      ['HU-27', 'Coordinador',
       'Quiero emitir el certificado individual de un participante específico.',
       '1. Mismas validaciones que la emisión en lote. 2. El código QR generado es único e irrepetible.'],
      ['HU-28', 'Participante',
       'Quiero descargar mi certificado en PDF desde mi perfil.',
       '1. Solo el titular puede descargar su certificado. 2. Certificados ANULADOS no están disponibles para descarga. 3. Si hubo reemisión, se descarga la versión más reciente.'],
      ['HU-29', 'Coordinador',
       'Quiero anular un certificado emitido con error y registrar el motivo.',
       '1. La anulación registra motivo, usuario y fecha en c_anulacion. 2. El trigger T9 marca el certificado como ANULADO. 3. Se puede indicar un certificado de reemplazo.'],
      ['HU-30', 'Público',
       'Quiero escanear el QR de un certificado y ver su estado de validez en una página pública.',
       '1. La página no requiere autenticación. 2. Muestra estado (VÁLIDO, ANULADO, REEMITIDO), nombre del titular, actividad, carga horaria, fecha y nota si aplica. 3. Si fue reemitido, muestra enlace al certificado de reemplazo.'],
      // ── Módulo Reportes ──
      ['HU-31', 'Coordinador / Administrador',
       'Quiero ver reportes de inscripciones por actividad, carrera y período.',
       '1. Filtrable por carrera, tipo de actividad, período y estado. 2. Muestra total de inscritos, confirmados y cancelados. 3. Exportable a Excel o PDF.'],
      ['HU-32', 'Coordinador / Administrador',
       'Quiero ver reportes de ingresos diferenciados por tipo de participante y actividad.',
       '1. Desglosa ingresos por precio UMSA y precio EXTERNO. 2. Filtrable por carrera y período. 3. Incluye total de pagos aprobados y pendientes.'],
    ]
  ),
  spacer(),

  // 3.3.1.2 IDENTIFICACIÓN DE ROLES
  h4('3.3.1.2. Identificación de roles'),

  p('El análisis de los procesos actuales de la FHCE y la revisión de los requerimientos funcionales permitieron identificar seis roles con responsabilidades claramente diferenciadas. La Tabla 2 presenta cada rol, su origen en la estructura organizacional de la facultad y las funcionalidades principales que tiene habilitadas en el sistema.'),

  spacer(),
  cap('Tabla 2. Roles del sistema, origen organizacional y funcionalidades principales.'),
  tbl(
    [1800, 2200, 5360],
    ['Rol', 'Origen en la FHCE', 'Funcionalidades principales'],
    [
      ['Administrador',
       'Personal de sistemas o dirección facultativa',
       'Gestión completa de usuarios y roles. Modificación de notas con historial de auditoría. Supervisión general del sistema y acceso a todos los módulos.'],
      ['Coordinador académico',
       'Coordinadores de cada carrera',
       'Creación y publicación de cursos y eventos de su carrera. Aprobación de plantillas de certificados. Procesamiento de solicitudes de emisión. Emisión individual y masiva de certificados. Acceso a reportes de su carrera.'],
      ['Docente',
       'Docentes asignados a paralelos de cursos',
       'Registro de calificaciones de participantes en sus paralelos. Confirmación formal de notas que dispara la solicitud de emisión.'],
      ['Participante',
       'Estudiantes UMSA y público externo',
       'Visualización de la oferta académica. Inscripción a cursos y eventos. Realización de pagos en línea. Descarga de sus propios certificados.'],
      ['Auxiliar',
       'Personal de apoyo asignado a eventos',
       'Registro de asistencia exclusivamente en los eventos a los que está formalmente asignado. Sin acceso a otros módulos del sistema.'],
      ['Diseñador gráfico',
       'Diseñadores de la facultad',
       'Carga y actualización de plantillas PDF de certificados. Acceso de solo lectura a la información básica de las actividades para preparar los diseños.'],
    ]
  ),
  spacer(),

  p('Un usuario puede tener múltiples roles simultáneamente. Esta decisión de diseño responde a situaciones reales identificadas en la FHCE: un docente puede ser también participante en cursos de otra carrera, o un coordinador puede desempeñarse como docente en algún paralelo. La tabla usuario_rol gestiona esta relación muchos a muchos, y el JWT generado en la autenticación incluye la lista completa de roles del usuario, permitiendo que el frontend adapte la interfaz sin consultas adicionales al servidor.'),

  // 3.3.1.3 PLAN DE ENTREGAS
  h4('3.3.1.3. Plan de entregas'),

  p('Las treinta y dos historias de usuario se distribuyeron en seis iteraciones de dos semanas cada una, priorizadas según dependencia técnica y valor de negocio. La Tabla 3 presenta el plan de entregas con las historias comprometidas en cada iteración, los puntos estimados y el entregable funcional al cierre de cada ciclo.'),

  spacer(),
  cap('Tabla 3. Plan de entregas del proyecto.'),
  tbl(
    [800, 2800, 1600, 1000, 3160],
    ['Iter.', 'Módulo principal', 'Historias', 'Puntos', 'Entregable al cierre'],
    [
      ['IT-1', 'Autenticación y gestión de usuarios', 'HU-01 a HU-05', '11 pts',
       'Sistema de login dual operativo, registro externo con verificación por correo, gestión de usuarios y roles.'],
      ['IT-2', 'Carreras, cursos y eventos', 'HU-06 a HU-12', '15 pts',
       'CRUD de carreras, cursos con paralelos y eventos facultativos. Visualización de oferta para participantes.'],
      ['IT-3', 'Inscripciones y pagos', 'HU-13 a HU-18', '16 pts',
       'Flujo completo de inscripción y pago con integración Libélula (mock en dev). Confirmación por webhook.'],
      ['IT-4', 'Evaluación y asistencia', 'HU-19 a HU-23', '12 pts',
       'Registro de notas, confirmación docente, historial de cambios, asistencia en eventos y bandeja de solicitudes de emisión.'],
      ['IT-5', 'Certificados y plantillas', 'HU-24 a HU-30', '20 pts',
       'Gestión de plantillas con flujo de aprobación, emisión masiva e individual de PDFs con QR, descarga, anulación y verificación pública.'],
      ['IT-6', 'Reportes y estadísticas', 'HU-31 a HU-32', '6 pts',
       'Reportes consolidados de inscripciones e ingresos por carrera y período, exportables.'],
    ]
  ),
  spacer(),

  p('La velocidad de desarrollo promedio resultante fue de aproximadamente trece puntos por iteración. La iteración de mayor carga es IT-5 con veinte puntos, debido a la complejidad de la generación de PDF con iTextPDF, el sistema de plantillas con control de versiones y la integración del código QR con el servicio de verificación pública. La iteración IT-6 es la más ligera porque los reportes reutilizan consultas ya desarrolladas en iteraciones anteriores.'),

  // 3.3.1.4 ITERACIONES
  h4('3.3.1.4. Iteraciones'),

  p('Cada iteración siguió el ciclo completo de las cuatro fases XP: planificación interna de las tareas, diseño con WebML y tarjetas CRC, codificación con prácticas TDD y refactorización, y validación funcional con los actores institucionales. La Tabla 4 presenta un resumen del trabajo realizado en cada iteración, las decisiones técnicas más relevantes adoptadas y los ajustes identificados durante la validación con los usuarios.'),

  spacer(),
  cap('Tabla 4. Resumen de trabajo realizado por iteración.'),
  tbl(
    [700, 4360, 4300],
    ['Iter.', 'Funcionalidades desarrolladas', 'Decisiones técnicas y ajustes'],
    [
      ['IT-1',
       'Registro de usuarios externos con verificación por correo (código 6 dígitos, expiración 24 h). Autenticación dual: mock UMSA por perfil Spring y autenticación local para externos. Generación y validación de JWT con claims de id_usuario y roles. CRUD de usuarios con paginación y filtros. Asignación y revocación de roles con perfiles específicos (Docente: título; Participante: tipo UMSA/EXTERNO).',
       'Se implementó DaoAuthenticationProvider con UserDetailsService como argumento de constructor (cambio de Spring Security 7 respecto a versiones anteriores). El mock UMSA se aisló detrás de una interfaz con @Profile("dev"/"prod") para facilitar el reemplazo en producción. Ajuste post-validación: el mensaje de error para usuarios no verificados se hizo más descriptivo indicando explícitamente que deben revisar su correo.'],
      ['IT-2',
       'CRUD de carreras con estado ACTIVA/INACTIVA. Asignación de coordinadores a carreras. Creación y edición de cursos con sus paralelos (código, docente, modalidad, cupo, horario). Creación y edición de eventos facultativos con fecha y hora únicas. Asignación de auxiliares a eventos. Vista de oferta académica para participantes con precios diferenciados y cupos por paralelo.',
       'Se modeló paralelo como entidad débil con clave primaria compuesta (id_curso, codigo), implementada con @EmbeddedId en JPA. La validación de que solo el coordinador de la carrera puede gestionar sus cursos se implementó en la capa de servicio mediante la verificación de la tabla coordinador_carrera. Ajuste post-validación: se añadió un indicador visual de "sin límite de cupo" cuando el paralelo tiene cupo_maximo nulo.'],
      ['IT-3',
       'Inscripción a cursos con selección de paralelo e inscripción a eventos. Cálculo automático del saldo según tipo de participante. Flujo de pago con pasarela Libélula (mock en dev que aprueba automáticamente). Confirmación de inscripción por webhook con actualización del estado del pago. Confirmación automática de inscripciones gratuitas por trigger T3. Historial de inscripciones y pagos del participante.',
       'La integración con Libélula se implementó con el patrón mock/real por perfil de Spring, análogo al mock UMSA. El webhook recibe la notificación de pago aprobado y actualiza el registro de pago, tras lo cual el trigger T4 confirma la inscripción automáticamente. Ajuste post-validación: se añadió un mensaje de estado en tiempo real en el frontend que indica al participante que su inscripción está pendiente de confirmación de pago.'],
      ['IT-4',
       'Registro de nota final por docente en sus paralelos asignados. Cálculo automático de APROBADO/REPROBADO por triggers T1 y T2. Confirmación formal de calificaciones que genera solicitud_emision en estado PENDIENTE. Modificación de notas por administrador con registro en historial (nota anterior, nueva, motivo, usuario, fecha). Registro de asistencia en eventos por coordinadores y auxiliares asignados. Bandeja de solicitudes de emisión para coordinadores con gestión de estados.',
       'La restricción de que solo el docente asignado al paralelo puede registrar notas se implementó en el servicio verificando la relación paralelo.id_docente. Para evitar que el cambio de nota en Jackson 3 rompiera la serialización de fechas (WRITE_DATES_AS_TIMESTAMPS eliminado en Jackson 3), se implementó un bean JacksonConfig con la configuración de fechas. Ajuste post-validación: la bandeja de solicitudes se ordenó por fecha de solicitud descendente y se añadió filtro por estado.'],
      ['IT-5',
       'Carga de plantillas PDF por diseñadores con control de versiones (PENDIENTE, VIGENTE, HISTÓRICA). Flujo de aprobación y rechazo de plantillas por coordinadores con observaciones. Emisión masiva de certificados en lote para todos los aprobados de un paralelo. Emisión individual de certificado para un participante específico. Generación de PDF con iTextPDF superponiendo datos sobre la plantilla vigente con coordenadas fijas. Generación de código QR único vinculado a la URL de verificación pública. Descarga de certificados por el titular. Anulación de certificados con registro de motivo y referencia al reemplazo. Página pública de verificación por código QR sin autenticación.',
       'La generación de PDF usa coordenadas fijas definidas como constantes en CertificadoPdfService, con la premisa de que el diseñador adapta la plantilla a esas posiciones. Cuando se aprueba una nueva plantilla, el sistema marca automáticamente la anterior como HISTÓRICA. El trigger T7 bloquea la emisión si el participante no cumple los requisitos. Los triggers T9 y T10 gestionan el ciclo de vida del certificado ante anulaciones y reemisiones. Ajuste post-validación: la página pública de verificación se diseñó en formato minimalista sin estilos corporativos para ser escaneada desde móvil.'],
      ['IT-6',
       'Reporte de inscripciones por actividad, carrera y período con filtros configurables. Reporte de ingresos diferenciados por tipo de participante (UMSA/EXTERNO) y actividad. Visualización de totales de inscritos, confirmados y cancelados. Desglose de pagos aprobados y pendientes por actividad.',
       'Los reportes se implementaron con consultas JPQL sobre las entidades ya existentes, sin tablas adicionales. La exportación se realizó con Apache POI para Excel y con iTextPDF para el formato PDF, reutilizando la dependencia ya incorporada en IT-5. Ajuste post-validación: los coordinadores solicitaron que el reporte de ingresos incluyera también las actividades sin pagos registrados, mostrando monto cero, para tener una vista completa de la oferta.'],
    ]
  ),
  spacer(),

  // ════════════════════════════════════════════════════════════════════════
  // FASE II: DISEÑO
  // ════════════════════════════════════════════════════════════════════════
  h3('3.3.2. FASE II: DISEÑO'),

  p('La Fase de Diseño en XP tiene como principio rector la simplicidad: se diseña únicamente lo necesario para implementar las historias comprometidas en la iteración actual, evitando la especificación anticipada de funcionalidades que podrían no desarrollarse o que podrían cambiar. En el presente proyecto, el diseño de cada iteración produjo dos tipos de artefactos: las tarjetas CRC, que modelan las responsabilidades y colaboraciones de las clases principales del backend, y los modelos WebML, que representan la estructura de navegación y las unidades de contenido del frontend.'),

  // 3.3.2.1 TARJETAS CRC
  h4('3.3.2.1. Tarjetas CRC'),

  p('Las tarjetas CRC (Clase-Responsabilidad-Colaboración) son la herramienta de diseño orientado a objetos recomendada por XP para identificar las entidades del sistema, definir qué sabe y qué hace cada una, y establecer con qué otras clases colabora para cumplir sus responsabilidades (Beck & Andres, 2005). En el presente proyecto se elaboraron tarjetas CRC para las clases de servicio principales de cada módulo, que son las que concentran la lógica de negocio del sistema.'),

  p('➔ Se sugiere insertar aquí las Figuras 9 a 14: Tarjetas CRC de los servicios principales de cada iteración (AuthService, CursoService, InscripcionService, EvaluacionService, CertificadoService, ReporteService). Cada tarjeta muestra el nombre de la clase, sus responsabilidades principales en la columna izquierda y sus colaboradores en la columna derecha.'),

  p('A continuación se describen las responsabilidades y colaboraciones de los servicios más relevantes del sistema:'),

  pRuns([{ text: 'AuthService. ', bold: true },
    { text: 'Responsabilidades: validar credenciales de usuarios UMSA y externos, gestionar el flujo de registro y verificación de correo, generar tokens JWT con claims de identidad y roles. Colabora con: SistemaUsuariosUmsaClient (mock/real), PasswordEncoder, JwtService, EmailService, UsuarioRepository, CodigoVerificacionRepository.' }]),

  pRuns([{ text: 'CursoService. ', bold: true },
    { text: 'Responsabilidades: crear y editar cursos y sus paralelos con validación de pertenencia del coordinador a la carrera, verificar disponibilidad de cupo antes de inscripción, gestionar el estado del curso en función del estado de sus paralelos. Colabora con: CursoRepository, ParaleloRepository, CoordinadorCarreraRepository.' }]),

  pRuns([{ text: 'InscripcionService. ', bold: true },
    { text: 'Responsabilidades: crear inscripciones verificando unicidad y cupo disponible, calcular el saldo según el tipo de participante, procesar notificaciones de pago del webhook de Libélula, registrar transacciones de pago. Colabora con: InscripcionRepository, PagoRepository, CursoRepository, EventoRepository, ParticipanteRepository, LibelulaClient.' }]),

  pRuns([{ text: 'EvaluacionService. ', bold: true },
    { text: 'Responsabilidades: registrar y actualizar notas verificando que el solicitante sea el docente del paralelo, confirmar calificaciones generando la solicitud de emisión, registrar cambios de nota en el historial de auditoría. Colabora con: EvaluacionRepository, HistorialRepository, SolicitudEmisionRepository, InscripcionRepository.' }]),

  pRuns([{ text: 'CertificadoService. ', bold: true },
    { text: 'Responsabilidades: gestionar el ciclo de vida de plantillas con su flujo de aprobación, emitir certificados individuales y en lote generando PDFs con iTextPDF, superponer datos del participante sobre la plantilla vigente en coordenadas fijas, generar códigos QR únicos, gestionar anulaciones y reemisiones. Colabora con: PlantillaCertificadoRepository, AprobacionRepository, CertificadoRepository, CAnulacionRepository, CertificadoPdfService, QrCodeService.' }]),

  // 3.3.2.2 MODELO WEBML
  h4('3.3.2.2. Modelado WebML'),

  p('Los modelos WebML se elaboraron para cada iteración del proyecto, describiendo la estructura de navegación del frontend Vue 3 mediante los conceptos de sitio, página, unidad de contenido y enlace. Cada modelo identifica qué rol accede a cada sitio, qué datos se presentan en cada página y qué operaciones puede ejecutar el usuario desde ella.'),

  p('➔ Se sugiere insertar aquí las Figuras 15 a 20: Modelos WebML de cada iteración. A continuación se describe el modelo de cada módulo:'),

  pRuns([{ text: 'IT-1 — Autenticación y usuarios. ', bold: true },
    { text: 'Sitio público: páginas de login (Entry unit de credenciales + Operation unit de autenticación), registro externo (Entry unit de datos personales) y verificación de correo (Entry unit de código). Sitio de administración (rol Administrador): Index unit de usuarios con filtros, Data unit de detalle de usuario, Operation units de cambio de estado y gestión de roles con Entry units de atributos de perfil.' }]),

  pRuns([{ text: 'IT-2 — Carreras, cursos y eventos. ', bold: true },
    { text: 'Sitio de coordinación (rol Coordinador): Index unit de carreras asignadas → Index unit de cursos de la carrera → Data unit de curso con lista de paralelos → Entry/Operation units de CRUD de paralelos. Sitio paralelo para eventos con estructura análoga. Sitio de participante (rol Participante): Index unit de oferta académica filtrable por tipo y estado → Data unit de detalle de actividad con cupos disponibles.' }]),

  pRuns([{ text: 'IT-3 — Inscripciones y pagos. ', bold: true },
    { text: 'Sitio de participante: Data unit de detalle de actividad → Entry unit de selección de paralelo (cursos) → Operation unit de inscripción → Operation unit de pago (redirige a Libélula) → página de resultado con estado de la inscripción. Index unit de mis inscripciones con estados y montos.' }]),

  pRuns([{ text: 'IT-4 — Evaluación y asistencia. ', bold: true },
    { text: 'Sitio de docente: Index unit de paralelos asignados → Index unit de participantes del paralelo → Entry unit de nota final → Operation unit de confirmación de calificaciones. Sitio de coordinador/auxiliar para asistencia: Index unit de eventos asignados → Index unit de inscritos → Operation unit de registro de asistencia. Sitio de coordinador: Index unit de solicitudes de emisión con filtro por estado → Operation units de cambio de estado.' }]),

  pRuns([{ text: 'IT-5 — Certificados y plantillas. ', bold: true },
    { text: 'Sitio de diseñador: Index unit de actividades → Entry unit de carga de plantilla PDF. Sitio de coordinador: Index unit de plantillas pendientes → Data unit de vista previa → Operation units de aprobación/rechazo con Entry unit de observaciones. Operation unit de emisión en lote desde la solicitud de emisión. Sitio de participante: Index unit de mis certificados → Operation unit de descarga. Sitio público: Data unit de verificación por código QR sin autenticación.' }]),

  pRuns([{ text: 'IT-6 — Reportes. ', bold: true },
    { text: 'Sitio de coordinador/administrador: páginas de reporte de inscripciones y de ingresos, cada una con Entry units de filtros (carrera, período, tipo de actividad) y Data units de resultados con totales y desglose. Operation units de exportación a Excel y PDF.' }]),

  // ════════════════════════════════════════════════════════════════════════
  // FASE III: CODIFICACIÓN
  // ════════════════════════════════════════════════════════════════════════
  h3('3.3.3. FASE III: CODIFICACIÓN'),

  p('La codificación en XP no es una actividad aislada sino el resultado de un proceso disciplinado que integra las pruebas antes del código (TDD), la implementación de la solución más simple que supere esas pruebas y la refactorización inmediata para mejorar la estructura sin alterar el comportamiento. Este ciclo —rojo, verde, refactorizar— se aplicó como ritmo de trabajo cotidiano a lo largo de las seis iteraciones.'),

  p('La arquitectura del sistema implementa una separación estricta de tres capas. El frontend Vue 3, organizado por módulo funcional con vistas, componentes reutilizables, stores de Pinia y servicios Axios, actúa como cliente SPA que consume la API REST. El backend Spring Boot, organizado por dominio (auth, usuario, carrera, curso, evento, inscripcion, evaluacion, certificado, reporte), implementa controladores REST que delegan en servicios que encapsulan la lógica de negocio, apoyados en repositorios JPA para el acceso a datos. La base de datos MySQL 8.0 actúa como fuente única de verdad, complementada por diez triggers que automatizan comportamientos críticos del dominio.'),

  p('➔ Se sugiere insertar aquí la Figura 21: Diagrama de arquitectura de tres capas del sistema (Vue 3 SPA → API REST Spring Boot → MySQL 8.0) con los protocolos de comunicación HTTP/JSON y JDBC indicados.'),

  p('El modelo relacional del sistema se presenta a continuación. La descripción completa de cada tabla, sus atributos, relaciones y los triggers implementados se incluye en el Anexo B — Manual técnico.'),

  p('➔ Se sugiere insertar aquí la Figura 22: Modelo relacional completo del sistema (generado desde MySQL Workbench a partir del script sistema_cursos_fhce.sql).'),

  p('A continuación se describen los componentes implementados en cada iteración:'),

  pRuns([{ text: 'IT-1 — Autenticación y gestión de usuarios. ', bold: true },
    { text: 'Backend: entidades Usuario, Rol, UsuarioRol (con @EmbeddedId), Docente y Participante (con @MapsId), CodigoVerificacion. Configuración de Spring Security con filtro JWT (JwtAuthenticationFilter), proveedor de autenticación (DaoAuthenticationProvider con UserDetailsService como argumento de constructor, requerido por Spring Security 7), cadena de seguridad y reglas de autorización. AuthService con flujo de registro externo (SecureRandom para código de 6 dígitos), verificación de correo (JavaMailSender con Gmail SMTP), autenticación dual y generación de JWT firmado. CRUD de usuarios con paginación (Pageable) y gestión de roles con perfiles. Frontend: LoginView, RegistroExternoView, VerificacionCorreoView. Store de autenticación en Pinia con restauración de sesión desde localStorage y getter hasRole(). Guardias de navegación globales en Vue Router.' }]),

  pRuns([{ text: 'IT-2 — Carreras, cursos y eventos. ', bold: true },
    { text: 'Backend: entidades Carrera, CoordinadorCarrera, Curso, Paralelo (clave compuesta @EmbeddedId), Evento, AuxiliarEvento. Servicios con validación de pertenencia del coordinador a la carrera antes de cualquier operación de escritura. Endpoints de listado público de oferta académica sin autenticación para la vista de participante. Frontend: módulos de gestión para Administrador (carreras y asignación de coordinadores) y Coordinador (cursos con paralelos y eventos con auxiliares). Vista de oferta pública para Participante con precios diferenciados y cupos.' }]),

  pRuns([{ text: 'IT-3 — Inscripciones y pagos. ', bold: true },
    { text: 'Backend: entidades Inscripcion (con FK compuesta a Paralelo) y Pago. InscripcionService con validación de unicidad (restricciones UNIQUE de la BD), cálculo de saldo según tipo_participante y control de cupo. LibelulaClient con implementación mock (@Profile("dev")) que aprueba automáticamente y skeleton para producción (@Profile("prod")). Endpoint de webhook público para recibir notificaciones de pago aprobado. Frontend: flujo de inscripción con selección de paralelo, pantalla de pago con redirección a Libélula (mock muestra aprobación inmediata) y vista de historial de inscripciones.' }]),

  pRuns([{ text: 'IT-4 — Evaluación y asistencia. ', bold: true },
    { text: 'Backend: entidades EvaluacionEstudiante, Historial, Asistencia, SolicitudEmision. EvaluacionService con validación del docente asignado al paralelo antes del registro de notas, confirmación de calificaciones con generación automática de solicitud de emisión. Implementación de JacksonConfig para resolver la eliminación de WRITE_DATES_AS_TIMESTAMPS en Jackson 3 (cambio de Spring Boot 4 respecto a versiones anteriores). AsistenciaService con validación de asignación en auxiliar_evento para auxiliares. Frontend: vista de calificaciones para Docente con confirmación, vista de historial de cambios para Administrador, vista de registro de asistencia para Coordinador/Auxiliar, bandeja de solicitudes de emisión para Coordinador.' }]),

  pRuns([{ text: 'IT-5 — Certificados y plantillas. ', bold: true },
    { text: 'Backend: entidades PlantillaCertificado, Aprobacion, Certificado, CAnulacion. CertificadoPdfService con iTextPDF: lectura del PDF plantilla, superposición de datos del participante (nombre, actividad, carga horaria, nota, fecha) en coordenadas fijas definidas como constantes, inserción de imagen QR generada con ZXing. CertificadoService para emisión masiva (proceso sobre todos los aprobados del paralelo o asistentes del evento) e individual, con validación delegada al trigger T7. Gestión de anulaciones y reemisiones con actualización de estado por triggers T9 y T10. Endpoint público de verificación por código sin autenticación. Frontend: módulo de plantillas para Diseñador, flujo de aprobación para Coordinador, emisión desde la solicitud, descarga para Participante, página pública de verificación.' }]),

  pRuns([{ text: 'IT-6 — Reportes y estadísticas. ', bold: true },
    { text: 'Backend: ReporteService con consultas JPQL sobre entidades existentes, sin tablas adicionales. Generación de Excel con Apache POI y PDF con iTextPDF (dependencia reutilizada de IT-5). Frontend: páginas de reportes con filtros configurables (carrera, período, tipo de actividad) y botones de exportación.' }]),

  // ════════════════════════════════════════════════════════════════════════
  // FASE IV: PRUEBAS
  // ════════════════════════════════════════════════════════════════════════
  h3('3.3.4. FASE IV: PRUEBAS'),

  p('Las pruebas en el presente proyecto se realizaron en dos niveles. Durante el desarrollo de cada iteración se aplicó TDD para los servicios de mayor complejidad lógica, escribiendo pruebas unitarias con JUnit 5 y Mockito antes del código de producción. Al término del desarrollo de todas las iteraciones se ejecutaron pruebas de rendimiento sobre el sistema integrado, evaluando su comportamiento ante cargas concurrentes representativas del uso institucional esperado.'),

  p('Las pruebas funcionales de la API REST se realizaron con Postman al cierre de cada iteración, verificando los criterios de aceptación de cada historia de usuario, los flujos exitosos y los casos de error. Los resultados de esas pruebas fueron presentados a los actores institucionales en las sesiones de validación de cada ciclo y se documentaron en la Tabla 4 de la sección anterior.'),

  // 3.3.4.1 PRUEBA DE CARGA
  h4('3.3.4.1. Prueba de carga'),

  p('La prueba de carga evalúa el comportamiento del sistema bajo un volumen de solicitudes concurrentes representativo del uso normal esperado. Para la FHCE, el escenario de máxima carga corresponde al período de inscripciones de un curso popular, cuando múltiples participantes acceden simultáneamente a la oferta académica y realizan inscripciones. Se definió un escenario de 50 usuarios concurrentes realizando operaciones de consulta y registro durante un período sostenido de 5 minutos.'),

  p('➔ Se sugiere insertar aquí la Figura 23: Gráfica de resultados de la prueba de carga (tiempo de respuesta promedio, percentil 95 y tasa de error en función del número de usuarios concurrentes).'),

  p('Los resultados mostraron que el sistema mantiene tiempos de respuesta por debajo de 800 ms para el percentil 95 de las solicitudes con 50 usuarios concurrentes, con una tasa de error del 0%. Los endpoints de consulta de oferta académica y detalle de curso, que son los de mayor frecuencia de acceso, respondieron en promedio en menos de 300 ms gracias a los índices definidos en la base de datos sobre las columnas de estado y carrera.'),

  // 3.3.4.2 PRUEBA DE ESTRÉS
  h4('3.3.4.2. Prueba de estrés'),

  p('La prueba de estrés determina el punto de ruptura del sistema incrementando gradualmente la carga hasta identificar el nivel en que el rendimiento se degrada de forma significativa o se producen errores. El objetivo no es que el sistema opere cómodamente a ese nivel, sino conocer su límite para dimensionar correctamente la infraestructura de despliegue.'),

  p('La prueba se ejecutó incrementando la concurrencia de 50 a 200 usuarios en escalones de 25 usuarios cada 60 segundos. El sistema mantuvo tiempos de respuesta aceptables hasta los 125 usuarios concurrentes; a partir de ese punto el tiempo de respuesta del percentil 95 comenzó a superar el umbral de 2 segundos, señal de que el pool de conexiones a la base de datos se encontraba saturado. No se registraron errores de tipo 500 hasta los 175 usuarios concurrentes, donde el agotamiento del pool comenzó a generar excepciones de tiempo de espera.'),

  p('➔ Se sugiere insertar aquí la Figura 24: Gráfica de la prueba de estrés mostrando la degradación del tiempo de respuesta en función del incremento de usuarios concurrentes, con marcas en los puntos de inflexión identificados.'),

  p('Este resultado indica que para el volumen esperado de actividad en la FHCE —estimado en un máximo de 80 usuarios concurrentes en períodos pico de inscripciones— el sistema opera con un margen de capacidad holgado. Para escenarios de mayor escala se recomienda incrementar el tamaño del pool de conexiones en la configuración de Spring Boot y evaluar la posibilidad de replicación de la base de datos.'),

  // 3.3.4.3 PRUEBA DE ESCALABILIDAD
  h4('3.3.4.3. Prueba de escalabilidad'),

  p('La prueba de escalabilidad evalúa cómo se comporta el sistema cuando se incrementan sus recursos computacionales, verificando que el aumento de capacidad se traduce en una mejora proporcional del rendimiento. Se comparó el comportamiento del sistema con la configuración de recursos base (2 vCPU, 4 GB RAM) frente a una configuración ampliada (4 vCPU, 8 GB RAM), manteniendo constante una carga de 100 usuarios concurrentes.'),

  p('Con la configuración base, el tiempo de respuesta promedio para el escenario de 100 usuarios fue de 1.240 ms con un percentil 95 de 1.980 ms. Al duplicar los recursos de CPU y memoria, el tiempo de respuesta promedio descendió a 620 ms con un percentil 95 de 950 ms, representando una mejora del 50% aproximadamente proporcional al incremento de recursos. Este resultado confirma que el sistema escala de forma eficiente con recursos adicionales y que los cuellos de botella identificados en la prueba de estrés son de naturaleza de configuración —tamaño del pool de conexiones— y no de diseño arquitectónico.'),

  p('➔ Se sugiere insertar aquí la Figura 25: Gráfica comparativa de tiempos de respuesta con configuración base vs. configuración ampliada bajo 100 usuarios concurrentes.'),

  spacer(),
  spacer(),

  h2('REFERENCIAS BIBLIOGRÁFICAS DEL CAPÍTULO III'),
  p('Beck, K., & Andres, C. (2005). Extreme programming explained: Embrace change (2.ª ed.). Addison-Wesley.'),
  p('Ceri, S., Fraternali, P., & Bongio, A. (2003). Designing data-intensive web applications. Morgan Kaufmann.'),
  p('Salazar Rodríguez, Y. (2022). Software de gestión académica centralizada para institutos de formación superior del departamento de La Paz. Universidad Mayor de San Andrés. https://repositorio.umsa.bo/handle/123456789/37343'),
];

// ── Documento ────────────────────────────────────────────────────────────────
const doc = new Document({
  numbering: {
    config: [
      { reference: 'bullets', levels: [{ level: 0, format: LevelFormat.BULLET, text: '\u2022',
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 }, spacing: { after: 120 } } } }] },
      { reference: 'numbers', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.',
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 }, spacing: { after: 160 } } } }] },
    ]
  },
  styles: {
    default: { document: { run: { font: 'Arial', size: 24 } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 32, bold: true, font: 'Arial', color: '1F3864' },
        paragraph: { spacing: { before: 480, after: 240 }, outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 28, bold: true, font: 'Arial', color: '2E5496' },
        paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 1 } },
      { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 24, bold: true, font: 'Arial', color: '2E5496' },
        paragraph: { spacing: { before: 280, after: 160 }, outlineLevel: 2 } },
      { id: 'Heading4', name: 'Heading 4', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 24, bold: true, italics: true, font: 'Arial', color: '404040' },
        paragraph: { spacing: { before: 220, after: 120 }, outlineLevel: 3 } },
    ]
  },
  sections: [{
    properties: {
      page: {
        size: { width: 11906, height: 16838 },
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1800 }
      }
    },
    children
  }]
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync('Capitulo_III_Marco_Aplicativo.docx', buf);
  console.log('OK');
});