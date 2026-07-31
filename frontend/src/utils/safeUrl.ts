// Solo permite esquemas http/https en enlaces que vienen de datos guardados
// por el usuario (curso/evento/paralelo) — evita que un "javascript:" URI
// guardado en el campo "link" se ejecute al hacer click en :href.
export function safeHttpUrl(url?: string | null): string | null {
  if (!url) return null
  return /^https?:\/\//i.test(url.trim()) ? url : null
}
