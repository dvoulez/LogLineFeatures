import { format, formatDistanceToNow, isValid, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"

export const dateUtils = {
  /**
   * Format date to localized string
   */
  formatDate(date: Date | string, pattern = "dd/MM/yyyy"): string {
    const dateObj = typeof date === "string" ? parseISO(date) : date
    if (!isValid(dateObj)) return "Data inválida"
    return format(dateObj, pattern, { locale: ptBR })
  },

  /**
   * Format date and time to localized string
   */
  formatDateTime(date: Date | string, pattern = "dd/MM/yyyy HH:mm"): string {
    const dateObj = typeof date === "string" ? parseISO(date) : date
    if (!isValid(dateObj)) return "Data inválida"
    return format(dateObj, pattern, { locale: ptBR })
  },

  /**
   * Format relative time (e.g., "há 2 horas")
   */
  formatRelative(date: Date | string): string {
    const dateObj = typeof date === "string" ? parseISO(date) : date
    if (!isValid(dateObj)) return "Data inválida"
    return formatDistanceToNow(dateObj, { addSuffix: true, locale: ptBR })
  },

  /**
   * Format time only (HH:mm)
   */
  formatTime(date: Date | string): string {
    return this.formatDate(date, "HH:mm")
  },

  /**
   * Check if date is valid
   */
  isValidDate(date: any): boolean {
    if (!date) return false
    const dateObj = typeof date === "string" ? parseISO(date) : date
    return isValid(dateObj)
  },
}
