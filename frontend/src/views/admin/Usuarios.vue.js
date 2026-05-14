import { ref, computed, onMounted } from 'vue';
import Card from '@/components/common/Card.vue';
import Button from '@/components/common/Button.vue';
import Badge from '@/components/common/Badge.vue';
import Modal from '@/components/common/Modal.vue';
import Pagination from '@/components/common/Pagination.vue'; // ← NUEVO: Importar componente de paginación
import { usePagination } from '@/composables/usePagination'; // ← NUEVO: Importar composable
import { api } from '@/utils/api';
import { useAlertStore } from '@/stores/alert.store';
// ============================================
// ESTADO
// ============================================
const loading = ref(false);
const saving = ref(false);
const alertStore = useAlertStore();
// Datos
const usuarios = ref([]);
const carreras = ref([]);
const actividadesDisponibles = ref([]); // ← Para docentes/auxiliares
const paralelosDisponibles = ref([]); // ← Para docentes
// Estadísticas
const estadisticas = ref({
    total: 0,
    internos: 0,
    externos: 0,
    activos: 0
});
// Filtros
const filtros = ref({
    busqueda: '',
    tipoUsuario: '',
    rol: '',
    estado: '',
    emailVerificado: ''
});
// Modales
const showUsuarioModal = ref(false);
const showRolesModal = ref(false);
const showCarrerasModal = ref(false); // Solo coordinadores
const showActividadesModal = ref(false); // ← NUEVO: Para docentes y auxiliares
const showPasswordModal = ref(false);
const showAccionesModal = ref(false);
const modoEdicion = ref(false);
const usuarioSeleccionado = ref(null);
// Formularios
const formUsuario = ref({
    username: '',
    nombres: '',
    apellidos: '',
    email: '',
    password: '',
    tipoParticipante: 'EXTERNO',
    tipoUsuario: '',
    estado: 'ACTIVO'
});
const rolesSeleccionados = ref([]);
const carrerasSeleccionadas = ref([]); // Solo coordinadores
const actividadesSeleccionadas = ref([]); // ← NUEVO: Para auxiliares (eventos)
const paralelosSeleccionados = ref([]); // ← NUEVO: Para docentes (paralelos)
// Filtros del modal de actividades
const filtroCarreraActividades = ref(''); // ← NUEVO
const filtroBusquedaActividades = ref(''); // ← NUEVO
const nuevaPassword = ref('');
const confirmarPassword = ref('');
const tituloDocente = ref('');
// ============================================
// COMPUTED
// ============================================
const usuariosFiltrados = computed(() => {
    let resultado = [...usuarios.value];
    if (filtros.value.busqueda) {
        const busqueda = filtros.value.busqueda.toLowerCase();
        resultado = resultado.filter(u => u.nombres.toLowerCase().includes(busqueda) ||
            u.apellidos.toLowerCase().includes(busqueda) ||
            u.email.toLowerCase().includes(busqueda) ||
            u.username.toLowerCase().includes(busqueda));
    }
    if (filtros.value.tipoUsuario) {
        resultado = resultado.filter(u => u.tipoUsuario === filtros.value.tipoUsuario);
    }
    if (filtros.value.rol) {
        resultado = resultado.filter(u => u.roles.includes(filtros.value.rol));
    }
    if (filtros.value.estado) {
        resultado = resultado.filter(u => u.estado === filtros.value.estado);
    }
    if (filtros.value.emailVerificado) {
        const verificado = filtros.value.emailVerificado === 'true';
        resultado = resultado.filter(u => u.emailVerificado === verificado);
    }
    return resultado;
});
// ============================================
// PAGINACIÓN
// ============================================
const { paginatedData: usuariosPaginados, // ← Los datos que mostraremos en la tabla (10 items por defecto)
currentPage, // ← Página actual (reactivo)
pageSize, // ← Tamaño de página (reactivo)
totalPages, // ← Total de páginas (calculado automáticamente)
totalItems, // ← Total de items después de filtrar
goToPage, // ← Método para ir a una página específica
setPageSize // ← Método para cambiar el tamaño de página
 } = usePagination(usuariosFiltrados, {
    pageSize: 10, // ← 10 usuarios por página
    initialPage: 1 // ← Empezar en la página 1
});
// ============================================
// MÉTODOS - CRUD
// ============================================
const cargarUsuarios = async () => {
    loading.value = true;
    try {
        const [usuariosResponse, carrerasResponse, eventosResponse, cursosResponse] = await Promise.all([
            api.get('/usuarios'),
            api.get('/carreras/todas'),
            api.get('/eventos/todos'),
            api.get('/cursos/todos')
        ]);
        usuarios.value = usuariosResponse.map((u) => ({
            idUsuario: u.idUsuario,
            username: u.username,
            nombres: u.nombres,
            apellidos: u.apellidos,
            email: u.email,
            tipoUsuario: u.tipoUsuario || 'EXTERNO',
            emailVerificado: u.emailVerificado,
            estado: u.estado,
            roles: u.roles,
            carreras: [],
            fechaRegistro: u.fechaRegistro
        }));
        carreras.value = carrerasResponse.map((c) => ({
            idCarrera: c.idCarrera,
            nombre: c.nombre
        }));
        actividadesDisponibles.value = eventosResponse.map((e) => ({
            idActividad: e.idEvento,
            nombre: e.nombre,
            tipo: 'EVENTO',
            idCarrera: e.idCarrera,
            carreraNombre: e.nombreCarrera,
            modalidad: e.modalidad,
            fechaInicio: e.fechaHora,
            fechaFin: e.fechaHora
        }));
        const paralelos = [];
        for (const curso of cursosResponse) {
            for (const paralelo of curso.paralelos || []) {
                paralelos.push({
                    idParalelo: buildParaleloKey(paralelo.idCurso, paralelo.codigo),
                    codigo: paralelo.codigo,
                    idCurso: paralelo.idCurso,
                    idCarrera: curso.idCarrera,
                    actividadNombre: curso.nombre,
                    actividadTipo: 'CURSO',
                    carreraNombre: curso.nombreCarrera
                });
            }
        }
        paralelosDisponibles.value = paralelos;
        calcularEstadisticas();
    }
    catch (error) {
        console.error('Error al cargar usuarios:', error);
        alertStore.push({ type: 'error', message: 'No se pudieron cargar los datos de usuarios.' });
    }
    finally {
        loading.value = false;
    }
};
const calcularEstadisticas = () => {
    estadisticas.value = {
        total: usuarios.value.length,
        internos: usuarios.value.filter(u => u.tipoUsuario === 'INTERNO').length,
        externos: usuarios.value.filter(u => u.tipoUsuario === 'EXTERNO').length,
        activos: usuarios.value.filter(u => u.estado === 'ACTIVO').length
    };
};
const submitUsuario = async () => {
    saving.value = true;
    try {
        if (modoEdicion.value) {
            if (!usuarioSeleccionado.value) {
                alertStore.push({ type: 'warning', message: 'Selecciona un usuario para editar.' });
                saving.value = false;
                return;
            }
            const payload = {
                nombres: formUsuario.value.nombres,
                apellidos: formUsuario.value.apellidos
            };
            if (formUsuario.value.tipoUsuario === 'EXTERNO') {
                payload.email = formUsuario.value.email;
                payload.estado = formUsuario.value.estado;
            }
            await api.put(`/usuarios/${usuarioSeleccionado.value.idUsuario}`, payload);
            alertStore.push({ type: 'success', message: 'Usuario actualizado correctamente.' });
        }
        else {
            // Solo se pueden crear usuarios EXTERNOS
            await api.post('/auth/registro', {
                username: formUsuario.value.username,
                nombres: formUsuario.value.nombres,
                apellidos: formUsuario.value.apellidos,
                email: formUsuario.value.email,
                password: formUsuario.value.password,
                tipoParticipante: formUsuario.value.tipoParticipante
            });
            alertStore.push({ type: 'success', message: 'Usuario creado. Debe verificar su email.' });
        }
        closeUsuarioModal();
        await cargarUsuarios();
    }
    catch (error) {
        console.error('Error al guardar usuario:', error);
        alertStore.push({ type: 'error', message: 'No se pudo guardar el usuario.' });
    }
    finally {
        saving.value = false;
    }
};
const toggleEstadoUsuario = async (usuario) => {
    const nuevoEstado = usuario.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
    const accion = nuevoEstado === 'ACTIVO' ? 'activar' : 'desactivar';
    if (confirm(`¿Estás seguro de ${accion} a ${usuario.nombres} ${usuario.apellidos}?`)) {
        try {
            await api.patch(`/usuarios/${usuario.idUsuario}/estado`, { estado: nuevoEstado });
            usuario.estado = nuevoEstado;
            calcularEstadisticas();
            alertStore.push({ type: 'success', message: `Usuario ${accion}ado correctamente.` });
        }
        catch (error) {
            console.error('Error al cambiar estado:', error);
            alertStore.push({ type: 'error', message: 'No se pudo cambiar el estado.' });
        }
    }
};
// ============================================
// MÉTODOS - ROLES
// ============================================
const guardarRoles = async () => {
    if (!usuarioSeleccionado.value)
        return;
    saving.value = true;
    try {
        const currentRoles = usuarioSeleccionado.value.roles.filter((rol) => rol !== 'PARTICIPANTE');
        const rolesToAdd = rolesSeleccionados.value.filter((rol) => !currentRoles.includes(rol));
        const rolesToRemove = currentRoles.filter((rol) => !rolesSeleccionados.value.includes(rol));
        for (const rol of rolesToAdd) {
            if (rol === 'DOCENTE' && !tituloDocente.value.trim()) {
                alertStore.push({ type: 'warning', message: 'El titulo es obligatorio para DOCENTE.' });
                saving.value = false;
                return;
            }
            await api.post(`/usuarios/${usuarioSeleccionado.value.idUsuario}/roles`, {
                nombreRol: rol,
                titulo: rol === 'DOCENTE' ? tituloDocente.value.trim() : undefined
            });
        }
        for (const rol of rolesToRemove) {
            await api.delete(`/usuarios/${usuarioSeleccionado.value.idUsuario}/roles/${rol}`);
        }
        alertStore.push({ type: 'success', message: 'Roles actualizados correctamente.' });
        await cargarUsuarios();
        // Si es COORDINADOR → Asignar carreras
        if (rolesSeleccionados.value.includes('COORDINADOR')) {
            if (confirm('¿Deseas asignar carreras al coordinador ahora?')) {
                closeRolesModal();
                openCarrerasModal(usuarioSeleccionado.value);
                return;
            }
        }
        // Si es DOCENTE → Asignar paralelos de cursos
        if (rolesSeleccionados.value.includes('DOCENTE')) {
            if (confirm('¿Deseas asignar cursos/paralelos al docente ahora?')) {
                closeRolesModal();
                openActividadesModal(usuarioSeleccionado.value, 'DOCENTE');
                return;
            }
        }
        // Si es AUXILIAR → Asignar eventos
        if (rolesSeleccionados.value.includes('AUXILIAR')) {
            if (confirm('¿Deseas asignar eventos al auxiliar ahora?')) {
                closeRolesModal();
                openActividadesModal(usuarioSeleccionado.value, 'AUXILIAR');
                return;
            }
        }
        closeRolesModal();
    }
    catch (error) {
        console.error('Error al guardar roles:', error);
        alertStore.push({ type: 'error', message: 'No se pudieron actualizar los roles.' });
    }
    finally {
        saving.value = false;
    }
};
// ============================================
// MÉTODOS - CARRERAS (Solo COORDINADORES)
// ============================================
const openCarrerasModal = (usuario) => {
    if (!usuario.roles.includes('COORDINADOR')) {
        alert('Solo los coordinadores tienen carreras asignadas');
        return;
    }
    usuarioSeleccionado.value = usuario;
    carrerasSeleccionadas.value = [];
    api.get(`/usuarios/${usuario.idUsuario}/carreras`)
        .then((response) => {
        carrerasSeleccionadas.value = response;
    })
        .catch(() => {
        alertStore.push({ type: 'error', message: 'No se pudieron cargar las carreras.' });
    });
    showCarrerasModal.value = true;
};
const closeCarrerasModal = () => {
    showCarrerasModal.value = false;
    usuarioSeleccionado.value = null;
    carrerasSeleccionadas.value = [];
};
const guardarCarreras = async () => {
    if (!usuarioSeleccionado.value)
        return;
    saving.value = true;
    try {
        await api.put(`/usuarios/${usuarioSeleccionado.value.idUsuario}/carreras`, {
            carreraIds: carrerasSeleccionadas.value
        });
        usuarioSeleccionado.value.carreras = carreras.value.filter((c) => carrerasSeleccionadas.value.includes(c.idCarrera));
        alertStore.push({ type: 'success', message: 'Carreras actualizadas.' });
        closeCarrerasModal();
    }
    catch (error) {
        console.error('Error al guardar carreras:', error);
        alertStore.push({ type: 'error', message: 'No se pudieron guardar las carreras.' });
    }
    finally {
        saving.value = false;
    }
};
// ============================================
// MÉTODOS - ACTIVIDADES (Docentes y Auxiliares)
// ============================================
const tipoGestionActividades = ref('DOCENTE'); // ← NUEVO: Guardar el tipo
const openActividadesModal = (usuario, tipo) => {
    usuarioSeleccionado.value = usuario;
    tipoGestionActividades.value = tipo; // ← Guardar qué tipo estamos gestionando
    // Resetear filtros
    filtroCarreraActividades.value = '';
    filtroBusquedaActividades.value = '';
    // Cargar datos según el tipo
    if (tipo === 'DOCENTE') {
        paralelosSeleccionados.value = [];
        api.get(`/usuarios/${usuario.idUsuario}/paralelos`)
            .then((response) => {
            const asignados = response;
            paralelosSeleccionados.value = asignados.map((p) => buildParaleloKey(p.idCurso, p.codigo));
        })
            .catch(() => {
            alertStore.push({ type: 'error', message: 'No se pudieron cargar los paralelos.' });
        });
    }
    else {
        actividadesSeleccionadas.value = [];
        api.get(`/usuarios/${usuario.idUsuario}/eventos`)
            .then((response) => {
            actividadesSeleccionadas.value = response;
        })
            .catch(() => {
            alertStore.push({ type: 'error', message: 'No se pudieron cargar los eventos.' });
        });
    }
    showActividadesModal.value = true;
};
const closeActividadesModal = () => {
    showActividadesModal.value = false;
    usuarioSeleccionado.value = null;
    tipoGestionActividades.value = 'DOCENTE';
    actividadesSeleccionadas.value = [];
    paralelosSeleccionados.value = [];
    filtroCarreraActividades.value = '';
    filtroBusquedaActividades.value = '';
};
// Computed: Filtrar actividades por carrera y búsqueda
const actividadesFiltradas = computed(() => {
    let resultado = [...actividadesDisponibles.value];
    // Filtrar por carrera
    if (filtroCarreraActividades.value) {
        resultado = resultado.filter(a => a.idCarrera === Number(filtroCarreraActividades.value));
    }
    // Filtrar por búsqueda
    if (filtroBusquedaActividades.value) {
        const busqueda = filtroBusquedaActividades.value.toLowerCase();
        resultado = resultado.filter(a => a.nombre.toLowerCase().includes(busqueda));
    }
    // Si estamos gestionando AUXILIAR, mostrar solo EVENTOS
    if (tipoGestionActividades.value === 'AUXILIAR') {
        resultado = resultado.filter(a => a.tipo === 'EVENTO');
    }
    return resultado;
});
// Computed: Filtrar paralelos por carrera y búsqueda
const paralelosFiltrados = computed(() => {
    let resultado = [...paralelosDisponibles.value];
    // Filtrar por carrera
    if (filtroCarreraActividades.value) {
        resultado = resultado.filter(p => p.idCarrera === Number(filtroCarreraActividades.value));
    }
    // Filtrar por búsqueda
    if (filtroBusquedaActividades.value) {
        const busqueda = filtroBusquedaActividades.value.toLowerCase();
        resultado = resultado.filter(p => p.actividadNombre.toLowerCase().includes(busqueda) ||
            p.codigo.toLowerCase().includes(busqueda));
    }
    return resultado;
});
const guardarActividades = async () => {
    if (!usuarioSeleccionado.value)
        return;
    saving.value = true;
    try {
        if (tipoGestionActividades.value === 'DOCENTE') {
            const paralelos = paralelosSeleccionados.value.map(parseParaleloKey);
            await api.put(`/usuarios/${usuarioSeleccionado.value.idUsuario}/paralelos`, { paralelos });
            alertStore.push({ type: 'success', message: 'Paralelos actualizados.' });
        }
        else if (tipoGestionActividades.value === 'AUXILIAR') {
            await api.put(`/usuarios/${usuarioSeleccionado.value.idUsuario}/eventos`, {
                eventoIds: actividadesSeleccionadas.value
            });
            alertStore.push({ type: 'success', message: 'Eventos actualizados.' });
        }
        closeActividadesModal();
    }
    catch (error) {
        console.error('Error al guardar actividades:', error);
        alertStore.push({ type: 'error', message: 'Error al guardar las asignaciones.' });
    }
    finally {
        saving.value = false;
    }
};
// ============================================
// MÉTODOS - CONTRASEÑA (NUEVO)
// ============================================
const openPasswordModal = (usuario) => {
    if (usuario.tipoUsuario === 'INTERNO') {
        alert('No se puede cambiar la contraseña de usuarios UMSA. La autenticación es mediante el SIA.');
        return;
    }
    usuarioSeleccionado.value = usuario;
    nuevaPassword.value = '';
    confirmarPassword.value = '';
    showPasswordModal.value = true;
};
const closePasswordModal = () => {
    showPasswordModal.value = false;
    usuarioSeleccionado.value = null;
    nuevaPassword.value = '';
    confirmarPassword.value = '';
};
const guardarPassword = async () => {
    if (!usuarioSeleccionado.value)
        return;
    // Validaciones
    if (nuevaPassword.value.length < 6) {
        alert('La contraseña debe tener al menos 6 caracteres');
        return;
    }
    if (nuevaPassword.value !== confirmarPassword.value) {
        alert('Las contraseñas no coinciden');
        return;
    }
    saving.value = true;
    try {
        console.log('Cambiando contraseña para:', usuarioSeleccionado.value.username);
        // TODO: API call - PUT /api/usuarios/:id/password
        // Body: { password: nuevaPassword.value }
        alert('Contraseña actualizada exitosamente');
        closePasswordModal();
    }
    catch (error) {
        console.error('Error al cambiar contraseña:', error);
        alert('Error al cambiar la contraseña');
    }
    finally {
        saving.value = false;
    }
};
// ============================================
// MÉTODOS - MODALES
// ============================================
const openCreateModal = () => {
    modoEdicion.value = false;
    formUsuario.value = {
        username: '',
        nombres: '',
        apellidos: '',
        email: '',
        password: '',
        tipoParticipante: 'EXTERNO',
        tipoUsuario: 'EXTERNO',
        estado: 'ACTIVO'
    };
    showUsuarioModal.value = true;
};
const openEditModal = (usuario) => {
    modoEdicion.value = true;
    // USUARIOS INTERNOS: Solo editar nombres y apellidos
    // USUARIOS EXTERNOS: Editar todo excepto username
    formUsuario.value = {
        username: usuario.username,
        nombres: usuario.nombres,
        apellidos: usuario.apellidos,
        email: usuario.email,
        password: '',
        tipoParticipante: 'EXTERNO',
        tipoUsuario: usuario.tipoUsuario,
        estado: usuario.estado
    };
    usuarioSeleccionado.value = usuario;
    showUsuarioModal.value = true;
};
const closeUsuarioModal = () => {
    showUsuarioModal.value = false;
    usuarioSeleccionado.value = null;
};
const openRolesModal = (usuario) => {
    usuarioSeleccionado.value = usuario;
    rolesSeleccionados.value = usuario.roles.filter(r => r !== 'PARTICIPANTE');
    tituloDocente.value = '';
    showRolesModal.value = true;
};
const closeRolesModal = () => {
    showRolesModal.value = false;
    usuarioSeleccionado.value = null;
    rolesSeleccionados.value = [];
    tituloDocente.value = '';
};
const openAccionesModal = (usuario) => {
    usuarioSeleccionado.value = usuario;
    showAccionesModal.value = true;
};
const closeAccionesModal = () => {
    showAccionesModal.value = false;
};
const ejecutarAccionUsuario = (callback) => {
    if (!usuarioSeleccionado.value)
        return;
    callback(usuarioSeleccionado.value);
    showAccionesModal.value = false;
};
// ============================================
// MÉTODOS - UTILIDADES
// ============================================
const limpiarFiltros = () => {
    filtros.value = {
        busqueda: '',
        tipoUsuario: '',
        rol: '',
        estado: '',
        emailVerificado: ''
    };
};
const getInitials = (nombres, apellidos) => {
    return `${nombres.charAt(0)}${apellidos.charAt(0)}`.toUpperCase();
};
const getRolBadgeVariant = (rol) => {
    const variants = {
        'ADMINISTRADOR': 'danger',
        'COORDINADOR': 'primary',
        'DOCENTE': 'info',
        'PARTICIPANTE': 'gray',
        'AUXILIAR': 'secondary',
        'DISEÑADOR': 'warning'
    };
    return variants[rol] || 'gray';
};
const formatRolName = (rol) => {
    const nombres = {
        'ADMINISTRADOR': 'Admin',
        'COORDINADOR': 'Coord.',
        'DOCENTE': 'Docente',
        'PARTICIPANTE': 'Part.',
        'AUXILIAR': 'Aux.',
        'DISEÑADOR': 'Dis.'
    };
    return nombres[rol] || rol;
};
const formatDate = (date) => {
    return new Date(date).toLocaleDateString('es-BO', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
};
const buildParaleloKey = (idCurso, codigo) => {
    return `${idCurso}:${codigo}`;
};
const parseParaleloKey = (key) => {
    const [idCurso, codigo] = key.split(':');
    return { idCurso: Number(idCurso), codigo };
};
// ============================================
// LIFECYCLE
// ============================================
onMounted(() => {
    cargarUsuarios();
});
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "space-y-6" },
});
/** @type {__VLS_StyleScopedClasses['space-y-6']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "flex items-center justify-between" },
});
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)({
    ...{ class: "text-3xl font-bold text-gray-800 mb-2" },
});
/** @type {__VLS_StyleScopedClasses['text-3xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "text-gray-600" },
});
/** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
const __VLS_0 = Button || Button;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    ...{ 'onClick': {} },
}));
const __VLS_2 = __VLS_1({
    ...{ 'onClick': {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
let __VLS_5;
const __VLS_6 = ({ click: {} },
    { onClick: (__VLS_ctx.openCreateModal) });
const { default: __VLS_7 } = __VLS_3.slots;
__VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
    ...{ class: "w-5 h-5 mr-2" },
    fill: "none",
    stroke: "currentColor",
    viewBox: "0 0 24 24",
});
/** @type {__VLS_StyleScopedClasses['w-5']} */ ;
/** @type {__VLS_StyleScopedClasses['h-5']} */ ;
/** @type {__VLS_StyleScopedClasses['mr-2']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.path)({
    'stroke-linecap': "round",
    'stroke-linejoin': "round",
    'stroke-width': "2",
    d: "M12 4v16m8-8H4",
});
// @ts-ignore
[openCreateModal,];
var __VLS_3;
var __VLS_4;
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "text-xs text-gray-500 mt-1 text-right" },
});
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-right']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "grid grid-cols-1 md:grid-cols-4 gap-4" },
});
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-cols-1']} */ ;
/** @type {__VLS_StyleScopedClasses['md:grid-cols-4']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
const __VLS_8 = Card || Card;
// @ts-ignore
const __VLS_9 = __VLS_asFunctionalComponent1(__VLS_8, new __VLS_8({}));
const __VLS_10 = __VLS_9({}, ...__VLS_functionalComponentArgsRest(__VLS_9));
const { default: __VLS_13 } = __VLS_11.slots;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "text-center" },
});
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "text-2xl font-bold text-gray-800" },
});
/** @type {__VLS_StyleScopedClasses['text-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
(__VLS_ctx.estadisticas.total);
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "text-sm text-gray-600" },
});
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
// @ts-ignore
[estadisticas,];
var __VLS_11;
const __VLS_14 = Card || Card;
// @ts-ignore
const __VLS_15 = __VLS_asFunctionalComponent1(__VLS_14, new __VLS_14({}));
const __VLS_16 = __VLS_15({}, ...__VLS_functionalComponentArgsRest(__VLS_15));
const { default: __VLS_19 } = __VLS_17.slots;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "text-center" },
});
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "text-2xl font-bold text-blue-600" },
});
/** @type {__VLS_StyleScopedClasses['text-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-blue-600']} */ ;
(__VLS_ctx.estadisticas.internos);
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "text-sm text-gray-600" },
});
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
// @ts-ignore
[estadisticas,];
var __VLS_17;
const __VLS_20 = Card || Card;
// @ts-ignore
const __VLS_21 = __VLS_asFunctionalComponent1(__VLS_20, new __VLS_20({}));
const __VLS_22 = __VLS_21({}, ...__VLS_functionalComponentArgsRest(__VLS_21));
const { default: __VLS_25 } = __VLS_23.slots;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "text-center" },
});
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "text-2xl font-bold text-purple-600" },
});
/** @type {__VLS_StyleScopedClasses['text-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-purple-600']} */ ;
(__VLS_ctx.estadisticas.externos);
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "text-sm text-gray-600" },
});
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
// @ts-ignore
[estadisticas,];
var __VLS_23;
const __VLS_26 = Card || Card;
// @ts-ignore
const __VLS_27 = __VLS_asFunctionalComponent1(__VLS_26, new __VLS_26({}));
const __VLS_28 = __VLS_27({}, ...__VLS_functionalComponentArgsRest(__VLS_27));
const { default: __VLS_31 } = __VLS_29.slots;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "text-center" },
});
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "text-2xl font-bold text-green-600" },
});
/** @type {__VLS_StyleScopedClasses['text-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-green-600']} */ ;
(__VLS_ctx.estadisticas.activos);
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "text-sm text-gray-600" },
});
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
// @ts-ignore
[estadisticas,];
var __VLS_29;
const __VLS_32 = Card || Card;
// @ts-ignore
const __VLS_33 = __VLS_asFunctionalComponent1(__VLS_32, new __VLS_32({}));
const __VLS_34 = __VLS_33({}, ...__VLS_functionalComponentArgsRest(__VLS_33));
const { default: __VLS_37 } = __VLS_35.slots;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "grid grid-cols-1 md:grid-cols-4 gap-4" },
});
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-cols-1']} */ ;
/** @type {__VLS_StyleScopedClasses['md:grid-cols-4']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "md:col-span-2" },
});
/** @type {__VLS_StyleScopedClasses['md:col-span-2']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
    ...{ class: "block text-sm font-medium text-gray-700 mb-1" },
});
/** @type {__VLS_StyleScopedClasses['block']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    value: (__VLS_ctx.filtros.busqueda),
    type: "text",
    placeholder: "Nombre, apellido, email o RU...",
    ...{ class: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" },
});
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-300']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-blue-500']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:border-blue-500']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
    ...{ class: "block text-sm font-medium text-gray-700 mb-1" },
});
/** @type {__VLS_StyleScopedClasses['block']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
    value: (__VLS_ctx.filtros.tipoUsuario),
    ...{ class: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" },
});
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-300']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-blue-500']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:border-blue-500']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "INTERNO",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "EXTERNO",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
    ...{ class: "block text-sm font-medium text-gray-700 mb-1" },
});
/** @type {__VLS_StyleScopedClasses['block']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
    value: (__VLS_ctx.filtros.rol),
    ...{ class: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" },
});
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-300']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-blue-500']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:border-blue-500']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "ADMINISTRADOR",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "COORDINADOR",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "DOCENTE",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "PARTICIPANTE",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "AUXILIAR",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "DISEÑADOR",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "grid grid-cols-1 md:grid-cols-3 gap-4 mt-4" },
});
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-cols-1']} */ ;
/** @type {__VLS_StyleScopedClasses['md:grid-cols-3']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
    ...{ class: "block text-sm font-medium text-gray-700 mb-1" },
});
/** @type {__VLS_StyleScopedClasses['block']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
    value: (__VLS_ctx.filtros.estado),
    ...{ class: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" },
});
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-300']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-blue-500']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:border-blue-500']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "ACTIVO",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "INACTIVO",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
    ...{ class: "block text-sm font-medium text-gray-700 mb-1" },
});
/** @type {__VLS_StyleScopedClasses['block']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
    value: (__VLS_ctx.filtros.emailVerificado),
    ...{ class: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" },
});
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-300']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-blue-500']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:border-blue-500']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "true",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "false",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "flex items-end" },
});
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-end']} */ ;
const __VLS_38 = Button || Button;
// @ts-ignore
const __VLS_39 = __VLS_asFunctionalComponent1(__VLS_38, new __VLS_38({
    ...{ 'onClick': {} },
    variant: "outline",
    ...{ class: "w-full" },
}));
const __VLS_40 = __VLS_39({
    ...{ 'onClick': {} },
    variant: "outline",
    ...{ class: "w-full" },
}, ...__VLS_functionalComponentArgsRest(__VLS_39));
let __VLS_43;
const __VLS_44 = ({ click: {} },
    { onClick: (__VLS_ctx.limpiarFiltros) });
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
const { default: __VLS_45 } = __VLS_41.slots;
__VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
    ...{ class: "w-4 h-4 mr-2" },
    fill: "none",
    stroke: "currentColor",
    viewBox: "0 0 24 24",
});
/** @type {__VLS_StyleScopedClasses['w-4']} */ ;
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
/** @type {__VLS_StyleScopedClasses['mr-2']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.path)({
    'stroke-linecap': "round",
    'stroke-linejoin': "round",
    'stroke-width': "2",
    d: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15",
});
// @ts-ignore
[filtros, filtros, filtros, filtros, filtros, limpiarFiltros,];
var __VLS_41;
var __VLS_42;
// @ts-ignore
[];
var __VLS_35;
const __VLS_46 = Card || Card;
// @ts-ignore
const __VLS_47 = __VLS_asFunctionalComponent1(__VLS_46, new __VLS_46({}));
const __VLS_48 = __VLS_47({}, ...__VLS_functionalComponentArgsRest(__VLS_47));
const { default: __VLS_51 } = __VLS_49.slots;
if (__VLS_ctx.loading) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "text-center py-12" },
    });
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-12']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" },
    });
    /** @type {__VLS_StyleScopedClasses['inline-block']} */ ;
    /** @type {__VLS_StyleScopedClasses['animate-spin']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['h-12']} */ ;
    /** @type {__VLS_StyleScopedClasses['w-12']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-b-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-blue-600']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "mt-4 text-gray-600" },
    });
    /** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
}
else if (__VLS_ctx.usuariosPaginados.length > 0) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "overflow-x-auto" },
    });
    /** @type {__VLS_StyleScopedClasses['overflow-x-auto']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.table, __VLS_intrinsics.table)({
        ...{ class: "w-full" },
    });
    /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.thead, __VLS_intrinsics.thead)({
        ...{ class: "bg-gray-50 border-b border-gray-200" },
    });
    /** @type {__VLS_StyleScopedClasses['bg-gray-50']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-b']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-gray-200']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
        ...{ class: "px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase" },
    });
    /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-left']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
    /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
        ...{ class: "px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase" },
    });
    /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-left']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
    /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
        ...{ class: "px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase" },
    });
    /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-left']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
    /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
        ...{ class: "px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase" },
    });
    /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-left']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
    /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
        ...{ class: "px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase" },
    });
    /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-left']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
    /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
        ...{ class: "px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase" },
    });
    /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-left']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
    /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
        ...{ class: "px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase" },
    });
    /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-left']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
    /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
        ...{ class: "px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase" },
    });
    /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-left']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
    /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.tbody, __VLS_intrinsics.tbody)({
        ...{ class: "divide-y divide-gray-200" },
    });
    /** @type {__VLS_StyleScopedClasses['divide-y']} */ ;
    /** @type {__VLS_StyleScopedClasses['divide-gray-200']} */ ;
    for (const [usuario] of __VLS_vFor((__VLS_ctx.usuariosPaginados))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
            key: (usuario.idUsuario),
            ...{ class: "hover:bg-gray-50" },
        });
        /** @type {__VLS_StyleScopedClasses['hover:bg-gray-50']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "px-4 py-3" },
        });
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "flex items-center space-x-3" },
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['space-x-3']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold" },
        });
        /** @type {__VLS_StyleScopedClasses['w-10']} */ ;
        /** @type {__VLS_StyleScopedClasses['h-10']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-gradient-to-br']} */ ;
        /** @type {__VLS_StyleScopedClasses['from-blue-500']} */ ;
        /** @type {__VLS_StyleScopedClasses['to-purple-600']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        (__VLS_ctx.getInitials(usuario.nombres, usuario.apellidos));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "text-sm font-medium text-gray-800" },
        });
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
        (usuario.nombres);
        (usuario.apellidos);
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "text-xs text-gray-500" },
        });
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
        (usuario.idUsuario);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "px-4 py-3 text-sm text-gray-600" },
        });
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
        (usuario.username);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "px-4 py-3 text-sm text-gray-600" },
        });
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
        (usuario.email);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "px-4 py-3 text-sm" },
        });
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        const __VLS_52 = Badge || Badge;
        // @ts-ignore
        const __VLS_53 = __VLS_asFunctionalComponent1(__VLS_52, new __VLS_52({
            variant: (usuario.tipoUsuario === 'INTERNO' ? 'info' : 'secondary'),
            size: "sm",
        }));
        const __VLS_54 = __VLS_53({
            variant: (usuario.tipoUsuario === 'INTERNO' ? 'info' : 'secondary'),
            size: "sm",
        }, ...__VLS_functionalComponentArgsRest(__VLS_53));
        const { default: __VLS_57 } = __VLS_55.slots;
        (usuario.tipoUsuario);
        // @ts-ignore
        [loading, usuariosPaginados, usuariosPaginados, getInitials,];
        var __VLS_55;
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "px-4 py-3" },
        });
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "flex flex-wrap gap-1" },
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
        for (const [rol] of __VLS_vFor((usuario.roles))) {
            const __VLS_58 = Badge || Badge;
            // @ts-ignore
            const __VLS_59 = __VLS_asFunctionalComponent1(__VLS_58, new __VLS_58({
                key: (rol),
                variant: (__VLS_ctx.getRolBadgeVariant(rol)),
                size: "sm",
            }));
            const __VLS_60 = __VLS_59({
                key: (rol),
                variant: (__VLS_ctx.getRolBadgeVariant(rol)),
                size: "sm",
            }, ...__VLS_functionalComponentArgsRest(__VLS_59));
            const { default: __VLS_63 } = __VLS_61.slots;
            (__VLS_ctx.formatRolName(rol));
            // @ts-ignore
            [getRolBadgeVariant, formatRolName,];
            var __VLS_61;
            // @ts-ignore
            [];
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!(__VLS_ctx.usuariosPaginados.length > 0))
                        return;
                    __VLS_ctx.openRolesModal(usuario);
                    // @ts-ignore
                    [openRolesModal,];
                } },
            ...{ class: "text-xs text-blue-600 hover:text-blue-800 underline" },
        });
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-blue-600']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:text-blue-800']} */ ;
        /** @type {__VLS_StyleScopedClasses['underline']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "px-4 py-3 text-sm" },
        });
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        const __VLS_64 = Badge || Badge;
        // @ts-ignore
        const __VLS_65 = __VLS_asFunctionalComponent1(__VLS_64, new __VLS_64({
            variant: (usuario.estado === 'ACTIVO' ? 'success' : 'gray'),
            size: "sm",
        }));
        const __VLS_66 = __VLS_65({
            variant: (usuario.estado === 'ACTIVO' ? 'success' : 'gray'),
            size: "sm",
        }, ...__VLS_functionalComponentArgsRest(__VLS_65));
        const { default: __VLS_69 } = __VLS_67.slots;
        (usuario.estado);
        // @ts-ignore
        [];
        var __VLS_67;
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "px-4 py-3 text-sm text-center" },
        });
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
        if (usuario.emailVerificado) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "text-green-600" },
            });
            /** @type {__VLS_StyleScopedClasses['text-green-600']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
                ...{ class: "w-5 h-5 inline" },
                fill: "currentColor",
                viewBox: "0 0 20 20",
            });
            /** @type {__VLS_StyleScopedClasses['w-5']} */ ;
            /** @type {__VLS_StyleScopedClasses['h-5']} */ ;
            /** @type {__VLS_StyleScopedClasses['inline']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
                'fill-rule': "evenodd",
                d: "M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z",
                'clip-rule': "evenodd",
            });
        }
        else {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "text-gray-400" },
            });
            /** @type {__VLS_StyleScopedClasses['text-gray-400']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
                ...{ class: "w-5 h-5 inline" },
                fill: "currentColor",
                viewBox: "0 0 20 20",
            });
            /** @type {__VLS_StyleScopedClasses['w-5']} */ ;
            /** @type {__VLS_StyleScopedClasses['h-5']} */ ;
            /** @type {__VLS_StyleScopedClasses['inline']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
                'fill-rule': "evenodd",
                d: "M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z",
                'clip-rule': "evenodd",
            });
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "px-4 py-3" },
        });
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
        const __VLS_70 = Button || Button;
        // @ts-ignore
        const __VLS_71 = __VLS_asFunctionalComponent1(__VLS_70, new __VLS_70({
            ...{ 'onClick': {} },
            variant: "ghost",
            size: "sm",
            title: "Acciones",
        }));
        const __VLS_72 = __VLS_71({
            ...{ 'onClick': {} },
            variant: "ghost",
            size: "sm",
            title: "Acciones",
        }, ...__VLS_functionalComponentArgsRest(__VLS_71));
        let __VLS_75;
        const __VLS_76 = ({ click: {} },
            { onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!(__VLS_ctx.usuariosPaginados.length > 0))
                        return;
                    __VLS_ctx.openAccionesModal(usuario);
                    // @ts-ignore
                    [openAccionesModal,];
                } });
        const { default: __VLS_77 } = __VLS_73.slots;
        __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
            ...{ class: "w-5 h-5" },
            fill: "currentColor",
            viewBox: "0 0 20 20",
        });
        /** @type {__VLS_StyleScopedClasses['w-5']} */ ;
        /** @type {__VLS_StyleScopedClasses['h-5']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
            d: "M10 3a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm0 5.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm0 5.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3z",
        });
        // @ts-ignore
        [];
        var __VLS_73;
        var __VLS_74;
        // @ts-ignore
        [];
    }
}
if (__VLS_ctx.totalItems > 0) {
    const __VLS_78 = Pagination;
    // @ts-ignore
    const __VLS_79 = __VLS_asFunctionalComponent1(__VLS_78, new __VLS_78({
        ...{ 'onUpdate:currentPage': {} },
        ...{ 'onUpdate:pageSize': {} },
        currentPage: (__VLS_ctx.currentPage),
        totalItems: (__VLS_ctx.totalItems),
        pageSize: (__VLS_ctx.pageSize),
        showPageSizeSelector: (true),
    }));
    const __VLS_80 = __VLS_79({
        ...{ 'onUpdate:currentPage': {} },
        ...{ 'onUpdate:pageSize': {} },
        currentPage: (__VLS_ctx.currentPage),
        totalItems: (__VLS_ctx.totalItems),
        pageSize: (__VLS_ctx.pageSize),
        showPageSizeSelector: (true),
    }, ...__VLS_functionalComponentArgsRest(__VLS_79));
    let __VLS_83;
    const __VLS_84 = ({ 'update:currentPage': {} },
        { 'onUpdate:currentPage': (__VLS_ctx.goToPage) });
    const __VLS_85 = ({ 'update:pageSize': {} },
        { 'onUpdate:pageSize': (__VLS_ctx.setPageSize) });
    var __VLS_81;
    var __VLS_82;
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "text-center py-12" },
    });
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-12']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
        ...{ class: "w-16 h-16 mx-auto text-gray-400 mb-4" },
        fill: "none",
        stroke: "currentColor",
        viewBox: "0 0 24 24",
    });
    /** @type {__VLS_StyleScopedClasses['w-16']} */ ;
    /** @type {__VLS_StyleScopedClasses['h-16']} */ ;
    /** @type {__VLS_StyleScopedClasses['mx-auto']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-400']} */ ;
    /** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
        'stroke-linecap': "round",
        'stroke-linejoin': "round",
        'stroke-width': "2",
        d: "M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-gray-600" },
    });
    /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
}
// @ts-ignore
[totalItems, totalItems, currentPage, pageSize, goToPage, setPageSize,];
var __VLS_49;
const __VLS_86 = Modal || Modal;
// @ts-ignore
const __VLS_87 = __VLS_asFunctionalComponent1(__VLS_86, new __VLS_86({
    ...{ 'onClose': {} },
    modelValue: (__VLS_ctx.showAccionesModal),
    title: "Acciones",
}));
const __VLS_88 = __VLS_87({
    ...{ 'onClose': {} },
    modelValue: (__VLS_ctx.showAccionesModal),
    title: "Acciones",
}, ...__VLS_functionalComponentArgsRest(__VLS_87));
let __VLS_91;
const __VLS_92 = ({ close: {} },
    { onClose: (__VLS_ctx.closeAccionesModal) });
const { default: __VLS_93 } = __VLS_89.slots;
if (__VLS_ctx.usuarioSeleccionado) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "space-y-4" },
    });
    /** @type {__VLS_StyleScopedClasses['space-y-4']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "bg-gray-50 p-4 rounded-lg" },
    });
    /** @type {__VLS_StyleScopedClasses['bg-gray-50']} */ ;
    /** @type {__VLS_StyleScopedClasses['p-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-sm text-gray-600" },
    });
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "font-semibold text-gray-800" },
    });
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
    (__VLS_ctx.usuarioSeleccionado.nombres);
    (__VLS_ctx.usuarioSeleccionado.apellidos);
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-xs text-gray-500" },
    });
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
    (__VLS_ctx.usuarioSeleccionado.username);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "grid grid-cols-1 gap-2" },
    });
    /** @type {__VLS_StyleScopedClasses['grid']} */ ;
    /** @type {__VLS_StyleScopedClasses['grid-cols-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
    const __VLS_94 = Button || Button;
    // @ts-ignore
    const __VLS_95 = __VLS_asFunctionalComponent1(__VLS_94, new __VLS_94({
        ...{ 'onClick': {} },
        variant: "primary",
    }));
    const __VLS_96 = __VLS_95({
        ...{ 'onClick': {} },
        variant: "primary",
    }, ...__VLS_functionalComponentArgsRest(__VLS_95));
    let __VLS_99;
    const __VLS_100 = ({ click: {} },
        { onClick: (...[$event]) => {
                if (!(__VLS_ctx.usuarioSeleccionado))
                    return;
                __VLS_ctx.ejecutarAccionUsuario(__VLS_ctx.openEditModal);
                // @ts-ignore
                [showAccionesModal, closeAccionesModal, usuarioSeleccionado, usuarioSeleccionado, usuarioSeleccionado, usuarioSeleccionado, ejecutarAccionUsuario, openEditModal,];
            } });
    const { default: __VLS_101 } = __VLS_97.slots;
    // @ts-ignore
    [];
    var __VLS_97;
    var __VLS_98;
    if (__VLS_ctx.usuarioSeleccionado.roles.includes('COORDINADOR')) {
        const __VLS_102 = Button || Button;
        // @ts-ignore
        const __VLS_103 = __VLS_asFunctionalComponent1(__VLS_102, new __VLS_102({
            ...{ 'onClick': {} },
            variant: "secondary",
        }));
        const __VLS_104 = __VLS_103({
            ...{ 'onClick': {} },
            variant: "secondary",
        }, ...__VLS_functionalComponentArgsRest(__VLS_103));
        let __VLS_107;
        const __VLS_108 = ({ click: {} },
            { onClick: (...[$event]) => {
                    if (!(__VLS_ctx.usuarioSeleccionado))
                        return;
                    if (!(__VLS_ctx.usuarioSeleccionado.roles.includes('COORDINADOR')))
                        return;
                    __VLS_ctx.ejecutarAccionUsuario(__VLS_ctx.openCarrerasModal);
                    // @ts-ignore
                    [usuarioSeleccionado, ejecutarAccionUsuario, openCarrerasModal,];
                } });
        const { default: __VLS_109 } = __VLS_105.slots;
        // @ts-ignore
        [];
        var __VLS_105;
        var __VLS_106;
    }
    if (__VLS_ctx.usuarioSeleccionado.roles.includes('DOCENTE')) {
        const __VLS_110 = Button || Button;
        // @ts-ignore
        const __VLS_111 = __VLS_asFunctionalComponent1(__VLS_110, new __VLS_110({
            ...{ 'onClick': {} },
            variant: "outline",
        }));
        const __VLS_112 = __VLS_111({
            ...{ 'onClick': {} },
            variant: "outline",
        }, ...__VLS_functionalComponentArgsRest(__VLS_111));
        let __VLS_115;
        const __VLS_116 = ({ click: {} },
            { onClick: (...[$event]) => {
                    if (!(__VLS_ctx.usuarioSeleccionado))
                        return;
                    if (!(__VLS_ctx.usuarioSeleccionado.roles.includes('DOCENTE')))
                        return;
                    __VLS_ctx.ejecutarAccionUsuario((u) => __VLS_ctx.openActividadesModal(u, 'DOCENTE'));
                    // @ts-ignore
                    [usuarioSeleccionado, ejecutarAccionUsuario, openActividadesModal,];
                } });
        const { default: __VLS_117 } = __VLS_113.slots;
        // @ts-ignore
        [];
        var __VLS_113;
        var __VLS_114;
    }
    if (__VLS_ctx.usuarioSeleccionado.roles.includes('AUXILIAR')) {
        const __VLS_118 = Button || Button;
        // @ts-ignore
        const __VLS_119 = __VLS_asFunctionalComponent1(__VLS_118, new __VLS_118({
            ...{ 'onClick': {} },
            variant: "outline",
        }));
        const __VLS_120 = __VLS_119({
            ...{ 'onClick': {} },
            variant: "outline",
        }, ...__VLS_functionalComponentArgsRest(__VLS_119));
        let __VLS_123;
        const __VLS_124 = ({ click: {} },
            { onClick: (...[$event]) => {
                    if (!(__VLS_ctx.usuarioSeleccionado))
                        return;
                    if (!(__VLS_ctx.usuarioSeleccionado.roles.includes('AUXILIAR')))
                        return;
                    __VLS_ctx.ejecutarAccionUsuario((u) => __VLS_ctx.openActividadesModal(u, 'AUXILIAR'));
                    // @ts-ignore
                    [usuarioSeleccionado, ejecutarAccionUsuario, openActividadesModal,];
                } });
        const { default: __VLS_125 } = __VLS_121.slots;
        // @ts-ignore
        [];
        var __VLS_121;
        var __VLS_122;
    }
    if (__VLS_ctx.usuarioSeleccionado.tipoUsuario === 'EXTERNO') {
        const __VLS_126 = Button || Button;
        // @ts-ignore
        const __VLS_127 = __VLS_asFunctionalComponent1(__VLS_126, new __VLS_126({
            ...{ 'onClick': {} },
            variant: "ghost",
        }));
        const __VLS_128 = __VLS_127({
            ...{ 'onClick': {} },
            variant: "ghost",
        }, ...__VLS_functionalComponentArgsRest(__VLS_127));
        let __VLS_131;
        const __VLS_132 = ({ click: {} },
            { onClick: (...[$event]) => {
                    if (!(__VLS_ctx.usuarioSeleccionado))
                        return;
                    if (!(__VLS_ctx.usuarioSeleccionado.tipoUsuario === 'EXTERNO'))
                        return;
                    __VLS_ctx.ejecutarAccionUsuario(__VLS_ctx.openPasswordModal);
                    // @ts-ignore
                    [usuarioSeleccionado, ejecutarAccionUsuario, openPasswordModal,];
                } });
        const { default: __VLS_133 } = __VLS_129.slots;
        // @ts-ignore
        [];
        var __VLS_129;
        var __VLS_130;
    }
    const __VLS_134 = Button || Button;
    // @ts-ignore
    const __VLS_135 = __VLS_asFunctionalComponent1(__VLS_134, new __VLS_134({
        ...{ 'onClick': {} },
        variant: (__VLS_ctx.usuarioSeleccionado.estado === 'ACTIVO' ? 'danger' : 'success'),
    }));
    const __VLS_136 = __VLS_135({
        ...{ 'onClick': {} },
        variant: (__VLS_ctx.usuarioSeleccionado.estado === 'ACTIVO' ? 'danger' : 'success'),
    }, ...__VLS_functionalComponentArgsRest(__VLS_135));
    let __VLS_139;
    const __VLS_140 = ({ click: {} },
        { onClick: (...[$event]) => {
                if (!(__VLS_ctx.usuarioSeleccionado))
                    return;
                __VLS_ctx.ejecutarAccionUsuario(__VLS_ctx.toggleEstadoUsuario);
                // @ts-ignore
                [usuarioSeleccionado, ejecutarAccionUsuario, toggleEstadoUsuario,];
            } });
    const { default: __VLS_141 } = __VLS_137.slots;
    (__VLS_ctx.usuarioSeleccionado.estado === 'ACTIVO' ? 'Desactivar usuario' : 'Activar usuario');
    // @ts-ignore
    [usuarioSeleccionado,];
    var __VLS_137;
    var __VLS_138;
}
// @ts-ignore
[];
var __VLS_89;
var __VLS_90;
const __VLS_142 = Modal || Modal;
// @ts-ignore
const __VLS_143 = __VLS_asFunctionalComponent1(__VLS_142, new __VLS_142({
    ...{ 'onClose': {} },
    modelValue: (__VLS_ctx.showUsuarioModal),
    title: (__VLS_ctx.modoEdicion ? 'Editar Usuario' : 'Crear Usuario Externo'),
}));
const __VLS_144 = __VLS_143({
    ...{ 'onClose': {} },
    modelValue: (__VLS_ctx.showUsuarioModal),
    title: (__VLS_ctx.modoEdicion ? 'Editar Usuario' : 'Crear Usuario Externo'),
}, ...__VLS_functionalComponentArgsRest(__VLS_143));
let __VLS_147;
const __VLS_148 = ({ close: {} },
    { onClose: (__VLS_ctx.closeUsuarioModal) });
const { default: __VLS_149 } = __VLS_145.slots;
__VLS_asFunctionalElement1(__VLS_intrinsics.form, __VLS_intrinsics.form)({
    ...{ onSubmit: (__VLS_ctx.submitUsuario) },
    ...{ class: "space-y-4" },
});
/** @type {__VLS_StyleScopedClasses['space-y-4']} */ ;
if (!__VLS_ctx.modoEdicion) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "bg-blue-50 border border-blue-200 rounded-lg p-3" },
    });
    /** @type {__VLS_StyleScopedClasses['bg-blue-50']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-blue-200']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['p-3']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-sm text-blue-800" },
    });
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-blue-800']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
}
else if (__VLS_ctx.modoEdicion && __VLS_ctx.formUsuario.tipoUsuario === 'INTERNO') {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "bg-amber-50 border border-amber-200 rounded-lg p-3" },
    });
    /** @type {__VLS_StyleScopedClasses['bg-amber-50']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-amber-200']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['p-3']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-sm text-amber-800" },
    });
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-amber-800']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
    ...{ class: "block text-sm font-medium text-gray-700 mb-1" },
});
/** @type {__VLS_StyleScopedClasses['block']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
(__VLS_ctx.formUsuario.tipoUsuario === 'INTERNO' ? 'RU' : 'Username');
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "text-red-600" },
});
/** @type {__VLS_StyleScopedClasses['text-red-600']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    value: (__VLS_ctx.formUsuario.username),
    type: "text",
    required: true,
    readonly: (__VLS_ctx.modoEdicion),
    placeholder: (__VLS_ctx.formUsuario.tipoUsuario === 'INTERNO' ? 'Ej: 202012345' : 'Ej: jperez'),
    ...{ class: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-100" },
});
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-300']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-blue-500']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:border-blue-500']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-gray-100']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
    ...{ class: "block text-sm font-medium text-gray-700 mb-1" },
});
/** @type {__VLS_StyleScopedClasses['block']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "text-red-600" },
});
/** @type {__VLS_StyleScopedClasses['text-red-600']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    value: (__VLS_ctx.formUsuario.nombres),
    type: "text",
    required: true,
    placeholder: "Ej: Juan Carlos",
    ...{ class: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" },
});
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-300']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-blue-500']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:border-blue-500']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
    ...{ class: "block text-sm font-medium text-gray-700 mb-1" },
});
/** @type {__VLS_StyleScopedClasses['block']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "text-red-600" },
});
/** @type {__VLS_StyleScopedClasses['text-red-600']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    value: (__VLS_ctx.formUsuario.apellidos),
    type: "text",
    required: true,
    placeholder: "Ej: Pérez López",
    ...{ class: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" },
});
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-300']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-blue-500']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:border-blue-500']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
    ...{ class: "block text-sm font-medium text-gray-700 mb-1" },
});
/** @type {__VLS_StyleScopedClasses['block']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "text-red-600" },
});
/** @type {__VLS_StyleScopedClasses['text-red-600']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    type: "email",
    required: true,
    readonly: (__VLS_ctx.modoEdicion && __VLS_ctx.formUsuario.tipoUsuario === 'INTERNO'),
    placeholder: "Ej: juan.perez@ejemplo.com",
    ...{ class: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" },
    ...{ class: ({ 'bg-gray-100': __VLS_ctx.modoEdicion && __VLS_ctx.formUsuario.tipoUsuario === 'INTERNO' }) },
});
(__VLS_ctx.formUsuario.email);
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-300']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-blue-500']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:border-blue-500']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-gray-100']} */ ;
if (!__VLS_ctx.modoEdicion && __VLS_ctx.formUsuario.tipoUsuario === 'EXTERNO') {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ class: "block text-sm font-medium text-gray-700 mb-1" },
    });
    /** @type {__VLS_StyleScopedClasses['block']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
    /** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "text-red-600" },
    });
    /** @type {__VLS_StyleScopedClasses['text-red-600']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "password",
        required: true,
        placeholder: "Mínimo 6 caracteres",
        minlength: "6",
        ...{ class: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" },
    });
    (__VLS_ctx.formUsuario.password);
    /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-gray-300']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus:ring-blue-500']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus:border-blue-500']} */ ;
}
if (__VLS_ctx.modoEdicion && __VLS_ctx.formUsuario.tipoUsuario === 'EXTERNO') {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ class: "block text-sm font-medium text-gray-700 mb-1" },
    });
    /** @type {__VLS_StyleScopedClasses['block']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
    /** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        value: (__VLS_ctx.formUsuario.estado),
        ...{ class: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" },
    });
    /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-gray-300']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus:ring-blue-500']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus:border-blue-500']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "ACTIVO",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "INACTIVO",
    });
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "flex justify-end space-x-3 pt-4 border-t" },
});
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-end']} */ ;
/** @type {__VLS_StyleScopedClasses['space-x-3']} */ ;
/** @type {__VLS_StyleScopedClasses['pt-4']} */ ;
/** @type {__VLS_StyleScopedClasses['border-t']} */ ;
const __VLS_150 = Button || Button;
// @ts-ignore
const __VLS_151 = __VLS_asFunctionalComponent1(__VLS_150, new __VLS_150({
    ...{ 'onClick': {} },
    type: "button",
    variant: "outline",
}));
const __VLS_152 = __VLS_151({
    ...{ 'onClick': {} },
    type: "button",
    variant: "outline",
}, ...__VLS_functionalComponentArgsRest(__VLS_151));
let __VLS_155;
const __VLS_156 = ({ click: {} },
    { onClick: (__VLS_ctx.closeUsuarioModal) });
const { default: __VLS_157 } = __VLS_153.slots;
// @ts-ignore
[showUsuarioModal, modoEdicion, modoEdicion, modoEdicion, modoEdicion, modoEdicion, modoEdicion, modoEdicion, modoEdicion, closeUsuarioModal, closeUsuarioModal, submitUsuario, formUsuario, formUsuario, formUsuario, formUsuario, formUsuario, formUsuario, formUsuario, formUsuario, formUsuario, formUsuario, formUsuario, formUsuario, formUsuario,];
var __VLS_153;
var __VLS_154;
const __VLS_158 = Button || Button;
// @ts-ignore
const __VLS_159 = __VLS_asFunctionalComponent1(__VLS_158, new __VLS_158({
    type: "submit",
    disabled: (__VLS_ctx.saving),
}));
const __VLS_160 = __VLS_159({
    type: "submit",
    disabled: (__VLS_ctx.saving),
}, ...__VLS_functionalComponentArgsRest(__VLS_159));
const { default: __VLS_163 } = __VLS_161.slots;
(__VLS_ctx.saving ? 'Guardando...' : (__VLS_ctx.modoEdicion ? 'Actualizar' : 'Crear'));
// @ts-ignore
[modoEdicion, saving, saving,];
var __VLS_161;
// @ts-ignore
[];
var __VLS_145;
var __VLS_146;
const __VLS_164 = Modal || Modal;
// @ts-ignore
const __VLS_165 = __VLS_asFunctionalComponent1(__VLS_164, new __VLS_164({
    ...{ 'onClose': {} },
    modelValue: (__VLS_ctx.showCarrerasModal),
    title: "Gestionar Carreras",
}));
const __VLS_166 = __VLS_165({
    ...{ 'onClose': {} },
    modelValue: (__VLS_ctx.showCarrerasModal),
    title: "Gestionar Carreras",
}, ...__VLS_functionalComponentArgsRest(__VLS_165));
let __VLS_169;
const __VLS_170 = ({ close: {} },
    { onClose: (__VLS_ctx.closeCarrerasModal) });
const { default: __VLS_171 } = __VLS_167.slots;
if (__VLS_ctx.usuarioSeleccionado) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "space-y-4" },
    });
    /** @type {__VLS_StyleScopedClasses['space-y-4']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "bg-gray-50 p-4 rounded-lg" },
    });
    /** @type {__VLS_StyleScopedClasses['bg-gray-50']} */ ;
    /** @type {__VLS_StyleScopedClasses['p-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-sm text-gray-600" },
    });
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "font-semibold text-gray-800" },
    });
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
    (__VLS_ctx.usuarioSeleccionado.nombres);
    (__VLS_ctx.usuarioSeleccionado.apellidos);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex gap-2 mt-2" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
    for (const [rol] of __VLS_vFor((__VLS_ctx.usuarioSeleccionado.roles.filter(r => ['COORDINADOR', 'DOCENTE'].includes(r))))) {
        const __VLS_172 = Badge || Badge;
        // @ts-ignore
        const __VLS_173 = __VLS_asFunctionalComponent1(__VLS_172, new __VLS_172({
            key: (rol),
            variant: (__VLS_ctx.getRolBadgeVariant(rol)),
            size: "sm",
        }));
        const __VLS_174 = __VLS_173({
            key: (rol),
            variant: (__VLS_ctx.getRolBadgeVariant(rol)),
            size: "sm",
        }, ...__VLS_functionalComponentArgsRest(__VLS_173));
        const { default: __VLS_177 } = __VLS_175.slots;
        (__VLS_ctx.formatRolName(rol));
        // @ts-ignore
        [getRolBadgeVariant, formatRolName, usuarioSeleccionado, usuarioSeleccionado, usuarioSeleccionado, usuarioSeleccionado, showCarrerasModal, closeCarrerasModal,];
        var __VLS_175;
        // @ts-ignore
        [];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ class: "block text-sm font-medium text-gray-700 mb-3" },
    });
    /** @type {__VLS_StyleScopedClasses['block']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
    /** @type {__VLS_StyleScopedClasses['mb-3']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "space-y-2" },
    });
    /** @type {__VLS_StyleScopedClasses['space-y-2']} */ ;
    for (const [carrera] of __VLS_vFor((__VLS_ctx.carreras))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
            key: (carrera.idCarrera),
            ...{ class: "flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer" },
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['p-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:bg-gray-50']} */ ;
        /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            type: "checkbox",
            value: (carrera.idCarrera),
            ...{ class: "w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500" },
        });
        (__VLS_ctx.carrerasSeleccionadas);
        /** @type {__VLS_StyleScopedClasses['w-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['h-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-blue-600']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus:ring-blue-500']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "ml-3 flex-1" },
        });
        /** @type {__VLS_StyleScopedClasses['ml-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "font-medium text-gray-800" },
        });
        /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
        (carrera.nombre);
        // @ts-ignore
        [carreras, carrerasSeleccionadas,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "bg-blue-50 border border-blue-200 rounded-lg p-3" },
    });
    /** @type {__VLS_StyleScopedClasses['bg-blue-50']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-blue-200']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['p-3']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-sm text-blue-800" },
    });
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-blue-800']} */ ;
    if (__VLS_ctx.usuarioSeleccionado.roles.includes('COORDINADOR')) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    }
    (__VLS_ctx.usuarioSeleccionado.roles.includes('COORDINADOR')
        ? 'Solo podrán gestionar actividades de las carreras seleccionadas.'
        : 'Podrán dar clases en cursos/eventos de las carreras seleccionadas.');
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex justify-end space-x-3 pt-4 border-t" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-end']} */ ;
    /** @type {__VLS_StyleScopedClasses['space-x-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['pt-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-t']} */ ;
    const __VLS_178 = Button || Button;
    // @ts-ignore
    const __VLS_179 = __VLS_asFunctionalComponent1(__VLS_178, new __VLS_178({
        ...{ 'onClick': {} },
        type: "button",
        variant: "outline",
    }));
    const __VLS_180 = __VLS_179({
        ...{ 'onClick': {} },
        type: "button",
        variant: "outline",
    }, ...__VLS_functionalComponentArgsRest(__VLS_179));
    let __VLS_183;
    const __VLS_184 = ({ click: {} },
        { onClick: (__VLS_ctx.closeCarrerasModal) });
    const { default: __VLS_185 } = __VLS_181.slots;
    // @ts-ignore
    [usuarioSeleccionado, usuarioSeleccionado, closeCarrerasModal,];
    var __VLS_181;
    var __VLS_182;
    const __VLS_186 = Button || Button;
    // @ts-ignore
    const __VLS_187 = __VLS_asFunctionalComponent1(__VLS_186, new __VLS_186({
        ...{ 'onClick': {} },
        disabled: (__VLS_ctx.saving),
    }));
    const __VLS_188 = __VLS_187({
        ...{ 'onClick': {} },
        disabled: (__VLS_ctx.saving),
    }, ...__VLS_functionalComponentArgsRest(__VLS_187));
    let __VLS_191;
    const __VLS_192 = ({ click: {} },
        { onClick: (__VLS_ctx.guardarCarreras) });
    const { default: __VLS_193 } = __VLS_189.slots;
    (__VLS_ctx.saving ? 'Guardando...' : 'Guardar Carreras');
    // @ts-ignore
    [saving, saving, guardarCarreras,];
    var __VLS_189;
    var __VLS_190;
}
// @ts-ignore
[];
var __VLS_167;
var __VLS_168;
const __VLS_194 = Modal || Modal;
// @ts-ignore
const __VLS_195 = __VLS_asFunctionalComponent1(__VLS_194, new __VLS_194({
    ...{ 'onClose': {} },
    modelValue: (__VLS_ctx.showActividadesModal),
    title: (__VLS_ctx.tipoGestionActividades === 'DOCENTE'
        ? 'Asignar Cursos/Paralelos a Docente'
        : 'Asignar Eventos a Auxiliar'),
}));
const __VLS_196 = __VLS_195({
    ...{ 'onClose': {} },
    modelValue: (__VLS_ctx.showActividadesModal),
    title: (__VLS_ctx.tipoGestionActividades === 'DOCENTE'
        ? 'Asignar Cursos/Paralelos a Docente'
        : 'Asignar Eventos a Auxiliar'),
}, ...__VLS_functionalComponentArgsRest(__VLS_195));
let __VLS_199;
const __VLS_200 = ({ close: {} },
    { onClose: (__VLS_ctx.closeActividadesModal) });
const { default: __VLS_201 } = __VLS_197.slots;
if (__VLS_ctx.usuarioSeleccionado) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "space-y-4" },
    });
    /** @type {__VLS_StyleScopedClasses['space-y-4']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "bg-gray-50 p-4 rounded-lg" },
    });
    /** @type {__VLS_StyleScopedClasses['bg-gray-50']} */ ;
    /** @type {__VLS_StyleScopedClasses['p-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex items-center justify-between" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-sm text-gray-600" },
    });
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
    (__VLS_ctx.tipoGestionActividades === 'DOCENTE' ? 'Docente:' : 'Auxiliar:');
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "font-semibold text-gray-800" },
    });
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
    (__VLS_ctx.usuarioSeleccionado.nombres);
    (__VLS_ctx.usuarioSeleccionado.apellidos);
    const __VLS_202 = Badge || Badge;
    // @ts-ignore
    const __VLS_203 = __VLS_asFunctionalComponent1(__VLS_202, new __VLS_202({
        variant: (__VLS_ctx.tipoGestionActividades === 'DOCENTE' ? 'info' : 'secondary'),
        size: "lg",
    }));
    const __VLS_204 = __VLS_203({
        variant: (__VLS_ctx.tipoGestionActividades === 'DOCENTE' ? 'info' : 'secondary'),
        size: "lg",
    }, ...__VLS_functionalComponentArgsRest(__VLS_203));
    const { default: __VLS_207 } = __VLS_205.slots;
    (__VLS_ctx.tipoGestionActividades);
    // @ts-ignore
    [usuarioSeleccionado, usuarioSeleccionado, usuarioSeleccionado, showActividadesModal, tipoGestionActividades, tipoGestionActividades, tipoGestionActividades, tipoGestionActividades, closeActividadesModal,];
    var __VLS_205;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b" },
    });
    /** @type {__VLS_StyleScopedClasses['grid']} */ ;
    /** @type {__VLS_StyleScopedClasses['grid-cols-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['md:grid-cols-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['pb-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-b']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ class: "block text-sm font-medium text-gray-700 mb-1" },
    });
    /** @type {__VLS_StyleScopedClasses['block']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
    /** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        value: (__VLS_ctx.filtroCarreraActividades),
        ...{ class: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" },
    });
    /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-gray-300']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus:ring-blue-500']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus:border-blue-500']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "",
    });
    for (const [carrera] of __VLS_vFor((__VLS_ctx.carreras))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            key: (carrera.idCarrera),
            value: (carrera.idCarrera),
        });
        (carrera.nombre);
        // @ts-ignore
        [carreras, filtroCarreraActividades,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ class: "block text-sm font-medium text-gray-700 mb-1" },
    });
    /** @type {__VLS_StyleScopedClasses['block']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
    /** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        value: (__VLS_ctx.filtroBusquedaActividades),
        type: "text",
        placeholder: (__VLS_ctx.tipoGestionActividades === 'DOCENTE' ? 'Nombre de curso...' : 'Nombre de evento...'),
        ...{ class: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" },
    });
    /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-gray-300']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus:ring-blue-500']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus:border-blue-500']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "max-h-96 overflow-y-auto" },
    });
    /** @type {__VLS_StyleScopedClasses['max-h-96']} */ ;
    /** @type {__VLS_StyleScopedClasses['overflow-y-auto']} */ ;
    if (__VLS_ctx.tipoGestionActividades === 'DOCENTE') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "space-y-2" },
        });
        /** @type {__VLS_StyleScopedClasses['space-y-2']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
            ...{ class: "block text-sm font-medium text-gray-700 mb-3" },
        });
        /** @type {__VLS_StyleScopedClasses['block']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
        /** @type {__VLS_StyleScopedClasses['mb-3']} */ ;
        if (__VLS_ctx.paralelosFiltrados.length === 0) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "text-center py-8 text-gray-500" },
            });
            /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-8']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
                ...{ class: "w-12 h-12 mx-auto mb-3 text-gray-400" },
                fill: "none",
                stroke: "currentColor",
                viewBox: "0 0 24 24",
            });
            /** @type {__VLS_StyleScopedClasses['w-12']} */ ;
            /** @type {__VLS_StyleScopedClasses['h-12']} */ ;
            /** @type {__VLS_StyleScopedClasses['mx-auto']} */ ;
            /** @type {__VLS_StyleScopedClasses['mb-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-gray-400']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
                'stroke-linecap': "round",
                'stroke-linejoin': "round",
                'stroke-width': "2",
                d: "M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
        }
        for (const [paralelo] of __VLS_vFor((__VLS_ctx.paralelosFiltrados))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
                key: (paralelo.idParalelo),
                ...{ class: "flex items-start p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors" },
            });
            /** @type {__VLS_StyleScopedClasses['flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['items-start']} */ ;
            /** @type {__VLS_StyleScopedClasses['p-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['border']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
            /** @type {__VLS_StyleScopedClasses['hover:bg-gray-50']} */ ;
            /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
            /** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                type: "checkbox",
                value: (paralelo.idParalelo),
                ...{ class: "w-4 h-4 mt-1 text-blue-600 rounded focus:ring-2 focus:ring-blue-500" },
            });
            (__VLS_ctx.paralelosSeleccionados);
            /** @type {__VLS_StyleScopedClasses['w-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['h-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-blue-600']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            /** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['focus:ring-blue-500']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "ml-3 flex-1" },
            });
            /** @type {__VLS_StyleScopedClasses['ml-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "font-medium text-gray-800" },
            });
            /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
            (paralelo.actividadNombre);
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "text-gray-600" },
            });
            /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
            (paralelo.codigo);
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "flex gap-2 mt-1" },
            });
            /** @type {__VLS_StyleScopedClasses['flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
            const __VLS_208 = Badge || Badge;
            // @ts-ignore
            const __VLS_209 = __VLS_asFunctionalComponent1(__VLS_208, new __VLS_208({
                variant: "primary",
                size: "sm",
            }));
            const __VLS_210 = __VLS_209({
                variant: "primary",
                size: "sm",
            }, ...__VLS_functionalComponentArgsRest(__VLS_209));
            const { default: __VLS_213 } = __VLS_211.slots;
            // @ts-ignore
            [tipoGestionActividades, tipoGestionActividades, filtroBusquedaActividades, paralelosFiltrados, paralelosFiltrados, paralelosSeleccionados,];
            var __VLS_211;
            const __VLS_214 = Badge || Badge;
            // @ts-ignore
            const __VLS_215 = __VLS_asFunctionalComponent1(__VLS_214, new __VLS_214({
                variant: "info",
                size: "sm",
            }));
            const __VLS_216 = __VLS_215({
                variant: "info",
                size: "sm",
            }, ...__VLS_functionalComponentArgsRest(__VLS_215));
            const { default: __VLS_219 } = __VLS_217.slots;
            (paralelo.carreraNombre);
            // @ts-ignore
            [];
            var __VLS_217;
            // @ts-ignore
            [];
        }
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "space-y-2" },
        });
        /** @type {__VLS_StyleScopedClasses['space-y-2']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
            ...{ class: "block text-sm font-medium text-gray-700 mb-3" },
        });
        /** @type {__VLS_StyleScopedClasses['block']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
        /** @type {__VLS_StyleScopedClasses['mb-3']} */ ;
        if (__VLS_ctx.actividadesFiltradas.length === 0) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "text-center py-8 text-gray-500" },
            });
            /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-8']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
                ...{ class: "w-12 h-12 mx-auto mb-3 text-gray-400" },
                fill: "none",
                stroke: "currentColor",
                viewBox: "0 0 24 24",
            });
            /** @type {__VLS_StyleScopedClasses['w-12']} */ ;
            /** @type {__VLS_StyleScopedClasses['h-12']} */ ;
            /** @type {__VLS_StyleScopedClasses['mx-auto']} */ ;
            /** @type {__VLS_StyleScopedClasses['mb-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-gray-400']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
                'stroke-linecap': "round",
                'stroke-linejoin': "round",
                'stroke-width': "2",
                d: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
        }
        for (const [actividad] of __VLS_vFor((__VLS_ctx.actividadesFiltradas))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
                key: (actividad.idActividad),
                ...{ class: "flex items-start p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors" },
            });
            /** @type {__VLS_StyleScopedClasses['flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['items-start']} */ ;
            /** @type {__VLS_StyleScopedClasses['p-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['border']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
            /** @type {__VLS_StyleScopedClasses['hover:bg-gray-50']} */ ;
            /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
            /** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                type: "checkbox",
                value: (actividad.idActividad),
                ...{ class: "w-4 h-4 mt-1 text-blue-600 rounded focus:ring-2 focus:ring-blue-500" },
            });
            (__VLS_ctx.actividadesSeleccionadas);
            /** @type {__VLS_StyleScopedClasses['w-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['h-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-blue-600']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            /** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['focus:ring-blue-500']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "ml-3 flex-1" },
            });
            /** @type {__VLS_StyleScopedClasses['ml-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "font-medium text-gray-800" },
            });
            /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
            (actividad.nombre);
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "flex gap-2 mt-1" },
            });
            /** @type {__VLS_StyleScopedClasses['flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
            const __VLS_220 = Badge || Badge;
            // @ts-ignore
            const __VLS_221 = __VLS_asFunctionalComponent1(__VLS_220, new __VLS_220({
                variant: "secondary",
                size: "sm",
            }));
            const __VLS_222 = __VLS_221({
                variant: "secondary",
                size: "sm",
            }, ...__VLS_functionalComponentArgsRest(__VLS_221));
            const { default: __VLS_225 } = __VLS_223.slots;
            (actividad.tipo);
            // @ts-ignore
            [actividadesFiltradas, actividadesFiltradas, actividadesSeleccionadas,];
            var __VLS_223;
            const __VLS_226 = Badge || Badge;
            // @ts-ignore
            const __VLS_227 = __VLS_asFunctionalComponent1(__VLS_226, new __VLS_226({
                variant: "info",
                size: "sm",
            }));
            const __VLS_228 = __VLS_227({
                variant: "info",
                size: "sm",
            }, ...__VLS_functionalComponentArgsRest(__VLS_227));
            const { default: __VLS_231 } = __VLS_229.slots;
            (actividad.carreraNombre);
            // @ts-ignore
            [];
            var __VLS_229;
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "text-xs text-gray-500 mt-1" },
            });
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
            /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
            (__VLS_ctx.formatDate(actividad.fechaInicio));
            (__VLS_ctx.formatDate(actividad.fechaFin));
            // @ts-ignore
            [formatDate, formatDate,];
        }
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "bg-blue-50 border border-blue-200 rounded-lg p-3" },
    });
    /** @type {__VLS_StyleScopedClasses['bg-blue-50']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-blue-200']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['p-3']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-sm text-blue-800" },
    });
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-blue-800']} */ ;
    if (__VLS_ctx.tipoGestionActividades === 'DOCENTE') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    }
    (__VLS_ctx.tipoGestionActividades === 'DOCENTE'
        ? 'Podrán registrar calificaciones solo en los paralelos seleccionados.'
        : 'Solo podrán registrar asistencia en los eventos seleccionados.');
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "text-sm text-gray-600 text-center" },
    });
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    if (__VLS_ctx.tipoGestionActividades === 'DOCENTE') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (__VLS_ctx.paralelosSeleccionados.length);
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (__VLS_ctx.actividadesSeleccionadas.length);
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex justify-end space-x-3 pt-4 border-t" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-end']} */ ;
    /** @type {__VLS_StyleScopedClasses['space-x-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['pt-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-t']} */ ;
    const __VLS_232 = Button || Button;
    // @ts-ignore
    const __VLS_233 = __VLS_asFunctionalComponent1(__VLS_232, new __VLS_232({
        ...{ 'onClick': {} },
        type: "button",
        variant: "outline",
    }));
    const __VLS_234 = __VLS_233({
        ...{ 'onClick': {} },
        type: "button",
        variant: "outline",
    }, ...__VLS_functionalComponentArgsRest(__VLS_233));
    let __VLS_237;
    const __VLS_238 = ({ click: {} },
        { onClick: (__VLS_ctx.closeActividadesModal) });
    const { default: __VLS_239 } = __VLS_235.slots;
    // @ts-ignore
    [tipoGestionActividades, tipoGestionActividades, tipoGestionActividades, closeActividadesModal, paralelosSeleccionados, actividadesSeleccionadas,];
    var __VLS_235;
    var __VLS_236;
    const __VLS_240 = Button || Button;
    // @ts-ignore
    const __VLS_241 = __VLS_asFunctionalComponent1(__VLS_240, new __VLS_240({
        ...{ 'onClick': {} },
        disabled: (__VLS_ctx.saving),
    }));
    const __VLS_242 = __VLS_241({
        ...{ 'onClick': {} },
        disabled: (__VLS_ctx.saving),
    }, ...__VLS_functionalComponentArgsRest(__VLS_241));
    let __VLS_245;
    const __VLS_246 = ({ click: {} },
        { onClick: (__VLS_ctx.guardarActividades) });
    const { default: __VLS_247 } = __VLS_243.slots;
    (__VLS_ctx.saving ? 'Guardando...' : 'Guardar Asignaciones');
    // @ts-ignore
    [saving, saving, guardarActividades,];
    var __VLS_243;
    var __VLS_244;
}
// @ts-ignore
[];
var __VLS_197;
var __VLS_198;
const __VLS_248 = Modal || Modal;
// @ts-ignore
const __VLS_249 = __VLS_asFunctionalComponent1(__VLS_248, new __VLS_248({
    ...{ 'onClose': {} },
    modelValue: (__VLS_ctx.showRolesModal),
    title: "Gestionar Roles de Usuario",
}));
const __VLS_250 = __VLS_249({
    ...{ 'onClose': {} },
    modelValue: (__VLS_ctx.showRolesModal),
    title: "Gestionar Roles de Usuario",
}, ...__VLS_functionalComponentArgsRest(__VLS_249));
let __VLS_253;
const __VLS_254 = ({ close: {} },
    { onClose: (__VLS_ctx.closeRolesModal) });
const { default: __VLS_255 } = __VLS_251.slots;
if (__VLS_ctx.usuarioSeleccionado) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "space-y-4" },
    });
    /** @type {__VLS_StyleScopedClasses['space-y-4']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "bg-gray-50 p-4 rounded-lg" },
    });
    /** @type {__VLS_StyleScopedClasses['bg-gray-50']} */ ;
    /** @type {__VLS_StyleScopedClasses['p-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-sm text-gray-600" },
    });
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "font-semibold text-gray-800" },
    });
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
    (__VLS_ctx.usuarioSeleccionado.nombres);
    (__VLS_ctx.usuarioSeleccionado.apellidos);
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-sm text-gray-500" },
    });
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
    (__VLS_ctx.usuarioSeleccionado.email);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ class: "block text-sm font-medium text-gray-700 mb-3" },
    });
    /** @type {__VLS_StyleScopedClasses['block']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
    /** @type {__VLS_StyleScopedClasses['mb-3']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "space-y-2" },
    });
    /** @type {__VLS_StyleScopedClasses['space-y-2']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ class: "flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['p-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:bg-gray-50']} */ ;
    /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "checkbox",
        value: "ADMINISTRADOR",
        ...{ class: "w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500" },
    });
    (__VLS_ctx.rolesSeleccionados);
    /** @type {__VLS_StyleScopedClasses['w-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['h-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-blue-600']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus:ring-blue-500']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "ml-3 flex-1" },
    });
    /** @type {__VLS_StyleScopedClasses['ml-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "font-medium text-gray-800" },
    });
    /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-xs text-gray-600" },
    });
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
    const __VLS_256 = Badge || Badge;
    // @ts-ignore
    const __VLS_257 = __VLS_asFunctionalComponent1(__VLS_256, new __VLS_256({
        variant: "danger",
        size: "sm",
    }));
    const __VLS_258 = __VLS_257({
        variant: "danger",
        size: "sm",
    }, ...__VLS_functionalComponentArgsRest(__VLS_257));
    const { default: __VLS_261 } = __VLS_259.slots;
    // @ts-ignore
    [usuarioSeleccionado, usuarioSeleccionado, usuarioSeleccionado, usuarioSeleccionado, showRolesModal, closeRolesModal, rolesSeleccionados,];
    var __VLS_259;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ class: "flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['p-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:bg-gray-50']} */ ;
    /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "checkbox",
        value: "COORDINADOR",
        ...{ class: "w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500" },
    });
    (__VLS_ctx.rolesSeleccionados);
    /** @type {__VLS_StyleScopedClasses['w-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['h-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-blue-600']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus:ring-blue-500']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "ml-3 flex-1" },
    });
    /** @type {__VLS_StyleScopedClasses['ml-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "font-medium text-gray-800" },
    });
    /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-xs text-gray-600" },
    });
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
    const __VLS_262 = Badge || Badge;
    // @ts-ignore
    const __VLS_263 = __VLS_asFunctionalComponent1(__VLS_262, new __VLS_262({
        variant: "primary",
        size: "sm",
    }));
    const __VLS_264 = __VLS_263({
        variant: "primary",
        size: "sm",
    }, ...__VLS_functionalComponentArgsRest(__VLS_263));
    const { default: __VLS_267 } = __VLS_265.slots;
    // @ts-ignore
    [rolesSeleccionados,];
    var __VLS_265;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ class: "flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['p-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:bg-gray-50']} */ ;
    /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "checkbox",
        value: "DOCENTE",
        ...{ class: "w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500" },
    });
    (__VLS_ctx.rolesSeleccionados);
    /** @type {__VLS_StyleScopedClasses['w-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['h-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-blue-600']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus:ring-blue-500']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "ml-3 flex-1" },
    });
    /** @type {__VLS_StyleScopedClasses['ml-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "font-medium text-gray-800" },
    });
    /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-xs text-gray-600" },
    });
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
    const __VLS_268 = Badge || Badge;
    // @ts-ignore
    const __VLS_269 = __VLS_asFunctionalComponent1(__VLS_268, new __VLS_268({
        variant: "info",
        size: "sm",
    }));
    const __VLS_270 = __VLS_269({
        variant: "info",
        size: "sm",
    }, ...__VLS_functionalComponentArgsRest(__VLS_269));
    const { default: __VLS_273 } = __VLS_271.slots;
    // @ts-ignore
    [rolesSeleccionados,];
    var __VLS_271;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ class: "flex items-center p-3 border rounded-lg bg-gray-50 cursor-not-allowed" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['p-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-gray-50']} */ ;
    /** @type {__VLS_StyleScopedClasses['cursor-not-allowed']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "checkbox",
        checked: true,
        disabled: true,
        ...{ class: "w-4 h-4 text-gray-400 rounded" },
    });
    /** @type {__VLS_StyleScopedClasses['w-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['h-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-400']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "ml-3 flex-1" },
    });
    /** @type {__VLS_StyleScopedClasses['ml-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "font-medium text-gray-500" },
    });
    /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-xs text-gray-500" },
    });
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
    const __VLS_274 = Badge || Badge;
    // @ts-ignore
    const __VLS_275 = __VLS_asFunctionalComponent1(__VLS_274, new __VLS_274({
        variant: "gray",
        size: "sm",
    }));
    const __VLS_276 = __VLS_275({
        variant: "gray",
        size: "sm",
    }, ...__VLS_functionalComponentArgsRest(__VLS_275));
    const { default: __VLS_279 } = __VLS_277.slots;
    // @ts-ignore
    [];
    var __VLS_277;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ class: "flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['p-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:bg-gray-50']} */ ;
    /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "checkbox",
        value: "AUXILIAR",
        ...{ class: "w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500" },
    });
    (__VLS_ctx.rolesSeleccionados);
    /** @type {__VLS_StyleScopedClasses['w-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['h-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-blue-600']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus:ring-blue-500']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "ml-3 flex-1" },
    });
    /** @type {__VLS_StyleScopedClasses['ml-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "font-medium text-gray-800" },
    });
    /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-xs text-gray-600" },
    });
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
    const __VLS_280 = Badge || Badge;
    // @ts-ignore
    const __VLS_281 = __VLS_asFunctionalComponent1(__VLS_280, new __VLS_280({
        variant: "secondary",
        size: "sm",
    }));
    const __VLS_282 = __VLS_281({
        variant: "secondary",
        size: "sm",
    }, ...__VLS_functionalComponentArgsRest(__VLS_281));
    const { default: __VLS_285 } = __VLS_283.slots;
    // @ts-ignore
    [rolesSeleccionados,];
    var __VLS_283;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ class: "flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['p-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:bg-gray-50']} */ ;
    /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "checkbox",
        value: "DISEÑADOR",
        ...{ class: "w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500" },
    });
    (__VLS_ctx.rolesSeleccionados);
    /** @type {__VLS_StyleScopedClasses['w-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['h-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-blue-600']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus:ring-blue-500']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "ml-3 flex-1" },
    });
    /** @type {__VLS_StyleScopedClasses['ml-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "font-medium text-gray-800" },
    });
    /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-xs text-gray-600" },
    });
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
    const __VLS_286 = Badge || Badge;
    // @ts-ignore
    const __VLS_287 = __VLS_asFunctionalComponent1(__VLS_286, new __VLS_286({
        variant: "warning",
        size: "sm",
    }));
    const __VLS_288 = __VLS_287({
        variant: "warning",
        size: "sm",
    }, ...__VLS_functionalComponentArgsRest(__VLS_287));
    const { default: __VLS_291 } = __VLS_289.slots;
    // @ts-ignore
    [rolesSeleccionados,];
    var __VLS_289;
    if (__VLS_ctx.rolesSeleccionados.includes('DOCENTE')) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "space-y-2" },
        });
        /** @type {__VLS_StyleScopedClasses['space-y-2']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
            ...{ class: "block text-sm font-medium text-gray-700" },
        });
        /** @type {__VLS_StyleScopedClasses['block']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "text-red-600" },
        });
        /** @type {__VLS_StyleScopedClasses['text-red-600']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            value: (__VLS_ctx.tituloDocente),
            type: "text",
            placeholder: "Ej: Lic., MSc., PhD.",
            ...{ class: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" },
        });
        /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-gray-300']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus:ring-blue-500']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus:border-blue-500']} */ ;
    }
    if (__VLS_ctx.rolesSeleccionados.includes('COORDINADOR')) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "bg-blue-50 border border-blue-200 rounded-lg p-3" },
        });
        /** @type {__VLS_StyleScopedClasses['bg-blue-50']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-blue-200']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
        /** @type {__VLS_StyleScopedClasses['p-3']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "text-sm text-blue-800" },
        });
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-blue-800']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex justify-end space-x-3 pt-4 border-t" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-end']} */ ;
    /** @type {__VLS_StyleScopedClasses['space-x-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['pt-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-t']} */ ;
    const __VLS_292 = Button || Button;
    // @ts-ignore
    const __VLS_293 = __VLS_asFunctionalComponent1(__VLS_292, new __VLS_292({
        ...{ 'onClick': {} },
        type: "button",
        variant: "outline",
    }));
    const __VLS_294 = __VLS_293({
        ...{ 'onClick': {} },
        type: "button",
        variant: "outline",
    }, ...__VLS_functionalComponentArgsRest(__VLS_293));
    let __VLS_297;
    const __VLS_298 = ({ click: {} },
        { onClick: (__VLS_ctx.closeRolesModal) });
    const { default: __VLS_299 } = __VLS_295.slots;
    // @ts-ignore
    [closeRolesModal, rolesSeleccionados, rolesSeleccionados, tituloDocente,];
    var __VLS_295;
    var __VLS_296;
    const __VLS_300 = Button || Button;
    // @ts-ignore
    const __VLS_301 = __VLS_asFunctionalComponent1(__VLS_300, new __VLS_300({
        ...{ 'onClick': {} },
        disabled: (__VLS_ctx.saving),
    }));
    const __VLS_302 = __VLS_301({
        ...{ 'onClick': {} },
        disabled: (__VLS_ctx.saving),
    }, ...__VLS_functionalComponentArgsRest(__VLS_301));
    let __VLS_305;
    const __VLS_306 = ({ click: {} },
        { onClick: (__VLS_ctx.guardarRoles) });
    const { default: __VLS_307 } = __VLS_303.slots;
    (__VLS_ctx.saving ? 'Guardando...' : 'Guardar Roles');
    // @ts-ignore
    [saving, saving, guardarRoles,];
    var __VLS_303;
    var __VLS_304;
}
// @ts-ignore
[];
var __VLS_251;
var __VLS_252;
const __VLS_308 = Modal || Modal;
// @ts-ignore
const __VLS_309 = __VLS_asFunctionalComponent1(__VLS_308, new __VLS_308({
    ...{ 'onClose': {} },
    modelValue: (__VLS_ctx.showPasswordModal),
    title: "Cambiar Contraseña",
}));
const __VLS_310 = __VLS_309({
    ...{ 'onClose': {} },
    modelValue: (__VLS_ctx.showPasswordModal),
    title: "Cambiar Contraseña",
}, ...__VLS_functionalComponentArgsRest(__VLS_309));
let __VLS_313;
const __VLS_314 = ({ close: {} },
    { onClose: (__VLS_ctx.closePasswordModal) });
const { default: __VLS_315 } = __VLS_311.slots;
if (__VLS_ctx.usuarioSeleccionado) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "space-y-4" },
    });
    /** @type {__VLS_StyleScopedClasses['space-y-4']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "bg-gray-50 p-4 rounded-lg" },
    });
    /** @type {__VLS_StyleScopedClasses['bg-gray-50']} */ ;
    /** @type {__VLS_StyleScopedClasses['p-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-sm text-gray-600" },
    });
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "font-semibold text-gray-800" },
    });
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
    (__VLS_ctx.usuarioSeleccionado.nombres);
    (__VLS_ctx.usuarioSeleccionado.apellidos);
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-sm text-gray-500" },
    });
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
    (__VLS_ctx.usuarioSeleccionado.username);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ class: "block text-sm font-medium text-gray-700 mb-1" },
    });
    /** @type {__VLS_StyleScopedClasses['block']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
    /** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "text-red-600" },
    });
    /** @type {__VLS_StyleScopedClasses['text-red-600']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "password",
        required: true,
        placeholder: "Mínimo 6 caracteres",
        minlength: "6",
        ...{ class: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" },
    });
    (__VLS_ctx.nuevaPassword);
    /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-gray-300']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus:ring-blue-500']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus:border-blue-500']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ class: "block text-sm font-medium text-gray-700 mb-1" },
    });
    /** @type {__VLS_StyleScopedClasses['block']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
    /** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "text-red-600" },
    });
    /** @type {__VLS_StyleScopedClasses['text-red-600']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "password",
        required: true,
        placeholder: "Repetir contraseña",
        minlength: "6",
        ...{ class: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" },
    });
    (__VLS_ctx.confirmarPassword);
    /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-gray-300']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus:ring-blue-500']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus:border-blue-500']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "bg-red-50 border border-red-200 rounded-lg p-3" },
    });
    /** @type {__VLS_StyleScopedClasses['bg-red-50']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-red-200']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['p-3']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-sm text-red-800" },
    });
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-red-800']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex justify-end space-x-3 pt-4 border-t" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-end']} */ ;
    /** @type {__VLS_StyleScopedClasses['space-x-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['pt-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-t']} */ ;
    const __VLS_316 = Button || Button;
    // @ts-ignore
    const __VLS_317 = __VLS_asFunctionalComponent1(__VLS_316, new __VLS_316({
        ...{ 'onClick': {} },
        type: "button",
        variant: "outline",
    }));
    const __VLS_318 = __VLS_317({
        ...{ 'onClick': {} },
        type: "button",
        variant: "outline",
    }, ...__VLS_functionalComponentArgsRest(__VLS_317));
    let __VLS_321;
    const __VLS_322 = ({ click: {} },
        { onClick: (__VLS_ctx.closePasswordModal) });
    const { default: __VLS_323 } = __VLS_319.slots;
    // @ts-ignore
    [usuarioSeleccionado, usuarioSeleccionado, usuarioSeleccionado, usuarioSeleccionado, showPasswordModal, closePasswordModal, closePasswordModal, nuevaPassword, confirmarPassword,];
    var __VLS_319;
    var __VLS_320;
    const __VLS_324 = Button || Button;
    // @ts-ignore
    const __VLS_325 = __VLS_asFunctionalComponent1(__VLS_324, new __VLS_324({
        ...{ 'onClick': {} },
        disabled: (__VLS_ctx.saving),
        variant: "danger",
    }));
    const __VLS_326 = __VLS_325({
        ...{ 'onClick': {} },
        disabled: (__VLS_ctx.saving),
        variant: "danger",
    }, ...__VLS_functionalComponentArgsRest(__VLS_325));
    let __VLS_329;
    const __VLS_330 = ({ click: {} },
        { onClick: (__VLS_ctx.guardarPassword) });
    const { default: __VLS_331 } = __VLS_327.slots;
    (__VLS_ctx.saving ? 'Guardando...' : 'Cambiar Contraseña');
    // @ts-ignore
    [saving, saving, guardarPassword,];
    var __VLS_327;
    var __VLS_328;
}
// @ts-ignore
[];
var __VLS_311;
var __VLS_312;
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
//# sourceMappingURL=Usuarios.vue.js.map