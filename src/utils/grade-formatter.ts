/**
 * Utility functions for formatting grades consistently throughout the application
 */

/**
 * Formats a grade value to always show one decimal place
 * Examples: 5 -> "5.0", 7.5 -> "7.5", 8.25 -> "8.3" (rounded)
 * @param value - The numeric grade value
 * @returns Formatted string with one decimal place
 */
export function formatGrade(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) {
    return ''
  }
  return value.toFixed(1)
}

/**
 * Formats a grade value for input display (unlike formatGrade, this preserves empty for 0)
 * Used in input fields where we want to show empty instead of "0.0"
 * @param value - The numeric grade value
 * @returns Formatted string with one decimal place, or empty string if 0/null/undefined
 */
export function formatGradeInput(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value) || value === 0) {
    return ''
  }
  return value.toFixed(1)
}

/**
 * Parses a grade input string to a number
 * Handles both comma and dot as decimal separators
 * @param value - The string value from input
 * @returns Parsed number or 0 if invalid
 */
export function parseGradeInput(value: string): number {
  const normalized = value.trim().replace(',', '.')
  if (normalized === '' || normalized === '.') {
    return 0
  }
  const numericValue = parseFloat(normalized)
  return isNaN(numericValue) ? 0 : numericValue
}

/**
 * Validates if a grade input string is valid
 * @param value - The string value from input
 * @param maxScore - Maximum allowed score
 * @returns True if valid
 */
export function isValidGradeInput(value: string, maxScore: number): boolean {
  const normalized = value.trim().replace(',', '.')
  if (normalized === '' || normalized === '.') {
    return true
  }
  const numericValue = parseFloat(normalized)
  if (isNaN(numericValue)) {
    return false
  }
  return numericValue >= 0 && numericValue <= maxScore
}
