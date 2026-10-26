// src/features/dashboard/api.ts
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import { DashboardMetricsResponse } from './types';

const BASE_URL = '/api/v1/reports/dashboard-overview';

export const fetchDashboardMetrics = async (): Promise<DashboardMetricsResponse> => {
  const { data } = await axios.get<DashboardMetricsResponse>(BASE_URL, {
    withCredentials: true,
  });
  return data;
};

export const useDashboardMetrics = () => {
  return useQuery({
    queryKey: ['dashboard-overview-metrics'],
    queryFn: fetchDashboardMetrics,
    refetchInterval: 60000, // Background poll every 60 seconds
  });
};