export function simulatePortfolio(roundups, prices, latestPrice) {
  let shares = 0;
  let totalInvested = 0;
  const history = [];

  if (!Array.isArray(prices) || prices.length === 0) {
    console.warn("No price data provided to simulatePortfolio");
    return { shares: 0, totalInvested: 0, currentValue: 0, history: [] };
  }

  const sortedPrices = [...prices].sort((a, b) => new Date(a.date) - new Date(b.date));

  for (let r of roundups) {
    const rDate = new Date(r.date);

    // find closest price on/before roundup date
    const priceEntry = [...sortedPrices].reverse().find(p => {
      if (!p.date || !p.close) {
        console.warn("Bad price entry:", p);
        return false;
      }
      return new Date(p.date) <= rDate;
    });

    if (!priceEntry) {
      console.warn(`No matching price found for roundup date: ${r.date}`);
      continue;
    }

    const price = priceEntry.close;
    const boughtShares = r.amount / price;
    shares += boughtShares;
    totalInvested += r.amount;

    history.push({
      date: r.date,
      invested: r.amount,
      price,
      boughtShares,
      totalShares: shares,
      totalInvested,
      valueNow: shares * latestPrice,
      gainLoss: (shares * latestPrice) - totalInvested,
    });
  }

  const currentValue = shares * latestPrice;

  console.log("Simulation complete. History:", history);

  return { shares, totalInvested, currentValue, history };
}
