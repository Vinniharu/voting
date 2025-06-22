import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Consistent date formatting to avoid hydration mismatch
const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

const shortMonths = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
]

export function formatDate(date: string | Date): string {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = months[d.getMonth()]
  const day = d.getDate()
  
  return `${month} ${day}, ${year}`
}

export function formatTime(time: string): string {
  const d = new Date(`1970-01-01T${time}`)
  const hours = d.getHours()
  const minutes = d.getMinutes().toString().padStart(2, '0')
  const ampm = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours % 12 || 12
  
  return `${displayHours}:${minutes} ${ampm}`
}

export function formatDateTime(dateTime: string | Date): string {
  const d = new Date(dateTime)
  const year = d.getFullYear()
  const month = shortMonths[d.getMonth()]
  const day = d.getDate()
  const hours = d.getHours()
  const minutes = d.getMinutes().toString().padStart(2, '0')
  const ampm = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours % 12 || 12
  
  return `${month} ${day}, ${year} ${displayHours}:${minutes} ${ampm}`
}

export function formatDateWithTime(dateString: string): string {
  const date = new Date(dateString)
  const year = date.getFullYear()
  const month = months[date.getMonth()]
  const day = date.getDate()
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  
  return `${month} ${day}, ${year} at ${hours}:${minutes}`
}

export function generateSessionId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
} 