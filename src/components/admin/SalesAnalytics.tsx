import React from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

interface SalesData {
  category: string;
  percentage: number;
  color: string;
}

interface SalesAnalyticsProps {
  salesData?: SalesData[];
  activityData?: { day: string; value: number }[];
}

const SalesAnalytics: React.FC<SalesAnalyticsProps> = ({
  salesData = [
    { category: 'Electronics', percentage: 45, color: '#ff5a00' },
    { category: 'Fashion', percentage: 30, color: '#3b82f6' },
    { category: 'Home & Living', percentage: 15, color: '#10b981' },
    { category: 'Accessories', percentage: 10, color: '#8b5cf6' },
  ],
  activityData = [
    { day: 'Apr 18', value: 30 },
    { day: 'Apr 19', value: 30 },
    { day: 'Apr 20', value: 35 },
    { day: 'Apr 21', value: 80 },
    { day: 'Apr 22', value: 65 },
    { day: 'Apr 23', value: 60 },
    { day: 'Apr 24', value: 45 },
    { day: 'Apr 25', value: 75 },
    { day: 'Apr 26', value: 85 },
    { day: 'Apr 27', value: 40 },
    { day: 'Apr 28', value: 70 },
    { day: 'Apr 29', value: 45 },
    { day: 'Apr 30', value: 55 },
    { day: 'May 01', value: 35 },
  ]
}) => {

  return (
    <div style={{
      background: 'var(--bg-white)',
      borderRadius: '16px',
      padding: '24px',
      border: '1px solid var(--border-color)',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.02)',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      minHeight: '500px'
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start',
        marginBottom: '4px' 
      }}>
        <div>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '700',
            color: 'var(--text-dark)',
            marginBottom: '4px',
            fontFamily: 'inherit'
          }}>
            Sales Analytics
          </h3>
          <p style={{
            fontSize: '13px',
            color: 'var(--text-gray)',
            margin: 0
          }}>
            Store performance trends over the last 14 days
          </p>
        </div>
        <div style={{
          padding: '6px 12px',
          background: 'var(--bg-light)',
          borderRadius: '8px',
          fontSize: '12px',
          fontWeight: '600',
          color: 'var(--text-dark)',
          cursor: 'pointer'
        }}>
          Daily Sales
        </div>
      </div>

      <div style={{ flex: 1, minHeight: '200px', marginTop: '20px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={activityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ff5a00" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#ff5a00" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="day" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: '#999' }}
              interval={2}
            />
            <YAxis hide />
            <Tooltip 
              formatter={(val: any) => [`৳${Number(val).toLocaleString()}`, 'Sales']}
              contentStyle={{ 
                borderRadius: '8px', 
                border: 'none', 
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                fontSize: '12px'
              }}
            />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke="#ff5a00" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorValue)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div style={{
        height: '1px',
        background: 'var(--border-color)',
        margin: '24px 0',
        opacity: 0.6
      }}></div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {salesData.map((item) => (
          <div key={item.category}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px'
            }}>
              <span style={{
                fontSize: '14px',
                fontWeight: '600',
                color: 'var(--text-dark)'
              }}>
                {item.category}
              </span>
              <span style={{
                fontSize: '13px',
                color: 'var(--text-gray)',
                fontWeight: '500'
              }}>
                {item.percentage}%
              </span>
            </div>
            <div style={{
              height: '6px',
              background: 'var(--bg-light)',
              borderRadius: '3px',
              overflow: 'hidden'
            }}>
              <div 
                style={{
                  width: `${item.percentage}%`,
                  height: '100%',
                  background: item.color,
                  borderRadius: '3px',
                  transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)'
                }} 
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SalesAnalytics;
