import { Doughnut } from "react-chartjs-2";

interface TopicsChartProps {
  data: any;
}

export function TopicsChart({ data }: TopicsChartProps) {
  const topicData = data?.conversations?.topic_distribution || {
    general: 0,
    career: 0,
    mentorship: 0,
    education: 0,
    skill_development: 0,
    interview_prep: 0,
    entrepreneurship: 0,
    other: 0
  };

  const chartData = {
    labels: Object.keys(topicData).map(topic => 
      topic.charAt(0).toUpperCase() + topic.slice(1).replace('_', ' ')
    ),
    datasets: [
      {
        data: Object.values(topicData),
        backgroundColor: [
          '#3b82f6', // blue
          '#f97316', // orange
          '#10b981', // green
          '#8b5cf6', // purple
          '#ec4899', // pink
          '#facc15', // yellow
          '#6366f1', // indigo
          '#a1a1aa', // gray
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
      <h2 className="text-xl font-bold mb-1">Topic Distribution</h2>
      <p className="text-gray-500 mb-4">Conversation topics by frequency</p>
      <div className="h-80">
        <Doughnut data={chartData} options={options} />
      </div>
    </div>
  );
} 