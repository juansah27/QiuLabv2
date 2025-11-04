import React, { useMemo } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  ShoppingCart as OrdersIcon,
  CheckCircle as InterfacedIcon,
  Cancel as NotInterfacedIcon,
  Schedule as PendingIcon,
  TrendingUp as HourMinusIcon,
  TrendingDown as HourPlusIcon,
  Info as InfoIcon
} from '@mui/icons-material';

const UnifiedCards = ({ cardsData, isDataFresh, dataTimestamp }) => {
  // Format timestamp for display
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Never';
    return new Date(timestamp).toLocaleString();
  };

  // Calculate percentages for interfaced orders
  const interfacedPercentage = useMemo(() => {
    if (!cardsData || cardsData.total_orders === 0) return 0;
    return Math.round((cardsData.interfaced / cardsData.total_orders) * 100);
  }, [cardsData]);

  const notInterfacedPercentage = useMemo(() => {
    if (!cardsData || cardsData.total_orders === 0) return 0;
    return Math.round((cardsData.not_interfaced / cardsData.total_orders) * 100);
  }, [cardsData]);

  const pendingPercentage = useMemo(() => {
    if (!cardsData || cardsData.total_orders === 0) return 0;
    return Math.round((cardsData.pending_verification / cardsData.total_orders) * 100);
  }, [cardsData]);

  // Card configurations
  const cardConfigs = useMemo(() => [
    {
      title: 'Total Orders',
      value: cardsData?.total_orders || 0,
      icon: OrdersIcon,
      color: 'primary',
      description: 'Total number of orders',
      trend: null
    },
    {
      title: 'Interfaced',
      value: cardsData?.interfaced || 0,
      icon: InterfacedIcon,
      color: 'success',
      description: `Successfully interfaced orders (${interfacedPercentage}%)`,
      trend: interfacedPercentage >= 80 ? 'positive' : interfacedPercentage >= 60 ? 'neutral' : 'negative'
    },
    {
      title: 'Not Interfaced',
      value: cardsData?.not_interfaced || 0,
      icon: NotInterfacedIcon,
      color: 'error',
      description: `Orders not yet interfaced (${notInterfacedPercentage}%)`,
      trend: notInterfacedPercentage <= 20 ? 'positive' : notInterfacedPercentage <= 40 ? 'neutral' : 'negative'
    },
    {
      title: 'Pending Verification',
      value: cardsData?.pending_verification || 0,
      icon: PendingIcon,
      color: 'warning',
      description: `Orders pending verification (${pendingPercentage}%)`,
      trend: pendingPercentage <= 10 ? 'positive' : pendingPercentage <= 25 ? 'neutral' : 'negative'
    },
    {
      title: 'Last Hour Orders',
      value: cardsData?.hour_minus_1 || 0,
      icon: HourMinusIcon,
      color: 'info',
      description: 'Orders from the last hour',
      trend: null
    },
    {
      title: 'Previous Hour Orders',
      value: cardsData?.hour_plus_1 || 0,
      icon: HourPlusIcon,
      color: 'secondary',
      description: 'Orders from the previous hour',
      trend: null
    }
  ], [cardsData, interfacedPercentage, notInterfacedPercentage, pendingPercentage]);

  // Get trend color
  const getTrendColor = (trend) => {
    switch (trend) {
      case 'positive': return 'success';
      case 'negative': return 'error';
      case 'neutral': return 'warning';
      default: return 'default';
    }
  };

  // Get trend label
  const getTrendLabel = (trend) => {
    switch (trend) {
      case 'positive': return 'Good';
      case 'negative': return 'Needs Attention';
      case 'neutral': return 'Average';
      default: return '';
    }
  };

  if (!cardsData) {
    return (
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="body1" color="text.secondary">
                No card data available
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  }

  return (
    <Box>
      {/* Data freshness indicator */}
      {dataTimestamp && (
        <Box mb={2} display="flex" alignItems="center" gap={1}>
          <Chip
            icon={<InfoIcon />}
            label={`Data updated: ${formatTimestamp(dataTimestamp)}`}
            color={isDataFresh ? "success" : "warning"}
            variant="outlined"
            size="small"
          />
          {!isDataFresh && (
            <Typography variant="caption" color="warning.main">
              Consider refreshing for latest data
            </Typography>
          )}
        </Box>
      )}

      {/* Cards Grid */}
      <Grid container spacing={2}>
        {cardConfigs.map((config, index) => {
          const IconComponent = config.icon;
          
          return (
            <Grid item xs={12} sm={6} md={4} lg={2} key={index}>
              <Card 
                sx={{ 
                  height: '100%',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 3
                  }
                }}
              >
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                    <Typography variant="h6" component="h3" color="text.secondary" gutterBottom>
                      {config.title}
                    </Typography>
                    <IconComponent color={config.color} />
                  </Box>
                  
                  <Typography variant="h4" component="div" gutterBottom>
                    {config.value.toLocaleString()}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {config.description}
                  </Typography>
                  
                  {config.trend && (
                    <Box display="flex" alignItems="center" gap={1} mt={1}>
                      <Chip
                        label={getTrendLabel(config.trend)}
                        color={getTrendColor(config.trend)}
                        size="small"
                        variant="outlined"
                      />
                      <Tooltip title={`${config.title} trend indicator`}>
                        <IconButton size="small" color={getTrendColor(config.trend)}>
                          <InfoIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Summary Statistics */}
      <Box mt={3}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Summary Statistics
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Typography variant="body2" color="text.secondary">
                  Interfaced Rate
                </Typography>
                <Typography variant="h6" color="success.main">
                  {interfacedPercentage}%
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="body2" color="text.secondary">
                  Non-Interfaced Rate
                </Typography>
                <Typography variant="h6" color="error.main">
                  {notInterfacedPercentage}%
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="body2" color="text.secondary">
                  Pending Rate
                </Typography>
                <Typography variant="h6" color="warning.main">
                  {pendingPercentage}%
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default UnifiedCards;
