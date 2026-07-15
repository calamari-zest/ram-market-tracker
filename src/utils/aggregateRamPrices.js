import { parse, format } from 'date-fns';

export function aggregateRamPrices(ramData) {
  // Create maps to store aggregated prices by date and DDR type
  const priceMap = new Map();
  const ddr4Map = new Map();
  const ddr5Map = new Map();

  ramData.forEach(ram => {
    ram.prices.forEach(pricePoint => {
      const date = pricePoint.date;
      const price = pricePoint.price;
      const ddrType = ram.type; // 'DDR4' or 'DDR5'

      // Overall aggregation
      if (!priceMap.has(date)) {
        priceMap.set(date, {
          date,
          totalPrice: 0,
          count: 0,
          minPrice: Infinity,
          maxPrice: -Infinity,
          prices: []
        });
      }

      const aggregated = priceMap.get(date);
      aggregated.totalPrice += price;
      aggregated.count += 1;
      aggregated.minPrice = Math.min(aggregated.minPrice, price);
      aggregated.maxPrice = Math.max(aggregated.maxPrice, price);
      aggregated.prices.push(price);

      // DDR4 specific aggregation
      if (ddrType === 'DDR4') {
        if (!ddr4Map.has(date)) {
          ddr4Map.set(date, {
            date,
            totalPrice: 0,
            count: 0,
            prices: []
          });
        }
        const ddr4Data = ddr4Map.get(date);
        ddr4Data.totalPrice += price;
        ddr4Data.count += 1;
        ddr4Data.prices.push(price);
      }

      // DDR5 specific aggregation
      if (ddrType === 'DDR5') {
        if (!ddr5Map.has(date)) {
          ddr5Map.set(date, {
            date,
            totalPrice: 0,
            count: 0,
            prices: []
          });
        }
        const ddr5Data = ddr5Map.get(date);
        ddr5Data.totalPrice += price;
        ddr5Data.count += 1;
        ddr5Data.prices.push(price);
      }
    });
  });

  // Convert maps to arrays and calculate averages
  const aggregatedData = Array.from(priceMap.values())
    .map(item => ({
      date: item.date,
      averagePrice: item.totalPrice / item.count,
      minPrice: item.minPrice,
      maxPrice: item.maxPrice,
      medianPrice: calculateMedian(item.prices),
      count: item.count
    }))
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const ddr4Data = Array.from(ddr4Map.values())
    .map(item => ({
      date: item.date,
      ddr4Price: item.totalPrice / item.count
    }))
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const ddr5Data = Array.from(ddr5Map.values())
    .map(item => ({
      date: item.date,
      ddr5Price: item.totalPrice / item.count
    }))
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  // Merge all data
  return aggregatedData.map(item => {
    const ddr4 = ddr4Data.find(d => d.date === item.date);
    const ddr5 = ddr5Data.find(d => d.date === item.date);
    return {
      ...item,
      ddr4Price: ddr4?.ddr4Price || null,
      ddr5Price: ddr5?.ddr5Price || null
    };
  });
}

function calculateMedian(prices) {
  const sorted = [...prices].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

export function formatDate(dateStr) {
  try {
    // Try parsing as ISO date first (for API data with timestamps)
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return format(date, 'MMM dd, yyyy HH:mm');
    }
    // Fallback to original format
    return format(parse(dateStr, 'yyyy-MM-dd', new Date()), 'MMM dd, yyyy');
  } catch (error) {
    console.error('Error formatting date:', dateStr, error);
    return dateStr;
  }
}
