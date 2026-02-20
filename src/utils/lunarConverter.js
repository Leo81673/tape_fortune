import KoreanLunarCalendar from 'korean-lunar-calendar';

/**
 * Convert a lunar date to solar date.
 * Uses the korean-lunar-calendar library.
 */
export function lunarToSolar(year, month, day) {
  const calendar = new KoreanLunarCalendar();
  const valid = calendar.setLunarDate(year, month, day, false);
  if (!valid) {
    throw new Error('유효하지 않은 음력 날짜입니다.');
  }
  const solar = calendar.getSolarCalendar();
  return {
    year: solar.year,
    month: solar.month,
    day: solar.day
  };
}
