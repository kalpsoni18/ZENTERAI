import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface StorageChartProps {
  data: Array<{
    date: string;
    storageGB: number;
  }>;
}

export function StorageChart({ data }: StorageChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
        <XAxis dataKey="date" stroke="#737373" />
        <YAxis stroke="#737373" />
        <Tooltip
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #e5e5e5',
            borderRadius: '8px',
          }}
        />
        <Line
          type="monotone"
          dataKey="storageGB"
          stroke="#0ea5e9"
          strokeWidth={2}
          dot={{ fill: '#0ea5e9', r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

