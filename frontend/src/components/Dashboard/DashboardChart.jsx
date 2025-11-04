import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { useTheme } from '../../hooks/useTheme';
import { Card, CardContent } from '../ui/card';
import { cn } from '../../lib/utils';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const DashboardChart = ({ data, title, className }) => {
  const { theme } = useTheme();
  
  // Configure chart options based on theme
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: theme === 'dark' ? 'hsl(var(--muted-foreground))' : 'hsl(var(--foreground))',
          font: {
            family: 'Inter, sans-serif',
          },
        },
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: theme === 'dark' ? 'hsl(var(--popover))' : 'hsl(var(--background))',
        titleColor: theme === 'dark' ? 'hsl(var(--foreground))' : 'hsl(var(--foreground))',
        bodyColor: theme === 'dark' ? 'hsl(var(--muted-foreground))' : 'hsl(var(--muted-foreground))',
        borderColor: theme === 'dark' ? 'hsl(var(--border))' : 'hsl(var(--border))',
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        grid: {
          color: theme === 'dark' ? 'hsl(var(--border))' : 'hsl(var(--border))',
        },
        ticks: {
          color: theme === 'dark' ? 'hsl(var(--muted-foreground))' : 'hsl(var(--muted-foreground))',
        },
      },
      y: {
        grid: {
          color: theme === 'dark' ? 'hsl(var(--border))' : 'hsl(var(--border))',
        },
        ticks: {
          color: theme === 'dark' ? 'hsl(var(--muted-foreground))' : 'hsl(var(--muted-foreground))',
        },
        beginAtZero: true,
      },
    },
    elements: {
      line: {
        tension: 0.4,
      },
      point: {
        radius: 4,
        hitRadius: 10,
        hoverRadius: 6,
      },
    },
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardContent className="p-6">
        <div className="h-[300px]">
          <Line data={data} options={options} />
        </div>
      </CardContent>
    </Card>
  );
};

export default DashboardChart; 