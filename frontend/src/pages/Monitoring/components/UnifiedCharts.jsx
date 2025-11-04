import React, { useMemo } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Tooltip
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import {
  TrendingUp as TrendingIcon,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  Info as InfoIcon
} from '@mui/icons-material';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const UnifiedCharts = ({ chartsData, isDataFresh, dataTimestamp }) => {
  // Format timestamp for display
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Never';
    return new Date(timestamp).toLocaleString();
  };

  // Prepare data for charts
  const topBrandsData = useMemo(() => {
    if (!chartsData?.top_brands) return [];
    return chartsData.top_brands.slice(0, 10); // Show top 10 brands
  }, [chartsData]);

  const platformData = useMemo(() => {
    if (!chartsData?.platform_distribution) return [];
    return chartsData.platform_distribution;
  }, [chartsData]);

  const orderEvolutionData = useMemo(() => {
    if (!chartsData?.order_evolution) return [];
    return chartsData.order_evolution.slice(-24); // Show last 24 hours
  }, [chartsData]);

  // Calculate total for validation
  const totalOrders = useMemo(() => {
    if (!chartsData?.top_brands) return 0;
    return chartsData.top_brands.reduce((sum, item) => sum + item.value, 0);
  }, [chartsData]);

  // Custom tooltip for bar chart
  const CustomBarTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <Box
          sx={{
            backgroundColor: 'white',
            border: '1px solid #ccc',
            borderRadius: '4px',
            padding: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
        >
          <Typography variant="body2" fontWeight="bold">
            {label}
          </Typography>
          <Typography variant="body2" color="primary">
            Orders: {payload[0].value}
          </Typography>
        </Box>
      );
    }
    return null;
  };

  // Custom tooltip for pie chart
  const CustomPieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percentage = ((data.value / totalOrders) * 100).toFixed(1);
      return (
        <Box
          sx={{
            backgroundColor: 'white',
            border: '1px solid #ccc',
            borderRadius: '4px',
            padding: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
        >
          <Typography variant="body2" fontWeight="bold">
            {data.name}
          </Typography>
          <Typography variant="body2" color="primary">
            Orders: {data.value} ({percentage}%)
          </Typography>
        </Box>
      );
    }
    return null;
  };

  // Custom tooltip for line chart
  const CustomLineTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <Box
          sx={{
            backgroundColor: 'white',
            border: '1px solid #ccc',
            borderRadius: '4px',
            padding: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
        >
          <Typography variant="body2" fontWeight="bold">
            {label}
          </Typography>
          <Typography variant="body2" color="primary">
            Orders: {payload[0].value}
          </Typography>
        </Box>
      );
    }
    return null;
  };

  if (!chartsData) {
    return (
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="body1" color="text.secondary">
                No chart data available
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  }

  return (
    <Box>
      {/* Data consistency indicator */}
      <Box mb={2} display="flex" alignItems="center" gap={1}>
        <Chip
          icon={<InfoIcon />}
          label={`Total Orders: ${totalOrders.toLocaleString()}`}
          color="primary"
          variant="outlined"
          size="small"
        />
        <Chip
          icon={<InfoIcon />}
          label={`Data updated: ${formatTimestamp(dataTimestamp)}`}
          color={isDataFresh ? "success" : "warning"}
          variant="outlined"
          size="small"
        />
      </Box>

      <Grid container spacing={2}>
        {/* Top Brands Chart */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '400px' }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <BarChartIcon color="primary" />
                <Typography variant="h6" component="h3">
                  Top Brands
                </Typography>
                <Tooltip title="Top 10 brands by order count">
                  <InfoIcon fontSize="small" color="action" />
                </Tooltip>
              </Box>
              
              {topBrandsData.length > 0 ? (
                <ResponsiveContainer width="100%" height="300px">
                  <BarChart
                    data={topBrandsData}
                    layout="horizontal"
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      width={120}
                      tick={{ fontSize: 10 }}
                    />
                    <RechartsTooltip content={<CustomBarTooltip />} />
                    <Bar dataKey="value" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Box display="flex" alignItems="center" justifyContent="center" height="300px">
                  <Typography variant="body2" color="text.secondary">
                    No brand data available
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Platform Distribution Chart */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '400px' }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <PieChartIcon color="primary" />
                <Typography variant="h6" component="h3">
                  Platform Distribution
                </Typography>
                <Tooltip title="Order distribution by marketplace">
                  <InfoIcon fontSize="small" color="action" />
                </Tooltip>
              </Box>
              
              {platformData.length > 0 ? (
                <ResponsiveContainer width="100%" height="300px">
                  <PieChart>
                    <Pie
                      data={platformData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {platformData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip content={<CustomPieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Box display="flex" alignItems="center" justifyContent="center" height="300px">
                  <Typography variant="body2" color="text.secondary">
                    No platform data available
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Order Evolution Chart */}
        <Grid item xs={12}>
          <Card sx={{ height: '400px' }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <TrendingIcon color="primary" />
                <Typography variant="h6" component="h3">
                  Order Evolution (Last 24 Hours)
                </Typography>
                <Tooltip title="Order count evolution over time">
                  <InfoIcon fontSize="small" color="action" />
                </Tooltip>
              </Box>
              
              {orderEvolutionData.length > 0 ? (
                <ResponsiveContainer width="100%" height="300px">
                  <LineChart
                    data={orderEvolutionData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 10 }}
                      angle={-45}
                      textAnchor="end"
                    />
                    <YAxis />
                    <RechartsTooltip content={<CustomLineTooltip />} />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#8884d8" 
                      strokeWidth={2}
                      dot={{ fill: '#8884d8', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <Box display="flex" alignItems="center" justifyContent="center" height="300px">
                  <Typography variant="body2" color="text.secondary">
                    No evolution data available
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Data Validation Summary */}
      <Box mt={3}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Data Consistency Validation
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <Typography variant="body2" color="text.secondary">
                  Total Orders
                </Typography>
                <Typography variant="h6" color="primary">
                  {totalOrders.toLocaleString()}
                </Typography>
              </Grid>
              <Grid item xs={12} md={3}>
                <Typography variant="body2" color="text.secondary">
                  Top Brands Sum
                </Typography>
                <Typography variant="h6" color="success.main">
                  {topBrandsData.reduce((sum, item) => sum + item.value, 0).toLocaleString()}
                </Typography>
              </Grid>
              <Grid item xs={12} md={3}>
                <Typography variant="body2" color="text.secondary">
                  Platform Sum
                </Typography>
                <Typography variant="h6" color="info.main">
                  {platformData.reduce((sum, item) => sum + item.value, 0).toLocaleString()}
                </Typography>
              </Grid>
              <Grid item xs={12} md={3}>
                <Typography variant="body2" color="text.secondary">
                  Evolution Sum
                </Typography>
                <Typography variant="h6" color="warning.main">
                  {orderEvolutionData.reduce((sum, item) => sum + item.value, 0).toLocaleString()}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default UnifiedCharts;
