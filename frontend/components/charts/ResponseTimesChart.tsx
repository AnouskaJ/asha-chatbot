import { Bar } from "react-chartjs-2";

interface ResponseTimesChartProps {
  data: any;
}

export function ResponseTimesChart({ data }: ResponseTimesChartProps) {
  const responseTimes = data?.conversations?.response_times || [];
  
  // Create time range buckets (in seconds)
  const timeRanges = [
    { min: 0, max: 1, label: '0-1s' },
    { min: 1, max: 3, label: '1-3s' },
    { min: 3, max: 6, label: '3-6s' },
    { min: 6, max: 9, label: '6-9s' },
    { min: 9, max: 12, label: '9-12s' },
    { min: 12, max: Infinity, label: '12s+' }
  ];
  
  // Count responses in each time range
  const countsByRange = timeRanges.map(range => {
    return responseTimes.filter((time: number) => 
      time >= range.min && time < range.max
    ).length;
  });
  
  // Calculate average response time (already in seconds)
  const avgResponseTime = responseTimes.length > 0
    ? responseTimes.reduce((sum: number, time: number) => sum + time, 0) / responseTimes.length
    : 0;
  
  const chartData = {
    labels: timeRanges.map(range => range.label),
    datasets: [
      {
        label: 'Response Count',
        data: countsByRange,
        backgroundColor: '#3b82f6',
        borderColor: '#2563eb',
        borderWidth: 1,
      },
    ],
  };

  const options = {
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0
        }
      }
    },
    maintainAspectRatio: false,
    responsive: true,
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h2 className="text-xl font-bold mb-1">Response Times</h2>
      <p className="text-gray-500 mb-4">
        {responseTimes.length > 0 
          ? `Average: ${avgResponseTime.toFixed(2)}s (${responseTimes.length} responses)` 
          : "No response data yet"}
      </p>
      <div className="h-80">
        <Bar data={chartData} options={options} />
      </div>
    </div>
  );
} 