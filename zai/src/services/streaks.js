export function calculateStreaks(roundups) {
  const today = new Date();
  const weeklyTotalsMap = {};

  // Sum roundups by ISO week starting Monday
  (roundups || []).forEach((r) => {
    const d = new Date(r.date);
    if (isNaN(d)) return;
    const monday = new Date(d);
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7)); // back to Monday
    const key = monday.toISOString().slice(0, 10);
    weeklyTotalsMap[key] =
      (weeklyTotalsMap[key] || 0) + Number(r.amount || 0);
  });

  // Build last 52 weeks
  const weeklyTotals = [];
  for (let i = 51; i >= 0; i--) {
    const monday = new Date(today);
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
    monday.setDate(monday.getDate() - i * 7);
    const key = monday.toISOString().slice(0, 10);
    weeklyTotals.push({ week: key, invested: weeklyTotalsMap[key] || 0 });
  }

  // Calculate streaks
  let currentStreak = 0,
    longestStreak = 0,
    run = 0;
  weeklyTotals.forEach((w) => {
    if (w.invested >= 1) {
      run += 1;
      currentStreak = run;
      if (run > longestStreak) longestStreak = run;
    } else {
      run = 0;
    }
  });

  return { currentStreak, longestStreak, weeklyTotals };
}
