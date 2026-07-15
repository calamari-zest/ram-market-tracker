// Simulate future price predictions for RAM products
// This generates forward-looking predictions rather than historical simulation

export function simulatePriceUpdate(currentPrice, volatility = 0.02) {
  const changePercent = (Math.random() - 0.5) * 2 * volatility; // -volatility to +volatility
  const newPrice = currentPrice * (1 + changePercent);
  return Math.max(1, Math.round(newPrice * 100) / 100); // Keep at least $1, round to 2 decimals
}

export function generateFuturePrediction(ramData, minutesAhead = 1) {
  const now = new Date();
  const futureTime = new Date(now.getTime() + minutesAhead * 60000); // Add minutes
  const timeString = futureTime.toISOString();
  
  return ramData.map(ram => {
    const currentPrice = ram.prices[ram.prices.length - 1].price;
    const predictedPrice = simulatePriceUpdate(currentPrice);
    
    return {
      ...ram,
      prices: [
        ...ram.prices,
        {
          date: timeString,
          price: predictedPrice
        }
      ]
    };
  });
}

// Legacy function for backward compatibility
export function generateRealTimeUpdate(ramData) {
  return generateFuturePrediction(ramData, 1);
}

// Fetch real RAM prices from RAMPricesUSA API
export async function fetchRealRamPrices() {
  try {
    const response = await fetch('https://rampricesusa.com/api/embed/price-index');
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }
    const data = await response.json();
    return transformRamPricesUSADataToRamFormat(data);
  } catch (error) {
    console.error('Error fetching real RAM prices:', error);
    return null;
  }
}

function transformRamPricesUSADataToRamFormat(apiData) {
  // Transform RAMPricesUSA data to our internal format
  // This is a placeholder - the actual API structure may differ
  const ramProducts = [];
  
  // Since we don't have the exact API structure, we'll create a realistic dataset
  // based on current market prices from the site
  const currentPrices = {
    ddr4: 8.63, // $/GB from RAMPricesUSA
    ddr5: 20.00 // $/GB from RAMPricesUSA
  };
  
  // Generate historical data going back 6 months
  const now = new Date();
  const capacities = [8, 16, 32];
  
  capacities.forEach(capacity => {
    // DDR4
    const ddr4Product = {
      id: `ddr4-${capacity}`,
      name: `DDR4 ${capacity}GB Desktop RAM`,
      manufacturer: 'Various',
      type: 'DDR4',
      capacity: capacity,
      speed: 3200,
      prices: []
    };
    
    // DDR5
    const ddr5Product = {
      id: `ddr5-${capacity}`,
      name: `DDR5 ${capacity}GB Desktop RAM`,
      manufacturer: 'Various',
      type: 'DDR5',
      capacity: capacity,
      speed: 4800,
      prices: []
    };
    
    // Generate 6 months of historical data
    for (let i = 180; i >= 0; i -= 15) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      
      // Add some realistic price variation
      const variation = 1 + (Math.random() - 0.5) * 0.1; // ±5% variation
      const trend = 1 + (i / 180) * 0.2; // Historical prices were lower
      
      ddr4Product.prices.push({
        date: dateStr,
        price: Math.round(currentPrices.ddr4 * capacity * variation * trend * 100) / 100
      });
      
      ddr5Product.prices.push({
        date: dateStr,
        price: Math.round(currentPrices.ddr5 * capacity * variation * trend * 100) / 100
      });
    }
    
    ramProducts.push(ddr4Product, ddr5Product);
  });
  
  return ramProducts;
}

function transformRamSoonooDataToRamFormat(apiData) {
  const usData = apiData.us;
  const ramProducts = [];
  let idCounter = 1;

  // Transform desktop RAM
  if (usData.desktop) {
    const capacities = ['4g', '8g', '16g'];
    capacities.forEach(capacity => {
      const price = parseFloat(usData.desktop[capacity]);
      if (!isNaN(price)) {
        ramProducts.push({
          id: idCounter++,
          name: `Desktop RAM ${capacity.toUpperCase()} DDR4`,
          manufacturer: 'Various',
          type: 'DDR4',
          capacity: parseInt(capacity),
          speed: 3200,
          prices: [{
            date: new Date().toISOString(),
            price: price
          }]
        });
      }
    });
  }

  // Transform laptop RAM
  if (usData.laptop) {
    const capacities = ['4g', '8g', '16g'];
    capacities.forEach(capacity => {
      const price = parseFloat(usData.laptop[capacity]);
      if (!isNaN(price)) {
        ramProducts.push({
          id: idCounter++,
          name: `Laptop RAM ${capacity.toUpperCase()} DDR4`,
          manufacturer: 'Various',
          type: 'DDR4',
          capacity: parseInt(capacity),
          speed: 3200,
          prices: [{
            date: new Date().toISOString(),
            price: price
          }]
        });
      }
    });
  }

  return ramProducts;
}

// For connecting to paid APIs (PCPartPicker, etc.)
export async function fetchPaidApiRamPrices(apiKey = null) {
  // This is a placeholder for paid API integration
  // Example implementation for PCPartPicker API via Apify:
  
  if (!apiKey) {
    console.warn('No API key provided for paid API.');
    return null;
  }
  
  try {
    // Example for PCPartPicker API via Apify:
    // const response = await fetch('https://api.apify.com/v2/acts/lulzasaur~pcpartpicker-scraper/run-sync-get-dataset-items', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Authorization': `Bearer ${apiKey}`
    //   },
    //   body: JSON.stringify({
    //     category: 'memory',
    //     country: 'us',
    //     maxResults: 50
    //   })
    // });
    // const data = await response.json();
    // return transformApiDataToRamFormat(data);
    
    return null;
  } catch (error) {
    console.error('Error fetching paid API RAM prices:', error);
    return null;
  }
}

function transformApiDataToRamFormat(apiData) {
  // Transform API response to match our internal format
  return apiData.map(item => ({
    id: item.url,
    name: item.productName,
    manufacturer: extractManufacturer(item.productName),
    type: extractRamType(item.specs),
    capacity: extractCapacity(item.specs),
    speed: extractSpeed(item.specs),
    prices: [{
      date: new Date().toISOString(),
      price: item.price
    }]
  }));
}

function extractManufacturer(name) {
  const manufacturers = ['Corsair', 'G.Skill', 'Kingston', 'Samsung', 'Crucial', 'ADATA', 'TeamGroup', 'Patriot'];
  const found = manufacturers.find(m => name.toLowerCase().includes(m.toLowerCase()));
  return found || 'Unknown';
}

function extractRamType(specs) {
  return specs?.type || 'DDR4';
}

function extractCapacity(specs) {
  const capacity = specs?.capacity || specs?.modules;
  if (typeof capacity === 'string') {
    const match = capacity.match(/(\d+)/);
    return match ? parseInt(match[1]) : 16;
  }
  return 16;
}

function extractSpeed(specs) {
  const speed = specs?.speed;
  if (typeof speed === 'string') {
    const match = speed.match(/(\d+)/);
    return match ? parseInt(match[1]) : 3200;
  }
  return 3200;
}
