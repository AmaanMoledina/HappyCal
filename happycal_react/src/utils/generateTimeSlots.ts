import { Temporal } from '@js-temporal/polyfill'
import { serializeTime } from './serializeTime'

/**
 * Generate time slot strings from dates and time range
 * @param dates Array of dates to generate slots for
 * @param startTime Start time string (e.g., "9:00 AM")
 * @param endTime End time string (e.g., "5:00 PM")
 * @param timezone Timezone string
 * @returns Array of time slot strings in HHmm-DDMMYYYY format
 */
export const generateTimeSlots = (
  dates: Date[],
  startTime: string,
  endTime: string,
  timezone: string = Intl.DateTimeFormat().resolvedOptions().timeZone
): string[] => {
  const parseTime = (timeStr: string): { hour: number; minute: number } => {
    const [time, period] = timeStr.split(' ')
    const [hour, minute] = time.split(':').map(Number)
    let hour24 = hour
    if (period === 'PM' && hour !== 12) hour24 += 12
    if (period === 'AM' && hour === 12) hour24 = 0
    return { hour: hour24, minute: minute || 0 }
  }

  const start = parseTime(startTime)
  const end = parseTime(endTime)

  const slots: string[] = []

  dates.forEach(date => {
    const plainDate = Temporal.PlainDate.from({
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDate(),
    })

    // Generate hourly slots from start to end (at the top of each hour, HH00)
    let currentHour = start.hour
    while (currentHour < end.hour || (currentHour === end.hour && start.minute === 0)) {
      const zonedDateTime = plainDate
        .toZonedDateTime({ timeZone: timezone, plainTime: Temporal.PlainTime.from({ hour: currentHour, minute: 0 }) })
        .withTimeZone('UTC')

      slots.push(serializeTime(zonedDateTime, true))
      currentHour++
      
      // Stop if we've reached the end hour and it's not at the top of the hour
      if (currentHour > end.hour || (currentHour === end.hour && end.minute === 0)) {
        break
      }
    }
  })

  return slots
}

