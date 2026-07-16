import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { ramPriceData } from './data/ramPrices';
import { aggregateRamPrices, formatCurrency, formatDate } from './utils/aggregateRamPrices';
import { generateRealTimeUpdate } from './utils/realTimePriceSimulator';

function App() {
  const [selectedMetric, setSelectedMetric] = useState('averagePrice');
  const [ramData, setRamData] = useState(ramPriceData);
  const [isRealTime, setIsRealTime] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [updateInterval, setUpdateInterval] = useState(3000);
  const [useRealApi, setUseRealApi] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState(null);

  const aggregatedData = useMemo(() => {
    try {
      return aggregateRamPrices(ramData);
    } catch (error) {
      console.error('Error aggregating data:', error);
      return [];
    }
  }, [ramData]);

  const metrics = [
    { key: 'averagePrice', label: 'Average Price', color: '#3b82f6' },
    { key: 'medianPrice', label: 'Median Price', color: '#10b981' },
    { key: 'minPrice', label: 'Minimum Price', color: '#f59e0b' },
    { key: 'maxPrice', label: 'Maximum Price', color: '#ef4444' },
  ];

  const selectedMetricConfig = metrics.find(m => m.key === selectedMetric);

  const updatePrices = useCallback(() => {
    setRamData(prevData => {
      const updated = generateRealTimeUpdate(prevData);
      setLastUpdate(new Date());
      return updated;
    });
  }, []);

  useEffect(() => {
    let intervalId;
    if (isRealTime) {
      intervalId = setInterval(updatePrices, updateInterval);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isRealTime, updateInterval, updatePrices]);

  const toggleRealTime = () => {
    setIsRealTime(!isRealTime);
  };

  const resetData = () => {
    setRamData(ramPriceData);
    setLastUpdate(null);
    setApiError(null);
  };

  const toggleApiSource = () => {
    setUseRealApi(!useRealApi);
    setApiError(null);
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-800 mb-2">{formatDate(label)}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
          <p className="text-xs text-gray-500 mt-2">
            Based on {aggregatedData.find(d => d.date === label)?.count || 0} RAM products
          </p>
        </div>
      );
    }
    return null;
  };

  const timeRanges = ['1D', '5D', '1M', '6M', 'YTD', '1Y', 'ALL', 'PROJECTED'];
  const [selectedRange, setSelectedRange] = useState('1D');

  // Filter data based on selected time range
  const filteredData = useMemo(() => {
    if (selectedRange === 'ALL') return aggregatedData;
    
    if (aggregatedData.length === 0) return aggregatedData;
    
    const lastDate = new Date(aggregatedData[aggregatedData.length - 1].date);
    const currentDate = new Date(); // Use current date for filtering
    
    // Calculate cutoff date based on selected range
    let cutoffDate;
    
    switch (selectedRange) {
      case '1D':
        cutoffDate = new Date(currentDate.getTime() - 1 * 24 * 60 * 60 * 1000);
        break;
      case '5D':
        cutoffDate = new Date(currentDate.getTime() - 5 * 24 * 60 * 60 * 1000);
        break;
      case '1M':
        cutoffDate = new Date(currentDate.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '6M':
        cutoffDate = new Date(currentDate.getTime() - 180 * 24 * 60 * 60 * 1000);
        break;
      case 'YTD':
        cutoffDate = new Date(currentDate.getFullYear(), 0, 1); // Jan 1 of current year
        break;
      case '1Y':
        cutoffDate = new Date(currentDate.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      case 'PROJECTED':
        // Show historical data + 30 days of projected data
        cutoffDate = new Date(currentDate.getTime() - 30 * 24 * 60 * 60 * 1000);
        const historicalData = aggregatedData.filter(item => new Date(item.date) >= cutoffDate);
        
        // Generate projected data for next 30 days
        const projectedData = [];
        const lastDataPoint = historicalData[historicalData.length - 1];
        const lastDDR4 = lastDataPoint?.ddr4Price || 0;
        const lastDDR5 = lastDataPoint?.ddr5Price || 0;
        const lastAvg = lastDataPoint?.averagePrice || 0;
        
        for (let i = 1; i <= 30; i++) {
          const futureDate = new Date(currentDate);
          futureDate.setDate(futureDate.getDate() + i);
          const dateStr = futureDate.toISOString().split('T')[0];
          
          // Add some realistic variation and slight upward trend
          const ddr4Change = (Math.random() - 0.45) * 0.02; // Slight upward bias
          const ddr5Change = (Math.random() - 0.45) * 0.02;
          const avgChange = (Math.random() - 0.45) * 0.02;
          
          projectedData.push({
            date: dateStr,
            ddr4Price: Math.max(0, lastDDR4 * (1 + ddr4Change * i * 0.1)),
            ddr5Price: Math.max(0, lastDDR5 * (1 + ddr5Change * i * 0.1)),
            averagePrice: Math.max(0, lastAvg * (1 + avgChange * i * 0.1)),
            count: 6,
            isProjected: true
          });
        }
        
        return [...historicalData, ...projectedData];
      default:
        cutoffDate = new Date(currentDate.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
    
    return aggregatedData.filter(item => new Date(item.date) >= cutoffDate);
  }, [aggregatedData, selectedRange]);

  // Calculate prices for the filtered data (selected time range)
  const latestPrice = filteredData[filteredData.length - 1]?.averagePrice || 0;
  const startPrice = filteredData[0]?.averagePrice || 0;
  const priceChange = latestPrice - startPrice;
  const percentChange = startPrice ? ((priceChange / startPrice) * 100) : 0;
  const isPositive = priceChange >= 0;

  // Get DDR4 and DDR5 prices for the filtered data
  const latestDDR4 = filteredData[filteredData.length - 1]?.ddr4Price || 0;
  const startDDR4 = filteredData[0]?.ddr4Price || 0;
  const ddr4Change = latestDDR4 - startDDR4;
  const ddr4PercentChange = startDDR4 ? ((ddr4Change / startDDR4) * 100) : 0;
  const ddr4Positive = ddr4Change >= 0;

  const latestDDR5 = filteredData[filteredData.length - 1]?.ddr5Price || 0;
  const startDDR5 = filteredData[0]?.ddr5Price || 0;
  const ddr5Change = latestDDR5 - startDDR5;
  const ddr5PercentChange = startDDR5 ? ((ddr5Change / startDDR5) * 100) : 0;
  const ddr5Positive = ddr5Change >= 0;

  // Pause live updates when changing time ranges
  const handleRangeChange = (range) => {
    setIsRealTime(false);
    setSelectedRange(range);
  };

  return (
    <div style={{ 
      backgroundColor: '#000000', 
      minHeight: '100vh', 
      color: 'white',
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{ padding: '40px 20px', maxWidth: '800px', margin: '0 auto' }}>
        {/* Header with separate price displays for each DDR type */}
        <div style={{ marginBottom: '30px' }}>
          <div style={{ display: 'flex', gap: '40px', marginBottom: '20px' }}>
            {/* DDR4 */}
            <div>
              <h2 style={{ 
                fontSize: '32px', 
                fontWeight: '700', 
                marginBottom: '4px',
                letterSpacing: '-0.5px',
                color: '#0a84ff'
              }}>
                {formatCurrency(latestDDR4)}
              </h2>
              <div style={{ 
                fontSize: '14px', 
                color: ddr4Positive ? '#34c759' : '#ff3b30',
                fontWeight: '500'
              }}>
                {ddr4Positive ? '+' : ''}{formatCurrency(Math.abs(ddr4Change))} ({ddr4Positive ? '+' : ''}{ddr4PercentChange.toFixed(2)}%)
              </div>
              <div style={{ fontSize: '12px', color: '#8e8e93', marginTop: '2px' }}>
                DDR4
              </div>
            </div>

            {/* DDR5 */}
            <div>
              <h2 style={{ 
                fontSize: '32px', 
                fontWeight: '700', 
                marginBottom: '4px',
                letterSpacing: '-0.5px',
                color: '#bf5af2'
              }}>
                {formatCurrency(latestDDR5)}
              </h2>
              <div style={{ 
                fontSize: '14px', 
                color: ddr5Positive ? '#34c759' : '#ff3b30',
                fontWeight: '500'
              }}>
                {ddr5Positive ? '+' : ''}{formatCurrency(Math.abs(ddr5Change))} ({ddr5Positive ? '+' : ''}{ddr5PercentChange.toFixed(2)}%)
              </div>
              <div style={{ fontSize: '12px', color: '#8e8e93', marginTop: '2px' }}>
                DDR5
              </div>
            </div>

            {/* Average */}
            <div>
              <h2 style={{ 
                fontSize: '32px', 
                fontWeight: '700', 
                marginBottom: '4px',
                letterSpacing: '-0.5px',
                color: '#34c759'
              }}>
                {formatCurrency(latestPrice)}
              </h2>
              <div style={{ 
                fontSize: '14px', 
                color: isPositive ? '#34c759' : '#ff3b30',
                fontWeight: '500'
              }}>
                {isPositive ? '+' : ''}{formatCurrency(Math.abs(priceChange))} ({isPositive ? '+' : ''}{percentChange.toFixed(2)}%)
              </div>
              <div style={{ fontSize: '12px', color: '#8e8e93', marginTop: '2px' }}>
                Average
              </div>
            </div>
          </div>
          
          <div style={{ fontSize: '14px', color: '#8e8e93' }}>
            RAM Market Price Tracker • {selectedRange}
          </div>
        </div>

        {/* Chart */}
        <div style={{ 
          backgroundColor: '#1c1c1e', 
          borderRadius: '16px', 
          padding: '20px',
          marginBottom: '20px',
          height: '400px'
        }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={filteredData} margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2c2c2e" vertical={false} />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatDate} 
                stroke="#8e8e93"
                style={{ fontSize: '12px' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                tickFormatter={formatCurrency} 
                stroke="#8e8e93"
                style={{ fontSize: '12px' }}
                axisLine={false}
                tickLine={false}
                domain={['auto', 'auto']}
              />
              <Tooltip 
                cursor={{ stroke: '#0a84ff', strokeWidth: 1, strokeDasharray: '5 5' }}
                contentStyle={{ 
                  backgroundColor: '#2c2c2e', 
                  border: 'none', 
                  borderRadius: '12px',
                  color: 'white'
                }}
                isAnimationActive={false}
              />
              <Legend 
                verticalAlign="top" 
                height={36} 
                iconType="circle"
                wrapperStyle={{ paddingTop: '10px' }}
              />
              <Line 
                type="monotone" 
                dataKey="ddr4Price" 
                stroke="#0a84ff" 
                strokeWidth={3}
                strokeDasharray={selectedRange === 'PROJECTED' ? '5 5' : '0 0'}
                dot={false}
                activeDot={{ r: 6, fill: '#0a84ff', stroke: '#000', strokeWidth: 2 }}
                name="DDR4"
                connectNulls={false}
                isAnimationActive={false}
              />
              <Line 
                type="monotone" 
                dataKey="ddr5Price" 
                stroke="#bf5af2" 
                strokeWidth={3}
                strokeDasharray={selectedRange === 'PROJECTED' ? '5 5' : '0 0'}
                dot={false}
                activeDot={{ r: 6, fill: '#bf5af2', stroke: '#000', strokeWidth: 2 }}
                name="DDR5"
                connectNulls={false}
                isAnimationActive={false}
              />
              <Line 
                type="monotone" 
                dataKey="averagePrice" 
                stroke="#34c759" 
                strokeWidth={3}
                strokeDasharray={selectedRange === 'PROJECTED' ? '5 5' : '0 0'}
                dot={false}
                activeDot={{ r: 6, fill: '#34c759', stroke: '#000', strokeWidth: 2 }}
                name="Average"
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Time range selector */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: '8px',
          marginBottom: '30px'
        }}>
          {timeRanges.map(range => (
            <button
              key={range}
              onClick={() => handleRangeChange(range)}
              style={{
                padding: '8px 16px',
                backgroundColor: selectedRange === range ? '#0a84ff' : '#2c2c2e',
                color: 'white',
                border: 'none',
                borderRadius: '20px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '500',
                transition: 'all 0.2s'
              }}
            >
              {range}
            </button>
          ))}
        </div>

        {/* Controls */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: '12px',
          alignItems: 'center'
        }}>
          <button 
            onClick={() => setIsRealTime(!isRealTime)}
            style={{
              padding: '12px 24px',
              backgroundColor: isRealTime ? '#34c759' : '#0a84ff',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '600'
            }}
          >
            {isRealTime ? '⏸ Pause' : '▶ Live'}
          </button>
          <button 
            onClick={() => setRamData(ramPriceData)}
            style={{
              padding: '12px 24px',
              backgroundColor: '#2c2c2e',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '600'
            }}
          >
            ↺ Reset
          </button>
          {isRealTime && (
            <span style={{ color: '#34c759', fontSize: '14px', marginLeft: '8px' }}>
              ● Live
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
