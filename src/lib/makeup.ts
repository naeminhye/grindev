import { format, subDays, differenceInCalendarDays } from "date-fns";

export type MakeupDay = {
  date: string; // "YYYY-MM-DD"
  daysAgo: number;
  problemId: string;
  problemTitle: string;
  difficulty: string;
  topics: string[];
  starCost: number;
  alreadySolved: boolean;
};

export function getMakeupCost(daysAgo: number): number {
  if (daysAgo === 1) return 5;
  if (daysAgo === 2) return 8;
  if (daysAgo === 3) return 12;
  if (daysAgo <= 6) return 18;
  return 25;
}

export function getMakeupDates(lookbackDays = 30): string[] {
  const today = new Date();
  const dates: string[] = [];
  for (let i = 1; i <= lookbackDays; i++) {
    dates.push(format(subDays(today, i), "yyyy-MM-dd"));
  }
  return dates;
}

export function getDaysAgo(date: string): number {
  return differenceInCalendarDays(new Date(), new Date(date));
}
