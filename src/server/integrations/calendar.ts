import { Solar } from 'lunar-typescript';
import holiday2026 from './holidays/2026.json';

const holidaySource = holiday2026.papers[0];
const dataSource = 'https://github.com/NateScarlet/holiday-cn/blob/159faa58969f6a89ecc671dc04001837c4dca13e/2026.json';

const exceptions = new Map(holiday2026.days.map(day => [day.date, { name: day.name, off: day.isOffDay }]));

export function shanghaiDate(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const get = (type: string) => parts.find(part => part.type === type)!.value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}

export function validateDate(value: string): void {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error('日期必须为 YYYY-MM-DD。');
  const parsed = new Date(`${value}T00:00:00Z`);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) throw new Error('日期不存在。');
  const year = parsed.getUTCFullYear();
  if (year < 1901 || year > 2099) throw new Error('日期范围为 1901 至 2099 年。');
}

export function queryCalendar(date = shanghaiDate(), count = 1) {
  validateDate(date);
  if (!Number.isInteger(count) || count < 1 || count > 62) throw new Error('查询天数必须为 1 至 62。');
  const start = new Date(`${date}T00:00:00Z`);
  const days = Array.from({ length: count }, (_, offset) => {
    const current = new Date(start.getTime() + offset * 86400000);
    const iso = current.toISOString().slice(0, 10);
    const solar = Solar.fromYmd(current.getUTCFullYear(), current.getUTCMonth() + 1, current.getUTCDate());
    const lunar = solar.getLunar();
    const exception = exceptions.get(iso);
    const policyKnown = current.getUTCFullYear() === holiday2026.year;
    const weekend = current.getUTCDay() === 0 || current.getUTCDay() === 6;
    const nextTerm = lunar.getNextJieQi(true);
    return {
      date: iso, weekday: ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'][current.getUTCDay()],
      isWeekend: weekend, holidayPolicyKnown: policyKnown,
      isWorkday: policyKnown ? !(exception?.off ?? weekend) : null,
      holidayName: exception?.name ?? null, isAdjustedWorkday: policyKnown ? exception?.off === false : null,
      lunar: { year: lunar.getYear(), month: lunar.getMonth(), day: lunar.getDay(), text: lunar.toString(), festivals: lunar.getFestivals() },
      solarTerm: lunar.getJieQi() || null,
      nextSolarTerm: nextTerm ? { name: nextTerm.getName(), at: `${nextTerm.getSolar().toYmdHms().replace(' ', 'T')}+08:00` } : null,
    };
  });
  return { days, publishedHolidayYears: [holiday2026.year], policyScope: '中国大陆全国节假日安排；不代表公司排班。', sources: [holidaySource, dataSource, 'https://github.com/6tail/lunar-typescript'] };
}
