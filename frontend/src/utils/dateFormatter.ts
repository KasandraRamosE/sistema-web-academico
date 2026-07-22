// dateString viene como "2026-06-13" o "2026-06-13T14:30:00". `new Date(string)`
// de JS interpreta ISO sin hora como UTC, lo que desplaza un día según el
// huso horario del navegador — por eso se arma la fecha campo por campo,
// forzando interpretación en hora local.
export const parseLocalDate = (dateString: string): Date => {
  if (dateString.length === 10) {
    const [year, month, day] = dateString.split('-')
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
  }

  const [datePart, timePart] = dateString.split('T')
  const [year, month, day] = datePart.split('-')
  const [hours = '0', minutes = '0', seconds = '0'] = (timePart?.split(':') || [])
  
  return new Date(
    parseInt(year),
    parseInt(month) - 1,
    parseInt(day),
    parseInt(hours),
    parseInt(minutes),
    parseInt(seconds)
  )
}

export const formatDate = (dateString: string, locale: string = 'es-ES'): string => {
  if (!dateString) return '-'
  
  try {
    const date = parseLocalDate(dateString)
    return date.toLocaleDateString(locale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  } catch {
    return '-'
  }
}

export const formatDateTime = (dateString: string, locale: string = 'es-ES'): string => {
  if (!dateString) return '-'
  
  try {
    const date = parseLocalDate(dateString)
    return date.toLocaleDateString(locale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return '-'
  }
}

// Si inicio y fin caen el mismo día, muestra solo ese día en vez de un rango
export const formatDateRange = (
  startDateString: string,
  endDateString: string,
  locale: string = 'es-ES'
): string => {
  if (!startDateString || !endDateString) return '-'
  
  try {
    const startDate = parseLocalDate(startDateString)
    const endDate = parseLocalDate(endDateString)
    
    const formatSingleDate = (date: Date) => {
      return date.toLocaleDateString(locale, {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
    }

    const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())
    const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate())
    
    if (startDateOnly.getTime() === endDateOnly.getTime()) {
      return formatSingleDate(startDate)
    }
    
    return `${formatSingleDate(startDate)} - ${formatSingleDate(endDate)}`
  } catch {
    return '-'
  }
}

export const formatTime = (dateString: string): string => {
  if (!dateString) return '-'
  
  try {
    const date = parseLocalDate(dateString)
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return '-'
  }
}
