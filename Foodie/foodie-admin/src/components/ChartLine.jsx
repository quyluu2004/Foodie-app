import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function ChartLine({ data = [], dataKey = 'value', name = 'Giá trị' }) {
  return (
    <div className="bg-white dark:bg-[#333333] rounded-card p-6 shadow-sm border border-gray-100 dark:border-[#404040]">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-[#FFFFFF] mb-4">{name}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" className="dark:stroke-[#404040]" />
          <XAxis dataKey="name" stroke="#6B7280" className="dark:stroke-[#E5E5E5]" />
          <YAxis stroke="#6B7280" className="dark:stroke-[#E5E5E5]" />
          <Tooltip
            contentStyle={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
            }}
            className="dark:!bg-[#333333] dark:!border-[#404040] dark:!text-[#FFFFFF]"
          />
          <Legend className="dark:text-[#FFFFFF]" />
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke="#FF4D4D"
            strokeWidth={2}
            dot={{ fill: '#FF4D4D', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

