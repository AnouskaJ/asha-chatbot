import { Pie } from "react-chartjs-2";

interface LanguagesChartProps {
  data: any;
}

export function LanguagesChart({ data }: LanguagesChartProps) {
  const languageData = data?.conversations?.language_distribution || {
    English: 0,
    Hindi: 0,
    Kannada: 0,
    Tamil: 0,
    Telugu: 0,
    Gujarati: 0,
    Marathi: 0,
    Punjabi: 0,
    Konkani: 0
  };

  // Remove languages with zero counts
  const filteredData: Record<string, number> = {};
  Object.entries(languageData).forEach(([key, value]) => {
    if (value !== 0) {
      filteredData[key] = value as number;
    }
  });

  // If all languages are zero, keep English as placeholder
  const finalData = Object.keys(filteredData).length === 0 
    ? { English: 0 } 
    : filteredData;

  const chartData = {
    labels: Object.keys(finalData),
    datasets: [
      {
        data: Object.values(finalData),
        backgroundColor: [
          '#3b82f6', // blue
          '#f97316', // orange
          '#10b981', // green
          '#8b5cf6', // purple
          '#ec4899', // pink
          '#facc15', // yellow
          '#6366f1', // indigo
          '#a1a1aa', // gray
          '#a855f7', // violet
        ],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          boxWidth: 12,
          padding: 15,
        },
      },
    },
    maintainAspectRatio: false,
    responsive: true,
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h2 className="text-xl font-bold mb-1">Language Distribution</h2>
      <p className="text-gray-500 mb-4">User language preferences</p>
      <div className="h-80">
        <Pie data={chartData} options={options} />
      </div>
    </div>
  );
} 