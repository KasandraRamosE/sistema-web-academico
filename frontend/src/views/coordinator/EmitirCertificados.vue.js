import { computed, onMounted, ref } from 'vue';
import Card from '@/components/common/Card.vue';
import Badge from '@/components/common/Badge.vue';
import Button from '@/components/common/Button.vue';
import { api } from '@/utils/api';
import { useAlertStore } from '@/stores/alert.store';
const alertStore = useAlertStore();
const loading = ref(false);
const processingKey = ref(null);
const carreras = ref([]);
const cursos = ref([]);
const eventos = ref([]);
const solicitudes = ref([]);
const plantillasVigentesCursos = ref({});
const plantillasVigentesEventos = ref({});
const certificados = ref([]);
const searchTerm = ref('');
const tipoFiltro = ref('');
const estadoFiltro = ref('');
const solicitudesView = computed(() => {
    const cursosByName = new Map(cursos.value.map(c => [c.nombre, c]));
    const eventosByName = new Map(eventos.value.map(e => [e.nombre, e]));
    return solicitudes.value.map(item => {
        const isCurso = Boolean(item.codigoParalelo);
        const curso = isCurso ? cursosByName.get(item.nombreActividad) : undefined;
        const evento = !isCurso ? eventosByName.get(item.nombreActividad) : undefined;
        const carreraId = isCurso ? curso?.idCarrera : evento?.idCarrera;
        const carreraNombre = isCurso
            ? (curso?.nombreCarrera || '')
            : (evento?.nombreCarrera || '');
        return {
            ...item,
            tipoActividad: isCurso ? 'CURSO' : 'EVENTO',
            idCurso: curso?.idCurso,
            idEvento: evento?.idEvento,
            carreraId,
            carreraNombre,
            canEmit: Boolean(isCurso ? curso?.idCurso : evento?.idEvento),
            templateVigente: isCurso
                ? Boolean(curso?.idCurso && plantillasVigentesCursos.value[curso.idCurso])
                : Boolean(evento?.idEvento && plantillasVigentesEventos.value[evento.idEvento])
        };
    });
});
const certificadosEmitidosMap = computed(() => {
    const map = new Map();
    certificados.value.forEach((certificado) => {
        if (String(certificado.estadoEmision) !== 'GENERADO')
            return;
        const key = `${String(certificado.tipoActividad || '')}-${String(certificado.nombreActividad || '')}`;
        map.set(key, (map.get(key) || 0) + 1);
    });
    return map;
});
const solicitudCursoMap = computed(() => {
    const map = new Map();
    solicitudesView.value
        .filter(item => item.tipoActividad === 'CURSO')
        .forEach((item) => {
        map.set(item.nombreActividad, item);
    });
    return map;
});
const activities = computed(() => {
    const cursosRows = cursos.value.map((curso) => {
        const solicitud = solicitudCursoMap.value.get(curso.nombre);
        const key = `CURSO-${curso.nombre}`;
        const emittedCount = certificadosEmitidosMap.value.get(key) || 0;
        const templateVigente = Boolean(plantillasVigentesCursos.value[curso.idCurso]);
        const estado = emittedCount > 0
            ? 'EMITIDO'
            : solicitud && templateVigente
                ? 'LISTO'
                : 'NO_EMITIDO';
        return {
            key,
            tipo: 'CURSO',
            nombre: curso.nombre,
            carreraNombre: curso.nombreCarrera || 'Sin carrera',
            estado,
            canEmit: estado === 'LISTO',
            idCurso: curso.idCurso,
            idEvento: undefined,
            idSolicitud: solicitud?.idSolicitud,
            codigoParalelo: solicitud?.codigoParalelo ?? null,
            nombreDocente: solicitud?.nombreDocente ?? null,
            cantidadAprobados: solicitud?.cantidadAprobados ?? null,
            fechaSolicitud: solicitud?.fechaSolicitud ?? null,
            fechaEvento: undefined,
            templateVigente,
            certificadosEmitidos: emittedCount
        };
    });
    const eventosRows = eventos.value.map(evento => {
        const key = `EVENTO-${evento.nombre}`;
        const emittedCount = certificadosEmitidosMap.value.get(key) || 0;
        const templateVigente = Boolean(plantillasVigentesEventos.value[evento.idEvento]);
        const fechaPasada = evento.fechaHora ? new Date(evento.fechaHora) <= new Date() : false;
        const estado = emittedCount > 0
            ? 'EMITIDO'
            : templateVigente && fechaPasada
                ? 'LISTO'
                : 'NO_EMITIDO';
        return {
            key,
            tipo: 'EVENTO',
            nombre: evento.nombre,
            carreraNombre: evento.nombreCarrera || 'Sin carrera',
            estado,
            canEmit: estado === 'LISTO',
            idCurso: undefined,
            idEvento: evento.idEvento,
            idSolicitud: undefined,
            codigoParalelo: undefined,
            nombreDocente: undefined,
            cantidadAprobados: undefined,
            fechaSolicitud: undefined,
            fechaEvento: evento.fechaHora,
            templateVigente,
            certificadosEmitidos: emittedCount
        };
    });
    return [...cursosRows, ...eventosRows];
});
const filteredActivities = computed(() => {
    const term = searchTerm.value.trim().toLowerCase();
    return activities.value.filter(item => {
        const searchOk = !term
            || item.nombre.toLowerCase().includes(term)
            || (item.nombreDocente ?? '').toLowerCase().includes(term)
            || item.carreraNombre.toLowerCase().includes(term);
        const tipoOk = !tipoFiltro.value || item.tipo === tipoFiltro.value;
        const estadoOk = !estadoFiltro.value || item.estado === estadoFiltro.value;
        return searchOk && tipoOk && estadoOk;
    });
});
const loadCarreras = async () => {
    const response = await api.get('/coordinador/carreras');
    carreras.value = response;
};
const loadCursos = async () => {
    const response = await api.get('/cursos/todos');
    cursos.value = response;
};
const loadEventos = async () => {
    const response = await api.get('/eventos/todos');
    eventos.value = response;
};
const loadSolicitudes = async () => {
    const response = await api.get('/evaluaciones/solicitudes');
    solicitudes.value = response;
};
const loadCertificados = async () => {
    const response = await api.get('/certificados/admin');
    certificados.value = response;
};
const loadPlantillasVigentes = async () => {
    const cursoPairs = await Promise.all(cursos.value.map(async (curso) => {
        try {
            const historial = await api.get(`/plantillas/historial?idCurso=${curso.idCurso}`);
            return [curso.idCurso, historial.some(item => String(item.estado) === 'VIGENTE')];
        }
        catch {
            return [curso.idCurso, false];
        }
    }));
    const eventoPairs = await Promise.all(eventos.value.map(async (evento) => {
        try {
            const historial = await api.get(`/plantillas/historial?idEvento=${evento.idEvento}`);
            return [evento.idEvento, historial.some(item => String(item.estado) === 'VIGENTE')];
        }
        catch {
            return [evento.idEvento, false];
        }
    }));
    plantillasVigentesCursos.value = Object.fromEntries(cursoPairs);
    plantillasVigentesEventos.value = Object.fromEntries(eventoPairs);
};
const loadAll = async () => {
    loading.value = true;
    try {
        await Promise.all([loadCarreras(), loadCursos(), loadEventos(), loadSolicitudes(), loadCertificados()]);
        await loadPlantillasVigentes();
    }
    finally {
        loading.value = false;
    }
};
const ensurePlantillaVigente = async (payload) => {
    if (payload.idCurso) {
        const historial = await api.get(`/plantillas/historial?idCurso=${payload.idCurso}`);
        const vigente = historial.some(item => String(item.estado) === 'VIGENTE');
        if (!vigente) {
            throw new Error('No hay plantilla aprobada para este curso.');
        }
        return;
    }
    if (payload.idEvento) {
        const historial = await api.get(`/plantillas/historial?idEvento=${payload.idEvento}`);
        const vigente = historial.some(item => String(item.estado) === 'VIGENTE');
        if (!vigente) {
            throw new Error('No hay plantilla aprobada para este evento.');
        }
        return;
    }
    throw new Error('No se encontro la actividad para emitir.');
};
const emitirCurso = async (item) => {
    if (!item || !item.canEmit || item.tipo !== 'CURSO') {
        alertStore.push({ type: 'error', message: 'No se encontro la actividad para emitir.' });
        return;
    }
    processingKey.value = item.key;
    try {
        await ensurePlantillaVigente({ idCurso: item.idCurso, idEvento: item.idEvento });
        await api.post('/certificados/lote', {
            idCurso: item.idCurso,
            codigoParalelo: item.codigoParalelo
        });
        if (item.idSolicitud) {
            await api.patch(`/evaluaciones/solicitudes/${item.idSolicitud}?estado=COMPLETADO`);
        }
        alertStore.push({
            type: 'success',
            message: 'Emision completada. Los certificados se generaron en lote.'
        });
        await loadAll();
    }
    catch (error) {
        alertStore.push({
            type: 'error',
            message: error.message || 'No se pudo emitir el lote.'
        });
    }
    finally {
        processingKey.value = null;
    }
};
const emitirEvento = async (item) => {
    if (!item || !item.canEmit || item.tipo !== 'EVENTO' || !item.idEvento) {
        alertStore.push({ type: 'error', message: 'No se encontro la actividad para emitir.' });
        return;
    }
    processingKey.value = item.key;
    try {
        const solicitud = await api.post(`/evaluaciones/solicitudes/evento/${item.idEvento}`, {
            notas: 'Generada desde el panel de emisión'
        });
        await api.patch(`/evaluaciones/solicitudes/${solicitud.idSolicitud}?estado=COMPLETADO`);
        alertStore.push({
            type: 'success',
            message: `Certificados de ${item.nombre} emitidos correctamente.`
        });
        await loadAll();
    }
    catch (error) {
        alertStore.push({
            type: 'error',
            message: error.message || 'No se pudo emitir el evento.'
        });
    }
    finally {
        processingKey.value = null;
    }
};
const estadoLabel = (estado) => {
    switch (estado) {
        case 'LISTO':
            return 'Listo para emitir';
        case 'EMITIDO':
            return 'Emitido';
        case 'NO_EMITIDO':
            return 'No emitido';
        default:
            return estado;
    }
};
const estadoBadge = (estado) => {
    switch (estado) {
        case 'LISTO':
            return 'warning';
        case 'EMITIDO':
            return 'success';
        case 'NO_EMITIDO':
            return 'gray';
        default:
            return 'gray';
    }
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
onMounted(() => {
    loadAll();
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
    ...{ class: "flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between" },
});
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
/** @type {__VLS_StyleScopedClasses['sm:flex-row']} */ ;
/** @type {__VLS_StyleScopedClasses['sm:items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['sm:justify-between']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)({
    ...{ class: "text-3xl font-bold text-slate-900" },
});
/** @type {__VLS_StyleScopedClasses['text-3xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-slate-900']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "text-sm text-slate-500" },
});
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-slate-500']} */ ;
const __VLS_0 = Button || Button;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    ...{ 'onClick': {} },
    variant: "outline",
    size: "sm",
}));
const __VLS_2 = __VLS_1({
    ...{ 'onClick': {} },
    variant: "outline",
    size: "sm",
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
let __VLS_5;
const __VLS_6 = ({ click: {} },
    { onClick: (__VLS_ctx.loadAll) });
const { default: __VLS_7 } = __VLS_3.slots;
// @ts-ignore
[loadAll,];
var __VLS_3;
var __VLS_4;
const __VLS_8 = Card || Card;
// @ts-ignore
const __VLS_9 = __VLS_asFunctionalComponent1(__VLS_8, new __VLS_8({}));
const __VLS_10 = __VLS_9({}, ...__VLS_functionalComponentArgsRest(__VLS_9));
const { default: __VLS_13 } = __VLS_11.slots;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "grid gap-4 md:grid-cols-4" },
});
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
/** @type {__VLS_StyleScopedClasses['md:grid-cols-4']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "md:col-span-2" },
});
/** @type {__VLS_StyleScopedClasses['md:col-span-2']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
    ...{ class: "text-xs font-semibold uppercase tracking-wide text-slate-500" },
});
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
/** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
/** @type {__VLS_StyleScopedClasses['tracking-wide']} */ ;
/** @type {__VLS_StyleScopedClasses['text-slate-500']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    value: (__VLS_ctx.searchTerm),
    type: "text",
    placeholder: "Buscar por actividad o docente",
    ...{ class: "mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 focus:border-transparent focus:ring-2 focus:ring-emerald-400" },
});
/** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-slate-200']} */ ;
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2.5']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:border-transparent']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-emerald-400']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
    ...{ class: "text-xs font-semibold uppercase tracking-wide text-slate-500" },
});
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
/** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
/** @type {__VLS_StyleScopedClasses['tracking-wide']} */ ;
/** @type {__VLS_StyleScopedClasses['text-slate-500']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
    value: (__VLS_ctx.tipoFiltro),
    ...{ class: "mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 focus:border-transparent focus:ring-2 focus:ring-emerald-400" },
});
/** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-slate-200']} */ ;
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2.5']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:border-transparent']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-emerald-400']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "CURSO",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "EVENTO",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
    ...{ class: "text-xs font-semibold uppercase tracking-wide text-slate-500" },
});
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
/** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
/** @type {__VLS_StyleScopedClasses['tracking-wide']} */ ;
/** @type {__VLS_StyleScopedClasses['text-slate-500']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
    value: (__VLS_ctx.estadoFiltro),
    ...{ class: "mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 focus:border-transparent focus:ring-2 focus:ring-emerald-400" },
});
/** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-slate-200']} */ ;
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2.5']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:border-transparent']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-emerald-400']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "LISTO",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "NO_EMITIDO",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "EMITIDO",
});
// @ts-ignore
[searchTerm, tipoFiltro, estadoFiltro,];
var __VLS_11;
const __VLS_14 = Card || Card;
// @ts-ignore
const __VLS_15 = __VLS_asFunctionalComponent1(__VLS_14, new __VLS_14({}));
const __VLS_16 = __VLS_15({}, ...__VLS_functionalComponentArgsRest(__VLS_15));
const { default: __VLS_19 } = __VLS_17.slots;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "flex items-center justify-between" },
});
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({
    ...{ class: "text-lg font-semibold text-slate-900" },
});
/** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-slate-900']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "text-sm text-slate-500" },
});
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-slate-500']} */ ;
const __VLS_20 = Badge || Badge;
// @ts-ignore
const __VLS_21 = __VLS_asFunctionalComponent1(__VLS_20, new __VLS_20({
    variant: "primary",
    size: "sm",
}));
const __VLS_22 = __VLS_21({
    variant: "primary",
    size: "sm",
}, ...__VLS_functionalComponentArgsRest(__VLS_21));
const { default: __VLS_25 } = __VLS_23.slots;
(__VLS_ctx.filteredActivities.length);
// @ts-ignore
[filteredActivities,];
var __VLS_23;
if (__VLS_ctx.loading) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "py-8 text-center text-sm text-slate-500" },
    });
    /** @type {__VLS_StyleScopedClasses['py-8']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-slate-500']} */ ;
}
else if (__VLS_ctx.filteredActivities.length === 0) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "py-8 text-center text-sm text-slate-500" },
    });
    /** @type {__VLS_StyleScopedClasses['py-8']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-slate-500']} */ ;
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "mt-4 overflow-x-auto" },
    });
    /** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['overflow-x-auto']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.table, __VLS_intrinsics.table)({
        ...{ class: "w-full" },
    });
    /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.thead, __VLS_intrinsics.thead)({
        ...{ class: "bg-slate-50 border-b border-slate-200" },
    });
    /** @type {__VLS_StyleScopedClasses['bg-slate-50']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-b']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-slate-200']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
        ...{ class: "px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase" },
    });
    /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-left']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-slate-600']} */ ;
    /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
        ...{ class: "px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase" },
    });
    /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-left']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-slate-600']} */ ;
    /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
        ...{ class: "px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase" },
    });
    /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-left']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-slate-600']} */ ;
    /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
        ...{ class: "px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase" },
    });
    /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-left']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-slate-600']} */ ;
    /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
        ...{ class: "px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase" },
    });
    /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-right']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-slate-600']} */ ;
    /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.tbody, __VLS_intrinsics.tbody)({
        ...{ class: "divide-y divide-slate-200" },
    });
    /** @type {__VLS_StyleScopedClasses['divide-y']} */ ;
    /** @type {__VLS_StyleScopedClasses['divide-slate-200']} */ ;
    for (const [item] of __VLS_vFor((__VLS_ctx.filteredActivities))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
            key: (item.key),
            ...{ class: "hover:bg-slate-50" },
        });
        /** @type {__VLS_StyleScopedClasses['hover:bg-slate-50']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "px-4 py-3" },
        });
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "text-sm font-semibold text-slate-800" },
        });
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-slate-800']} */ ;
        (item.nombre);
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "text-xs text-slate-500" },
        });
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-slate-500']} */ ;
        (item.carreraNombre || 'Sin carrera');
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "px-4 py-3" },
        });
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
        const __VLS_26 = Badge || Badge;
        // @ts-ignore
        const __VLS_27 = __VLS_asFunctionalComponent1(__VLS_26, new __VLS_26({
            variant: (item.tipo === 'CURSO' ? 'primary' : 'secondary'),
            size: "sm",
        }));
        const __VLS_28 = __VLS_27({
            variant: (item.tipo === 'CURSO' ? 'primary' : 'secondary'),
            size: "sm",
        }, ...__VLS_functionalComponentArgsRest(__VLS_27));
        const { default: __VLS_31 } = __VLS_29.slots;
        (item.tipo);
        // @ts-ignore
        [filteredActivities, filteredActivities, loading,];
        var __VLS_29;
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "px-4 py-3" },
        });
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
        const __VLS_32 = Badge || Badge;
        // @ts-ignore
        const __VLS_33 = __VLS_asFunctionalComponent1(__VLS_32, new __VLS_32({
            variant: (__VLS_ctx.estadoBadge(item.estado)),
            size: "sm",
        }));
        const __VLS_34 = __VLS_33({
            variant: (__VLS_ctx.estadoBadge(item.estado)),
            size: "sm",
        }, ...__VLS_functionalComponentArgsRest(__VLS_33));
        const { default: __VLS_37 } = __VLS_35.slots;
        (__VLS_ctx.estadoLabel(item.estado));
        // @ts-ignore
        [estadoBadge, estadoLabel,];
        var __VLS_35;
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "px-4 py-3 text-sm text-slate-600" },
        });
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-slate-600']} */ ;
        if (item.tipo === 'CURSO') {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
            (item.nombreDocente || '-');
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
            (item.cantidadAprobados ?? '-');
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
            (item.fechaSolicitud ? __VLS_ctx.formatDatetime(item.fechaSolicitud) : '-');
        }
        else {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
            (item.fechaEvento ? __VLS_ctx.formatDatetime(item.fechaEvento) : '-');
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
            (item.templateVigente ? 'Aprobada' : 'Sin aprobar');
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
            (item.certificadosEmitidos ?? 0);
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "px-4 py-3 text-right" },
        });
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-right']} */ ;
        if (item.canEmit) {
            const __VLS_38 = Button || Button;
            // @ts-ignore
            const __VLS_39 = __VLS_asFunctionalComponent1(__VLS_38, new __VLS_38({
                ...{ 'onClick': {} },
                size: "sm",
                loading: (__VLS_ctx.processingKey === item.key),
            }));
            const __VLS_40 = __VLS_39({
                ...{ 'onClick': {} },
                size: "sm",
                loading: (__VLS_ctx.processingKey === item.key),
            }, ...__VLS_functionalComponentArgsRest(__VLS_39));
            let __VLS_43;
            const __VLS_44 = ({ click: {} },
                { onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.loading))
                            return;
                        if (!!(__VLS_ctx.filteredActivities.length === 0))
                            return;
                        if (!(item.canEmit))
                            return;
                        item.tipo === 'CURSO' ? __VLS_ctx.emitirCurso(item) : __VLS_ctx.emitirEvento(item);
                        // @ts-ignore
                        [formatDatetime, formatDatetime, processingKey, emitirCurso, emitirEvento,];
                    } });
            const { default: __VLS_45 } = __VLS_41.slots;
            // @ts-ignore
            [];
            var __VLS_41;
            var __VLS_42;
        }
        else if (item.estado === 'EMITIDO') {
            const __VLS_46 = Button || Button;
            // @ts-ignore
            const __VLS_47 = __VLS_asFunctionalComponent1(__VLS_46, new __VLS_46({
                variant: "outline",
                size: "sm",
                disabled: true,
            }));
            const __VLS_48 = __VLS_47({
                variant: "outline",
                size: "sm",
                disabled: true,
            }, ...__VLS_functionalComponentArgsRest(__VLS_47));
            const { default: __VLS_51 } = __VLS_49.slots;
            // @ts-ignore
            [];
            var __VLS_49;
        }
        else {
            const __VLS_52 = Button || Button;
            // @ts-ignore
            const __VLS_53 = __VLS_asFunctionalComponent1(__VLS_52, new __VLS_52({
                variant: "outline",
                size: "sm",
                disabled: true,
            }));
            const __VLS_54 = __VLS_53({
                variant: "outline",
                size: "sm",
                disabled: true,
            }, ...__VLS_functionalComponentArgsRest(__VLS_53));
            const { default: __VLS_57 } = __VLS_55.slots;
            // @ts-ignore
            [];
            var __VLS_55;
        }
        // @ts-ignore
        [];
    }
}
// @ts-ignore
[];
var __VLS_17;
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
//# sourceMappingURL=EmitirCertificados.vue.js.map