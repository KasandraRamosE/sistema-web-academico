/**
 * Composable usePagination
 * 
 * Maneja la lógica de paginación de datos de forma reutilizable.
 * Proporciona estado reactivo y métodos para navegar entre páginas.
 * 
 * @example
 * const { paginatedData, currentPage, pageSize, totalPages, goToPage } = usePagination(usuarios, { pageSize: 20 })
 */

import { ref, computed, watch, type Ref, type ComputedRef } from 'vue'


interface UsePaginationOptions {
  pageSize?: number
  initialPage?: number
}

export function usePagination<T>(
  data: Ref<T[]> | ComputedRef<T[]>,
  options: UsePaginationOptions = {}
) {
  const currentPage = ref(options.initialPage || 1)
  const pageSize = ref(options.pageSize || 10)

  const totalPages = computed(() => {
    return Math.ceil(data.value.length / pageSize.value)
  })

  const totalItems = computed(() => {
    return data.value.length
  })

  const startIndex = computed(() => {
    return (currentPage.value - 1) * pageSize.value
  })

  const endIndex = computed(() => {
    return Math.min(startIndex.value + pageSize.value, data.value.length)
  })

  const paginatedData = computed(() => {
    return data.value.slice(startIndex.value, endIndex.value)
  })

  const hasPreviousPage = computed(() => {
    return currentPage.value > 1
  })

  const hasNextPage = computed(() => {
    return currentPage.value < totalPages.value
  })

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages.value) {
      currentPage.value = page
    }
  }

  const goToPreviousPage = () => {
    if (hasPreviousPage.value) {
      currentPage.value--
    }
  }

  const goToNextPage = () => {
    if (hasNextPage.value) {
      currentPage.value++
    }
  }

  const goToFirstPage = () => {
    currentPage.value = 1
  }

  const goToLastPage = () => {
    currentPage.value = totalPages.value
  }

  const setPageSize = (size: number) => {
    pageSize.value = size
    currentPage.value = 1
  }

  const reset = () => {
    currentPage.value = options.initialPage || 1
    pageSize.value = options.pageSize || 10
  }

  /**
   * Ajusta la página actual si los datos cambian y la página actual
   * queda fuera del rango válido
   */
  watch([data, pageSize], () => {
    if (currentPage.value > totalPages.value && totalPages.value > 0) {
      currentPage.value = totalPages.value
    } else if (currentPage.value < 1 && totalPages.value > 0) {
      currentPage.value = 1
    }
  })

  return {
    currentPage,
    pageSize,

    totalPages,
    totalItems,
    startIndex,
    endIndex,
    paginatedData,
    hasPreviousPage,
    hasNextPage,

    goToPage,
    goToPreviousPage,
    goToNextPage,
    goToFirstPage,
    goToLastPage,
    setPageSize,
    reset
  }
}