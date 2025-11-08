import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Type aliases for common number/string unions
type NumberOrString = number | string | null | undefined;

interface FormatNumberOptions {
  locale?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  currency?: string;
  style?: 'decimal' | 'currency' | 'percent';
}

/**
 * Formats a number with commas as thousands separators
 * @param value - The number to format
 * @param options - Formatting options
 * @returns Formatted number string
 */
export function formatNumber(
  value: NumberOrString,
  options: FormatNumberOptions = {}
): string {
  if (value === null || value === undefined || value === '') return '0';
  
  const numValue = typeof value === 'string' ? Number.parseFloat(value) : value;
  if (Number.isNaN(numValue)) return '0';

  const {
    locale = 'en-US',
    minimumFractionDigits = 0,
    maximumFractionDigits = 0,
    currency = 'USD',
    style = 'decimal'
  } = options;

  return new Intl.NumberFormat(locale, {
    style,
    currency: style === 'currency' ? currency : undefined,
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(numValue);
}

/**
 * Formats a price with currency
 * @param price - The price to format
 * @param currency - The currency code (default: 'EGP')
 * @param locale - The locale for formatting (default: 'en-EG')
 */
export function formatPrice(
  price: NumberOrString,
  currency: string = 'EGP',
  locale: string = 'en-US'
): string {
  if (price === null || price === undefined || price === '') return '0 ' + currency;
  
  const numPrice = typeof price === 'string' ? Number.parseFloat(price) : price;
  if (Number.isNaN(numPrice)) return '0 ' + currency;

  // For EGP, use simple number formatting with currency suffix
  if (currency === 'EGP') {
    return `${formatNumber(numPrice)} ${currency}`;
  }

  // For other currencies, use proper currency formatting
  return formatNumber(numPrice, { style: 'currency', currency, locale });
}

/**
 * Formats area with unit
 * @param area - The area to format
 * @param unit - The unit (default: 'm²')
 */
export function formatArea(
  area: NumberOrString,
  unit: string = 'm²'
): string {
  if (area === null || area === undefined || area === '') return '0' + unit;
  
  const numArea = typeof area === 'string' ? Number.parseFloat(area) : area;
  if (Number.isNaN(numArea)) return '0' + unit;

  return `${formatNumber(numArea)} ${unit}`;
}

/**
 * Truncates text to specified length with ellipsis
 * @param text - The text to truncate
 * @param maxLength - Maximum length before truncation
 * @returns Truncated text
 */
export function truncateText(text: string | null | undefined, maxLength: number = 100): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

/**
 * Debounce function to limit the rate of function execution
 * @param func - The function to debounce
 * @param wait - The delay in milliseconds
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
