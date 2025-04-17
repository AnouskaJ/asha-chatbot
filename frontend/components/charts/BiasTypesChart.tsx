import { Pie } from "react-chartjs-2";

interface BiasTypesChartProps {
  data: any;
}

export function BiasTypesChart({ data }: BiasTypesChartProps) {
  const biasMetrics = data?.conversations?.bias_metrics || {
    bias_detected_count: 0,
    bias_prevented_count: 0,
    bias_types: {
      gender: 0,
      racial: 0,
      religious: 0,
      age: 0,
      other: 0
    }
  };
  
  const biasTypes = biasMetrics.bias_types || {};
  const totalBiasesDetected = biasMetrics.bias_detected_count || 0;
  
  // Format bias type labels
  const formattedLabels = Object.keys(biasTypes).map(type => 
    type.charAt(0).toUpperCase() + type.slice(1) + " Bias"
  );
  
  const chartData = {
    labels: formattedLabels.length > 0 ? formattedLabels : ["No biases detected"],
    datasets: [
      {
        data: Object.values(biasTypes).length > 0 
          ? Object.values(biasTypes) 
          : [1],  // Default value if no biases
        backgroundColor: [
          '#ef4444', // red
          '#f97316', // orange
          '#facc15', // yellow
          '#84cc16', // lime
          '#10b981', // green
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
      <h2 className="text-xl font-bold mb-1">Bias Types</h2>
      <p className="text-gray-500 mb-4">
        {totalBiasesDetected > 0 
          ? `Types of biases detected (${totalBiasesDetected} total)` 
          : "No biases detected yet"}
      </p>
      <div className="h-80">
        <Pie data={chartData} options={options} />
      </div>
    </div>
  );
} 