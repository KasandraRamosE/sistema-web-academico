import { ref, computed, onMounted } from 'vue';
import Card from '@/components/common/Card.vue';
import Button from '@/components/common/Button.vue';
import Badge from '@/components/common/Badge.vue';
import Modal from '@/components/common/Modal.vue';
import Pagination from '@/components/common/Pagination.vue';
import { usePagination } from '@/composables/usePagination';
import { api } from '@/utils/api';
// ============================================
// ESTADO
// ============================================
const loading = ref(false);
const procesando = ref(false);
const tabActiva = ref('solicitudes');
const solicitudesPendientes = ref([]);
const certificados = ref([]);
const estadisticas = ref({
    solicitudesPendientes: 0,
    certificadosEmitidos: 0,
    certificadosAnulados: 0,
    certificadosReemitidos: 0,
    totalCertificados: 0
});
const filtrosCertificados = ref({
    busqueda: '',
    estado: '',
    tipo: ''
});
// Modales
const showSolicitudModal = ref(false);
const showAnularModal = ref(false);
const solicitudSeleccionada = ref(null);
const certificadoSeleccionado = ref(null);
// Anulación
const motivoAnulacion = ref('');
// ============================================
// COMPUTED
// ============================================
const certificadosFiltrados = computed(() => {
    let resultado = [...certificados.value];
    if (filtrosCertificados.value.busqueda) {
        const busqueda = filtrosCertificados.value.busqueda.toLowerCase();
        resultado = resultado.filter(c => c.usuario.nombres.toLowerCase().includes(busqueda) ||
            c.usuario.apellidos.toLowerCase().includes(busqueda) ||
            c.actividad.nombre.toLowerCase().includes(busqueda));
    }
    if (filtrosCertificados.value.estado) {
        resultado = resultado.filter(c => c.estadoEmision === filtrosCertificados.value.estado);
    }
    if (filtrosCertificados.value.tipo) {
        resultado = resultado.filter(c => c.tipo === filtrosCertificados.value.tipo);
    }
    return resultado;
});
const { paginatedData: certificadosPaginados, // Solo 10 usuarios a la vez
currentPage, pageSize, totalItems, goToPage, setPageSize } = usePagination(certificadosFiltrados, {
    pageSize: 10,
    initialPage: 1
});
// ============================================
// MÉTODOS - CARGA DE DATOS
// ============================================
const cargarDatos = async () => {
    loading.value = true;
    try {
        await Promise.all([
            cargarSolicitudes(),
            cargarCertificados()
        ]);
        calcularEstadisticas();
    }
    catch (error) {
        console.error('Error al cargar datos:', error);
    }
    finally {
        loading.value = false;
    }
};
const cargarSolicitudes = async () => {
    const response = await api.get('/evaluaciones/solicitudes');
    const items = response;
    solicitudesPendientes.value = items.map(item => ({
        idSolicitud: Number(item.idSolicitud),
        actividad: {
            nombre: String(item.nombreActividad ?? ''),
            tipo: 'CURSO',
            carrera: '-',
            cargaHoraria: 0
        },
        docente: String(item.nombreDocente ?? ''),
        cantidadAprobados: Number(item.cantidadAprobados ?? 0),
        estado: String(item.estado ?? 'PENDIENTE'),
        fechaSolicitud: String(item.fechaSolicitud ?? '')
    }));
};
const cargarCertificados = async () => {
    const response = await api.get('/certificados/admin');
    const items = response;
    certificados.value = items.map(item => {
        const nombreParticipante = String(item.nombreParticipante ?? '');
        const nombreParts = nombreParticipante.split(' ');
        const nombres = nombreParts.slice(0, -1).join(' ') || nombreParticipante;
        const apellidos = nombreParts.length > 1 ? nombreParts.slice(-1).join(' ') : '';
        const tipoActividad = String(item.tipoActividad ?? 'EVENTO');
        return {
            idCertificado: Number(item.idCertificado),
            usuario: {
                nombres,
                apellidos,
                email: '-'
            },
            actividad: {
                nombre: String(item.nombreActividad ?? ''),
                tipo: tipoActividad,
                carrera: '-',
                cargaHoraria: Number(item.cargaHoraria ?? 0)
            },
            tipo: tipoActividad === 'CURSO' ? 'APROBACION' : 'PARTICIPACION',
            version: Number(item.version ?? 1),
            estadoEmision: String(item.estadoEmision ?? 'GENERADO'),
            fechaEmision: String(item.fechaEmision ?? '')
        };
    });
};
const calcularEstadisticas = () => {
    estadisticas.value = {
        solicitudesPendientes: solicitudesPendientes.value.length,
        certificadosEmitidos: certificados.value.filter(c => c.estadoEmision === 'GENERADO').length,
        certificadosAnulados: certificados.value.filter(c => c.estadoEmision === 'ANULADO').length,
        certificadosReemitidos: certificados.value.filter(c => c.estadoEmision === 'REEMITIDO').length,
        totalCertificados: certificados.value.length
    };
};
// ============================================
// MÉTODOS - SOLICITUDES
// ============================================
const verSolicitud = async (solicitud) => {
    solicitudSeleccionada.value = solicitud;
    showSolicitudModal.value = true;
};
const actualizarEstadoSolicitud = async (estado) => {
    if (!solicitudSeleccionada.value)
        return;
    procesando.value = true;
    try {
        await api.patch(`/evaluaciones/solicitudes/${solicitudSeleccionada.value.idSolicitud}?estado=${estado}`);
        await cargarDatos();
        closeSolicitudModal();
    }
    catch (error) {
        console.error('Error al actualizar solicitud:', error);
    }
    finally {
        procesando.value = false;
    }
};
// ============================================
// MÉTODOS - CERTIFICADOS
// ============================================
const verCertificado = (certificado) => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
    const token = localStorage.getItem('token');
    fetch(`${baseUrl}/certificados/${certificado.idCertificado}/descargar`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
    })
        .then(async (response) => {
        if (!response.ok) {
            const message = response.statusText || 'No se pudo descargar el certificado.';
            throw new Error(message);
        }
        return response.blob();
    })
        .then(blob => {
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank', 'noopener,noreferrer');
        setTimeout(() => URL.revokeObjectURL(url), 10000);
    })
        .catch(error => {
        console.error('Error al ver certificado:', error);
    });
};
const anularCertificado = (certificado) => {
    certificadoSeleccionado.value = certificado;
    motivoAnulacion.value = '';
    showAnularModal.value = true;
};
const confirmarAnulacion = async () => {
    if (!certificadoSeleccionado.value || !motivoAnulacion.value.trim())
        return;
    procesando.value = true;
    try {
        await api.patch(`/certificados/${certificadoSeleccionado.value.idCertificado}/anular`, {
            motivo: motivoAnulacion.value,
            reemitir: false
        });
        closeAnularModal();
        await cargarDatos();
    }
    catch (error) {
        console.error('Error al anular certificado:', error);
    }
    finally {
        procesando.value = false;
    }
};
const reemitirCertificado = async (certificado) => {
    if (confirm('¿Reemitir este certificado con una nueva versión?')) {
        try {
            await api.patch(`/certificados/${certificado.idCertificado}/anular`, {
                motivo: 'Reemision solicitada por administrador',
                reemitir: true
            });
            await cargarDatos();
        }
        catch (error) {
            console.error('Error al reemitir certificado:', error);
        }
    }
};
// ============================================
// MÉTODOS - MODALES
// ============================================
const closeSolicitudModal = () => {
    showSolicitudModal.value = false;
    solicitudSeleccionada.value = null;
};
const closeAnularModal = () => {
    showAnularModal.value = false;
    certificadoSeleccionado.value = null;
    motivoAnulacion.value = '';
};
// ============================================
// MÉTODOS - UTILIDADES
// ============================================
const limpiarFiltrosCertificados = () => {
    filtrosCertificados.value = {
        busqueda: '',
        estado: '',
        tipo: ''
    };
};
const formatDate = (date) => {
    if (!date)
        return '-';
    return new Date(date).toLocaleDateString('es-BO', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
};
const formatDatetime = (datetime) => {
    if (!datetime)
        return '-';
    return new Date(datetime).toLocaleString('es-BO', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};
const getEstadoCertificadoBadge = (estado) => {
    const variants = {
        'GENERADO': 'success',
        'ANULADO': 'danger',
        'REEMITIDO': 'info'
    };
    return variants[estado] || 'gray';
};
// ============================================
// LIFECYCLE
// ============================================
onMounted(() => {
    cargarDatos();
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
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "grid grid-cols-1 md:grid-cols-5 gap-4" },
});
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-cols-1']} */ ;
/** @type {__VLS_StyleScopedClasses['md:grid-cols-5']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
const __VLS_0 = Card || Card;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({}));
const __VLS_2 = __VLS_1({}, ...__VLS_functionalComponentArgsRest(__VLS_1));
const { default: __VLS_5 } = __VLS_3.slots;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "text-center" },
});
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "text-2xl font-bold text-orange-600" },
});
/** @type {__VLS_StyleScopedClasses['text-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-orange-600']} */ ;
(__VLS_ctx.estadisticas.solicitudesPendientes);
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "text-sm text-gray-600" },
});
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
// @ts-ignore
[estadisticas,];
var __VLS_3;
const __VLS_6 = Card || Card;
// @ts-ignore
const __VLS_7 = __VLS_asFunctionalComponent1(__VLS_6, new __VLS_6({}));
const __VLS_8 = __VLS_7({}, ...__VLS_functionalComponentArgsRest(__VLS_7));
const { default: __VLS_11 } = __VLS_9.slots;
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
(__VLS_ctx.estadisticas.certificadosEmitidos);
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "text-sm text-gray-600" },
});
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
// @ts-ignore
[estadisticas,];
var __VLS_9;
const __VLS_12 = Card || Card;
// @ts-ignore
const __VLS_13 = __VLS_asFunctionalComponent1(__VLS_12, new __VLS_12({}));
const __VLS_14 = __VLS_13({}, ...__VLS_functionalComponentArgsRest(__VLS_13));
const { default: __VLS_17 } = __VLS_15.slots;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "text-center" },
});
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "text-2xl font-bold text-red-600" },
});
/** @type {__VLS_StyleScopedClasses['text-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-red-600']} */ ;
(__VLS_ctx.estadisticas.certificadosAnulados);
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "text-sm text-gray-600" },
});
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
// @ts-ignore
[estadisticas,];
var __VLS_15;
const __VLS_18 = Card || Card;
// @ts-ignore
const __VLS_19 = __VLS_asFunctionalComponent1(__VLS_18, new __VLS_18({}));
const __VLS_20 = __VLS_19({}, ...__VLS_functionalComponentArgsRest(__VLS_19));
const { default: __VLS_23 } = __VLS_21.slots;
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
(__VLS_ctx.estadisticas.certificadosReemitidos);
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "text-sm text-gray-600" },
});
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
// @ts-ignore
[estadisticas,];
var __VLS_21;
const __VLS_24 = Card || Card;
// @ts-ignore
const __VLS_25 = __VLS_asFunctionalComponent1(__VLS_24, new __VLS_24({}));
const __VLS_26 = __VLS_25({}, ...__VLS_functionalComponentArgsRest(__VLS_25));
const { default: __VLS_29 } = __VLS_27.slots;
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
(__VLS_ctx.estadisticas.totalCertificados);
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "text-sm text-gray-600" },
});
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
// @ts-ignore
[estadisticas,];
var __VLS_27;
const __VLS_30 = Card || Card;
// @ts-ignore
const __VLS_31 = __VLS_asFunctionalComponent1(__VLS_30, new __VLS_30({}));
const __VLS_32 = __VLS_31({}, ...__VLS_functionalComponentArgsRest(__VLS_31));
const { default: __VLS_35 } = __VLS_33.slots;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "border-b border-gray-200" },
});
/** @type {__VLS_StyleScopedClasses['border-b']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-200']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.nav, __VLS_intrinsics.nav)({
    ...{ class: "-mb-px flex space-x-8" },
});
/** @type {__VLS_StyleScopedClasses['-mb-px']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['space-x-8']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.tabActiva = 'solicitudes';
            // @ts-ignore
            [tabActiva,];
        } },
    ...{ class: ([
            'py-4 px-1 border-b-2 font-medium text-sm',
            __VLS_ctx.tabActiva === 'solicitudes'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
        ]) },
});
/** @type {__VLS_StyleScopedClasses['py-4']} */ ;
/** @type {__VLS_StyleScopedClasses['px-1']} */ ;
/** @type {__VLS_StyleScopedClasses['border-b-2']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
if (__VLS_ctx.estadisticas.solicitudesPendientes > 0) {
    const __VLS_36 = Badge || Badge;
    // @ts-ignore
    const __VLS_37 = __VLS_asFunctionalComponent1(__VLS_36, new __VLS_36({
        variant: "warning",
        size: "sm",
        ...{ class: "ml-2" },
    }));
    const __VLS_38 = __VLS_37({
        variant: "warning",
        size: "sm",
        ...{ class: "ml-2" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_37));
    /** @type {__VLS_StyleScopedClasses['ml-2']} */ ;
    const { default: __VLS_41 } = __VLS_39.slots;
    (__VLS_ctx.estadisticas.solicitudesPendientes);
    // @ts-ignore
    [estadisticas, estadisticas, tabActiva,];
    var __VLS_39;
}
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.tabActiva = 'certificados';
            // @ts-ignore
            [tabActiva,];
        } },
    ...{ class: ([
            'py-4 px-1 border-b-2 font-medium text-sm',
            __VLS_ctx.tabActiva === 'certificados'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
        ]) },
});
/** @type {__VLS_StyleScopedClasses['py-4']} */ ;
/** @type {__VLS_StyleScopedClasses['px-1']} */ ;
/** @type {__VLS_StyleScopedClasses['border-b-2']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
// @ts-ignore
[tabActiva,];
var __VLS_33;
if (__VLS_ctx.tabActiva === 'solicitudes') {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    const __VLS_42 = Card || Card;
    // @ts-ignore
    const __VLS_43 = __VLS_asFunctionalComponent1(__VLS_42, new __VLS_42({}));
    const __VLS_44 = __VLS_43({}, ...__VLS_functionalComponentArgsRest(__VLS_43));
    const { default: __VLS_47 } = __VLS_45.slots;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "space-y-4" },
    });
    /** @type {__VLS_StyleScopedClasses['space-y-4']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex items-center justify-between" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({
        ...{ class: "text-lg font-semibold text-gray-800" },
    });
    /** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
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
    else if (__VLS_ctx.solicitudesPendientes.length > 0) {
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
        __VLS_asFunctionalElement1(__VLS_intrinsics.tbody, __VLS_intrinsics.tbody)({
            ...{ class: "divide-y divide-gray-200" },
        });
        /** @type {__VLS_StyleScopedClasses['divide-y']} */ ;
        /** @type {__VLS_StyleScopedClasses['divide-gray-200']} */ ;
        for (const [solicitud] of __VLS_vFor((__VLS_ctx.solicitudesPendientes))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
                key: (solicitud.idSolicitud),
                ...{ class: "hover:bg-gray-50" },
            });
            /** @type {__VLS_StyleScopedClasses['hover:bg-gray-50']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "px-4 py-3 text-sm font-mono text-gray-600" },
            });
            /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-mono']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
            (solicitud.idSolicitud);
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "px-4 py-3" },
            });
            /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "text-sm font-medium text-gray-800" },
            });
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
            (solicitud.actividad.nombre);
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "text-xs text-gray-500" },
            });
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
            (solicitud.actividad.carrera);
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "px-4 py-3" },
            });
            /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
            const __VLS_48 = Badge || Badge;
            // @ts-ignore
            const __VLS_49 = __VLS_asFunctionalComponent1(__VLS_48, new __VLS_48({
                variant: (solicitud.actividad.tipo === 'CURSO' ? 'primary' : 'secondary'),
                size: "sm",
            }));
            const __VLS_50 = __VLS_49({
                variant: (solicitud.actividad.tipo === 'CURSO' ? 'primary' : 'secondary'),
                size: "sm",
            }, ...__VLS_functionalComponentArgsRest(__VLS_49));
            const { default: __VLS_53 } = __VLS_51.slots;
            (solicitud.actividad.tipo);
            // @ts-ignore
            [tabActiva, loading, solicitudesPendientes, solicitudesPendientes,];
            var __VLS_51;
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "px-4 py-3 text-sm text-gray-600" },
            });
            /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
            (solicitud.docente);
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "px-4 py-3 text-center" },
            });
            /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "text-lg font-bold text-green-600" },
            });
            /** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-green-600']} */ ;
            (solicitud.cantidadAprobados);
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "px-4 py-3 text-xs text-gray-600" },
            });
            /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
            (__VLS_ctx.formatDatetime(solicitud.fechaSolicitud));
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "px-4 py-3" },
            });
            /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "flex items-center space-x-2" },
            });
            /** @type {__VLS_StyleScopedClasses['flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['space-x-2']} */ ;
            const __VLS_54 = Button || Button;
            // @ts-ignore
            const __VLS_55 = __VLS_asFunctionalComponent1(__VLS_54, new __VLS_54({
                ...{ 'onClick': {} },
                variant: "primary",
                size: "sm",
            }));
            const __VLS_56 = __VLS_55({
                ...{ 'onClick': {} },
                variant: "primary",
                size: "sm",
            }, ...__VLS_functionalComponentArgsRest(__VLS_55));
            let __VLS_59;
            const __VLS_60 = ({ click: {} },
                { onClick: (...[$event]) => {
                        if (!(__VLS_ctx.tabActiva === 'solicitudes'))
                            return;
                        if (!!(__VLS_ctx.loading))
                            return;
                        if (!(__VLS_ctx.solicitudesPendientes.length > 0))
                            return;
                        __VLS_ctx.verSolicitud(solicitud);
                        // @ts-ignore
                        [formatDatetime, verSolicitud,];
                    } });
            const { default: __VLS_61 } = __VLS_57.slots;
            // @ts-ignore
            [];
            var __VLS_57;
            var __VLS_58;
            // @ts-ignore
            [];
        }
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
            d: "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "text-gray-600" },
        });
        /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
    }
    // @ts-ignore
    [];
    var __VLS_45;
}
if (__VLS_ctx.tabActiva === 'certificados') {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    const __VLS_62 = Card || Card;
    // @ts-ignore
    const __VLS_63 = __VLS_asFunctionalComponent1(__VLS_62, new __VLS_62({}));
    const __VLS_64 = __VLS_63({}, ...__VLS_functionalComponentArgsRest(__VLS_63));
    const { default: __VLS_67 } = __VLS_65.slots;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "space-y-4" },
    });
    /** @type {__VLS_StyleScopedClasses['space-y-4']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "grid grid-cols-1 md:grid-cols-4 gap-4" },
    });
    /** @type {__VLS_StyleScopedClasses['grid']} */ ;
    /** @type {__VLS_StyleScopedClasses['grid-cols-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['md:grid-cols-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
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
        value: (__VLS_ctx.filtrosCertificados.busqueda),
        type: "text",
        placeholder: "Nombre de usuario o actividad...",
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
        value: (__VLS_ctx.filtrosCertificados.estado),
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
        value: "GENERADO",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "ANULADO",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "REEMITIDO",
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
        value: (__VLS_ctx.filtrosCertificados.tipo),
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
        value: "APROBACION",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "PARTICIPACION",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex items-end" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-end']} */ ;
    const __VLS_68 = Button || Button;
    // @ts-ignore
    const __VLS_69 = __VLS_asFunctionalComponent1(__VLS_68, new __VLS_68({
        ...{ 'onClick': {} },
        variant: "outline",
        ...{ class: "w-full" },
    }));
    const __VLS_70 = __VLS_69({
        ...{ 'onClick': {} },
        variant: "outline",
        ...{ class: "w-full" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_69));
    let __VLS_73;
    const __VLS_74 = ({ click: {} },
        { onClick: (__VLS_ctx.limpiarFiltrosCertificados) });
    /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
    const { default: __VLS_75 } = __VLS_71.slots;
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
    [tabActiva, filtrosCertificados, filtrosCertificados, filtrosCertificados, limpiarFiltrosCertificados,];
    var __VLS_71;
    var __VLS_72;
    if (__VLS_ctx.certificadosPaginados.length > 0) {
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
        for (const [certificado] of __VLS_vFor((__VLS_ctx.certificadosPaginados))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
                key: (certificado.idCertificado),
                ...{ class: "hover:bg-gray-50" },
            });
            /** @type {__VLS_StyleScopedClasses['hover:bg-gray-50']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "px-4 py-3 text-sm font-mono text-gray-600" },
            });
            /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-mono']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
            (certificado.idCertificado);
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "px-4 py-3" },
            });
            /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "text-sm font-medium text-gray-800" },
            });
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
            (certificado.usuario.nombres);
            (certificado.usuario.apellidos);
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "text-xs text-gray-500" },
            });
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
            (certificado.usuario.email);
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "px-4 py-3" },
            });
            /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "text-sm font-medium text-gray-800" },
            });
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
            (certificado.actividad.nombre);
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "text-xs text-gray-500" },
            });
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
            (certificado.actividad.cargaHoraria);
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "px-4 py-3" },
            });
            /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
            const __VLS_76 = Badge || Badge;
            // @ts-ignore
            const __VLS_77 = __VLS_asFunctionalComponent1(__VLS_76, new __VLS_76({
                variant: (certificado.tipo === 'APROBACION' ? 'success' : 'info'),
                size: "sm",
            }));
            const __VLS_78 = __VLS_77({
                variant: (certificado.tipo === 'APROBACION' ? 'success' : 'info'),
                size: "sm",
            }, ...__VLS_functionalComponentArgsRest(__VLS_77));
            const { default: __VLS_81 } = __VLS_79.slots;
            (certificado.tipo);
            // @ts-ignore
            [certificadosPaginados, certificadosPaginados,];
            var __VLS_79;
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "px-4 py-3 text-center text-sm" },
            });
            /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            if (certificado.version > 1) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "text-blue-600 font-medium" },
                });
                /** @type {__VLS_StyleScopedClasses['text-blue-600']} */ ;
                /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
                (certificado.version);
            }
            else {
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "text-gray-500" },
                });
                /** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
            }
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "px-4 py-3" },
            });
            /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
            const __VLS_82 = Badge || Badge;
            // @ts-ignore
            const __VLS_83 = __VLS_asFunctionalComponent1(__VLS_82, new __VLS_82({
                variant: (__VLS_ctx.getEstadoCertificadoBadge(certificado.estadoEmision)),
            }));
            const __VLS_84 = __VLS_83({
                variant: (__VLS_ctx.getEstadoCertificadoBadge(certificado.estadoEmision)),
            }, ...__VLS_functionalComponentArgsRest(__VLS_83));
            const { default: __VLS_87 } = __VLS_85.slots;
            (certificado.estadoEmision);
            // @ts-ignore
            [getEstadoCertificadoBadge,];
            var __VLS_85;
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "px-4 py-3 text-xs text-gray-600" },
            });
            /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
            (__VLS_ctx.formatDate(certificado.fechaEmision));
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "px-4 py-3" },
            });
            /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "flex items-center space-x-2" },
            });
            /** @type {__VLS_StyleScopedClasses['flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['space-x-2']} */ ;
            const __VLS_88 = Button || Button;
            // @ts-ignore
            const __VLS_89 = __VLS_asFunctionalComponent1(__VLS_88, new __VLS_88({
                ...{ 'onClick': {} },
                variant: "ghost",
                size: "sm",
            }));
            const __VLS_90 = __VLS_89({
                ...{ 'onClick': {} },
                variant: "ghost",
                size: "sm",
            }, ...__VLS_functionalComponentArgsRest(__VLS_89));
            let __VLS_93;
            const __VLS_94 = ({ click: {} },
                { onClick: (...[$event]) => {
                        if (!(__VLS_ctx.tabActiva === 'certificados'))
                            return;
                        if (!(__VLS_ctx.certificadosPaginados.length > 0))
                            return;
                        __VLS_ctx.verCertificado(certificado);
                        // @ts-ignore
                        [formatDate, verCertificado,];
                    } });
            const { default: __VLS_95 } = __VLS_91.slots;
            __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
                ...{ class: "w-4 h-4" },
                fill: "none",
                stroke: "currentColor",
                viewBox: "0 0 24 24",
            });
            /** @type {__VLS_StyleScopedClasses['w-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['h-4']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
                'stroke-linecap': "round",
                'stroke-linejoin': "round",
                'stroke-width': "2",
                d: "M15 12a3 3 0 11-6 0 3 3 0 016 0z",
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
                'stroke-linecap': "round",
                'stroke-linejoin': "round",
                'stroke-width': "2",
                d: "M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z",
            });
            // @ts-ignore
            [];
            var __VLS_91;
            var __VLS_92;
            if (certificado.estadoEmision === 'GENERADO') {
                const __VLS_96 = Button || Button;
                // @ts-ignore
                const __VLS_97 = __VLS_asFunctionalComponent1(__VLS_96, new __VLS_96({
                    ...{ 'onClick': {} },
                    variant: "ghost",
                    size: "sm",
                    ...{ class: "text-red-600 hover:text-red-800" },
                }));
                const __VLS_98 = __VLS_97({
                    ...{ 'onClick': {} },
                    variant: "ghost",
                    size: "sm",
                    ...{ class: "text-red-600 hover:text-red-800" },
                }, ...__VLS_functionalComponentArgsRest(__VLS_97));
                let __VLS_101;
                const __VLS_102 = ({ click: {} },
                    { onClick: (...[$event]) => {
                            if (!(__VLS_ctx.tabActiva === 'certificados'))
                                return;
                            if (!(__VLS_ctx.certificadosPaginados.length > 0))
                                return;
                            if (!(certificado.estadoEmision === 'GENERADO'))
                                return;
                            __VLS_ctx.anularCertificado(certificado);
                            // @ts-ignore
                            [anularCertificado,];
                        } });
                /** @type {__VLS_StyleScopedClasses['text-red-600']} */ ;
                /** @type {__VLS_StyleScopedClasses['hover:text-red-800']} */ ;
                const { default: __VLS_103 } = __VLS_99.slots;
                __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
                    ...{ class: "w-4 h-4" },
                    fill: "none",
                    stroke: "currentColor",
                    viewBox: "0 0 24 24",
                });
                /** @type {__VLS_StyleScopedClasses['w-4']} */ ;
                /** @type {__VLS_StyleScopedClasses['h-4']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
                    'stroke-linecap': "round",
                    'stroke-linejoin': "round",
                    'stroke-width': "2",
                    d: "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636",
                });
                // @ts-ignore
                [];
                var __VLS_99;
                var __VLS_100;
            }
            if (certificado.estadoEmision === 'ANULADO') {
                const __VLS_104 = Button || Button;
                // @ts-ignore
                const __VLS_105 = __VLS_asFunctionalComponent1(__VLS_104, new __VLS_104({
                    ...{ 'onClick': {} },
                    variant: "ghost",
                    size: "sm",
                    ...{ class: "text-blue-600 hover:text-blue-800" },
                }));
                const __VLS_106 = __VLS_105({
                    ...{ 'onClick': {} },
                    variant: "ghost",
                    size: "sm",
                    ...{ class: "text-blue-600 hover:text-blue-800" },
                }, ...__VLS_functionalComponentArgsRest(__VLS_105));
                let __VLS_109;
                const __VLS_110 = ({ click: {} },
                    { onClick: (...[$event]) => {
                            if (!(__VLS_ctx.tabActiva === 'certificados'))
                                return;
                            if (!(__VLS_ctx.certificadosPaginados.length > 0))
                                return;
                            if (!(certificado.estadoEmision === 'ANULADO'))
                                return;
                            __VLS_ctx.reemitirCertificado(certificado);
                            // @ts-ignore
                            [reemitirCertificado,];
                        } });
                /** @type {__VLS_StyleScopedClasses['text-blue-600']} */ ;
                /** @type {__VLS_StyleScopedClasses['hover:text-blue-800']} */ ;
                const { default: __VLS_111 } = __VLS_107.slots;
                __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
                    ...{ class: "w-4 h-4" },
                    fill: "none",
                    stroke: "currentColor",
                    viewBox: "0 0 24 24",
                });
                /** @type {__VLS_StyleScopedClasses['w-4']} */ ;
                /** @type {__VLS_StyleScopedClasses['h-4']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
                    'stroke-linecap': "round",
                    'stroke-linejoin': "round",
                    'stroke-width': "2",
                    d: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15",
                });
                // @ts-ignore
                [];
                var __VLS_107;
                var __VLS_108;
            }
            // @ts-ignore
            [];
        }
    }
    if (__VLS_ctx.totalItems > 0) {
        const __VLS_112 = Pagination;
        // @ts-ignore
        const __VLS_113 = __VLS_asFunctionalComponent1(__VLS_112, new __VLS_112({
            ...{ 'onUpdate:currentPage': {} },
            ...{ 'onUpdate:pageSize': {} },
            currentPage: (__VLS_ctx.currentPage),
            totalItems: (__VLS_ctx.totalItems),
            pageSize: (__VLS_ctx.pageSize),
            showPageSizeSelector: (true),
        }));
        const __VLS_114 = __VLS_113({
            ...{ 'onUpdate:currentPage': {} },
            ...{ 'onUpdate:pageSize': {} },
            currentPage: (__VLS_ctx.currentPage),
            totalItems: (__VLS_ctx.totalItems),
            pageSize: (__VLS_ctx.pageSize),
            showPageSizeSelector: (true),
        }, ...__VLS_functionalComponentArgsRest(__VLS_113));
        let __VLS_117;
        const __VLS_118 = ({ 'update:currentPage': {} },
            { 'onUpdate:currentPage': (__VLS_ctx.goToPage) });
        const __VLS_119 = ({ 'update:pageSize': {} },
            { 'onUpdate:pageSize': (__VLS_ctx.setPageSize) });
        var __VLS_115;
        var __VLS_116;
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
            d: "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "text-gray-600" },
        });
        /** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
    }
    // @ts-ignore
    [totalItems, totalItems, currentPage, pageSize, goToPage, setPageSize,];
    var __VLS_65;
}
const __VLS_120 = Modal || Modal;
// @ts-ignore
const __VLS_121 = __VLS_asFunctionalComponent1(__VLS_120, new __VLS_120({
    ...{ 'onClose': {} },
    modelValue: (__VLS_ctx.showSolicitudModal),
    title: "Procesar Solicitud de Certificados",
    size: "xl",
}));
const __VLS_122 = __VLS_121({
    ...{ 'onClose': {} },
    modelValue: (__VLS_ctx.showSolicitudModal),
    title: "Procesar Solicitud de Certificados",
    size: "xl",
}, ...__VLS_functionalComponentArgsRest(__VLS_121));
let __VLS_125;
const __VLS_126 = ({ close: {} },
    { onClose: (__VLS_ctx.closeSolicitudModal) });
const { default: __VLS_127 } = __VLS_123.slots;
if (__VLS_ctx.solicitudSeleccionada) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "space-y-6" },
    });
    /** @type {__VLS_StyleScopedClasses['space-y-6']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "bg-blue-50 border border-blue-200 rounded-lg p-4" },
    });
    /** @type {__VLS_StyleScopedClasses['bg-blue-50']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-blue-200']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['p-4']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "grid grid-cols-2 gap-4" },
    });
    /** @type {__VLS_StyleScopedClasses['grid']} */ ;
    /** @type {__VLS_StyleScopedClasses['grid-cols-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-xs text-blue-600" },
    });
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-blue-600']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "font-medium text-gray-800" },
    });
    /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
    (__VLS_ctx.solicitudSeleccionada.actividad.nombre);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-xs text-blue-600" },
    });
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-blue-600']} */ ;
    const __VLS_128 = Badge || Badge;
    // @ts-ignore
    const __VLS_129 = __VLS_asFunctionalComponent1(__VLS_128, new __VLS_128({
        variant: (__VLS_ctx.solicitudSeleccionada.actividad.tipo === 'CURSO' ? 'primary' : 'secondary'),
    }));
    const __VLS_130 = __VLS_129({
        variant: (__VLS_ctx.solicitudSeleccionada.actividad.tipo === 'CURSO' ? 'primary' : 'secondary'),
    }, ...__VLS_functionalComponentArgsRest(__VLS_129));
    const { default: __VLS_133 } = __VLS_131.slots;
    (__VLS_ctx.solicitudSeleccionada.actividad.tipo);
    // @ts-ignore
    [showSolicitudModal, closeSolicitudModal, solicitudSeleccionada, solicitudSeleccionada, solicitudSeleccionada, solicitudSeleccionada,];
    var __VLS_131;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-xs text-blue-600" },
    });
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-blue-600']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "font-medium text-gray-800" },
    });
    /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
    (__VLS_ctx.solicitudSeleccionada.docente);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-xs text-blue-600" },
    });
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-blue-600']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-2xl font-bold text-green-600" },
    });
    /** @type {__VLS_StyleScopedClasses['text-2xl']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-green-600']} */ ;
    (__VLS_ctx.solicitudSeleccionada.cantidadAprobados);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex justify-between items-center pt-4 border-t" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['pt-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-t']} */ ;
    const __VLS_134 = Button || Button;
    // @ts-ignore
    const __VLS_135 = __VLS_asFunctionalComponent1(__VLS_134, new __VLS_134({
        ...{ 'onClick': {} },
        variant: "outline",
    }));
    const __VLS_136 = __VLS_135({
        ...{ 'onClick': {} },
        variant: "outline",
    }, ...__VLS_functionalComponentArgsRest(__VLS_135));
    let __VLS_139;
    const __VLS_140 = ({ click: {} },
        { onClick: (__VLS_ctx.closeSolicitudModal) });
    const { default: __VLS_141 } = __VLS_137.slots;
    // @ts-ignore
    [closeSolicitudModal, solicitudSeleccionada, solicitudSeleccionada,];
    var __VLS_137;
    var __VLS_138;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex space-x-3" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['space-x-3']} */ ;
    const __VLS_142 = Button || Button;
    // @ts-ignore
    const __VLS_143 = __VLS_asFunctionalComponent1(__VLS_142, new __VLS_142({
        ...{ 'onClick': {} },
        variant: "outline",
        disabled: (__VLS_ctx.procesando),
    }));
    const __VLS_144 = __VLS_143({
        ...{ 'onClick': {} },
        variant: "outline",
        disabled: (__VLS_ctx.procesando),
    }, ...__VLS_functionalComponentArgsRest(__VLS_143));
    let __VLS_147;
    const __VLS_148 = ({ click: {} },
        { onClick: (...[$event]) => {
                if (!(__VLS_ctx.solicitudSeleccionada))
                    return;
                __VLS_ctx.actualizarEstadoSolicitud('EN_PROCESO');
                // @ts-ignore
                [procesando, actualizarEstadoSolicitud,];
            } });
    const { default: __VLS_149 } = __VLS_145.slots;
    (__VLS_ctx.procesando ? 'Actualizando...' : 'Marcar en proceso');
    // @ts-ignore
    [procesando,];
    var __VLS_145;
    var __VLS_146;
    const __VLS_150 = Button || Button;
    // @ts-ignore
    const __VLS_151 = __VLS_asFunctionalComponent1(__VLS_150, new __VLS_150({
        ...{ 'onClick': {} },
        disabled: (__VLS_ctx.procesando),
    }));
    const __VLS_152 = __VLS_151({
        ...{ 'onClick': {} },
        disabled: (__VLS_ctx.procesando),
    }, ...__VLS_functionalComponentArgsRest(__VLS_151));
    let __VLS_155;
    const __VLS_156 = ({ click: {} },
        { onClick: (...[$event]) => {
                if (!(__VLS_ctx.solicitudSeleccionada))
                    return;
                __VLS_ctx.actualizarEstadoSolicitud('COMPLETADO');
                // @ts-ignore
                [procesando, actualizarEstadoSolicitud,];
            } });
    const { default: __VLS_157 } = __VLS_153.slots;
    (__VLS_ctx.procesando ? 'Actualizando...' : 'Marcar completado');
    // @ts-ignore
    [procesando,];
    var __VLS_153;
    var __VLS_154;
}
// @ts-ignore
[];
var __VLS_123;
var __VLS_124;
const __VLS_158 = Modal || Modal;
// @ts-ignore
const __VLS_159 = __VLS_asFunctionalComponent1(__VLS_158, new __VLS_158({
    ...{ 'onClose': {} },
    modelValue: (__VLS_ctx.showAnularModal),
    title: "Anular Certificado",
}));
const __VLS_160 = __VLS_159({
    ...{ 'onClose': {} },
    modelValue: (__VLS_ctx.showAnularModal),
    title: "Anular Certificado",
}, ...__VLS_functionalComponentArgsRest(__VLS_159));
let __VLS_163;
const __VLS_164 = ({ close: {} },
    { onClose: (__VLS_ctx.closeAnularModal) });
const { default: __VLS_165 } = __VLS_161.slots;
if (__VLS_ctx.certificadoSeleccionado) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "space-y-4" },
    });
    /** @type {__VLS_StyleScopedClasses['space-y-4']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "bg-red-50 border border-red-200 rounded-lg p-4" },
    });
    /** @type {__VLS_StyleScopedClasses['bg-red-50']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-red-200']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['p-4']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-sm text-red-800 mb-2" },
    });
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-red-800']} */ ;
    /** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "space-y-2 text-sm" },
    });
    /** @type {__VLS_StyleScopedClasses['space-y-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (__VLS_ctx.certificadoSeleccionado.usuario.nombres);
    (__VLS_ctx.certificadoSeleccionado.usuario.apellidos);
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (__VLS_ctx.certificadoSeleccionado.actividad.nombre);
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
    __VLS_asFunctionalElement1(__VLS_intrinsics.textarea, __VLS_intrinsics.textarea)({
        value: (__VLS_ctx.motivoAnulacion),
        rows: "3",
        required: true,
        placeholder: "Describe el motivo de la anulación...",
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
        ...{ class: "flex justify-end space-x-3 pt-4 border-t" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-end']} */ ;
    /** @type {__VLS_StyleScopedClasses['space-x-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['pt-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-t']} */ ;
    const __VLS_166 = Button || Button;
    // @ts-ignore
    const __VLS_167 = __VLS_asFunctionalComponent1(__VLS_166, new __VLS_166({
        ...{ 'onClick': {} },
        variant: "outline",
    }));
    const __VLS_168 = __VLS_167({
        ...{ 'onClick': {} },
        variant: "outline",
    }, ...__VLS_functionalComponentArgsRest(__VLS_167));
    let __VLS_171;
    const __VLS_172 = ({ click: {} },
        { onClick: (__VLS_ctx.closeAnularModal) });
    const { default: __VLS_173 } = __VLS_169.slots;
    // @ts-ignore
    [showAnularModal, closeAnularModal, closeAnularModal, certificadoSeleccionado, certificadoSeleccionado, certificadoSeleccionado, certificadoSeleccionado, motivoAnulacion,];
    var __VLS_169;
    var __VLS_170;
    const __VLS_174 = Button || Button;
    // @ts-ignore
    const __VLS_175 = __VLS_asFunctionalComponent1(__VLS_174, new __VLS_174({
        ...{ 'onClick': {} },
        variant: "danger",
        disabled: (!__VLS_ctx.motivoAnulacion.trim() || __VLS_ctx.procesando),
    }));
    const __VLS_176 = __VLS_175({
        ...{ 'onClick': {} },
        variant: "danger",
        disabled: (!__VLS_ctx.motivoAnulacion.trim() || __VLS_ctx.procesando),
    }, ...__VLS_functionalComponentArgsRest(__VLS_175));
    let __VLS_179;
    const __VLS_180 = ({ click: {} },
        { onClick: (__VLS_ctx.confirmarAnulacion) });
    const { default: __VLS_181 } = __VLS_177.slots;
    (__VLS_ctx.procesando ? 'Anulando...' : 'Anular Certificado');
    // @ts-ignore
    [procesando, procesando, motivoAnulacion, confirmarAnulacion,];
    var __VLS_177;
    var __VLS_178;
}
// @ts-ignore
[];
var __VLS_161;
var __VLS_162;
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
//# sourceMappingURL=Certificados.vue.js.map