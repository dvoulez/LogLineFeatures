import { z } from "zod"

export const validationUtils = {
  /**
   * Email validation schema
   */
  email: z.string().email("Email inválido"),

  /**
   * Phone validation schema (Brazilian format)
   */
  phone: z.string().regex(/^$$\d{2}$$\s\d{4,5}-\d{4}$/, "Telefone deve estar no formato (11) 99999-9999"),

  /**
   * CPF validation schema
   */
  cpf: z.string().regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, "CPF deve estar no formato 000.000.000-00"),

  /**
   * CNPJ validation schema
   */
  cnpj: z.string().regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, "CNPJ deve estar no formato 00.000.000/0000-00"),

  /**
   * Password validation schema
   */
  password: z.string().min(8, "Senha deve ter pelo menos 8 caracteres"),

  /**
   * Required string validation
   */
  requiredString: (message = "Campo obrigatório") => z.string().min(1, message),

  /**
   * Optional string validation
   */
  optionalString: z.string().optional(),

  /**
   * Positive number validation
   */
  positiveNumber: z.number().positive("Deve ser um número positivo"),

  /**
   * URL validation
   */
  url: z.string().url("URL inválida"),

  /**
   * Validate Brazilian phone number
   */
  validatePhone(phone: string): boolean {
    const cleaned = phone.replace(/\D/g, "")
    return cleaned.length === 10 || cleaned.length === 11
  },

  /**
   * Format phone number to Brazilian format
   */
  formatPhone(phone: string): string {
    const cleaned = phone.replace(/\D/g, "")
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`
    }
    if (cleaned.length === 11) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`
    }
    return phone
  },
}
