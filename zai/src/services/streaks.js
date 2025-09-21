// src/services/streaks.js
export function calculateStreaks(roundups) {
  const today = new Date();
  const weeklyTotals = {};

  // group roundups by week
  roundups?.forEach(r => {
    const d = new Date(r.date);
    const weekStart = new Date(d.setDate(d.getDate() - d.getDay() + 1));
    const weekKey = weekStart.toISOString().slice(0, 10);
    weeklyTotals[weekKey] = (weeklyTotals[weekKey] || 0) + r.amount;
  });

  // generate past 52 weeks
  const weeks = [];
  for (let i = 0; i < 52; i++) {
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1 - i * 7);
    const key = weekStart.toISOString().slice(0, 10);
    weeks.unshift({ week: key, invested: weeklyTotals[key] || 0 });
  }

  // calculate streaks
  let currentStreak = 0;
  let longestStreak = 0;
  let streakRunning = false;

  weeks.forEach(w => {
    if (w.invested >= 1) {
      if (streakRunning) {
        currentStreak++;
      } else {
        streakRunning = true;
        currentStreak = 1;
      }
      if (currentStreak > longestStreak) longestStreak = currentStreak;
    } else {
      streakRunning = false;
      currentStreak = 0;
    }
  });

  return {
    currentStreak,
    longestStreak,
    weeklyTotals: weeks,
  };
}
