// src/features/applications/api.ts
import axios from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ApplicationDetail,
  ApplicationQueryParams,
  PaginatedApplications,
  WorkflowTransitionPayload,
} from './types';

const BASE_URL = '/api/v1/applications';

export const fetchApplications = async (
  params: ApplicationQueryParams
): Promise<PaginatedApplications> => {
  const { data } = await axios.get<PaginatedApplications>(BASE_URL, {
    params,
    withCredentials: true,
  });
  return data;
};

export const fetchApplicationById = async (id: string): Promise<ApplicationDetail> => {
  const { data } = await axios.get<ApplicationDetail>(`${BASE_URL}/${id}`, {
    withCredentials: true,
  });
  return data;
};

export const useApplicationsList = (params: ApplicationQueryParams) => {
  return useQuery({
    queryKey: ['applications', params],
    queryFn: () => fetchApplications(params),
  });
};

export const useApplicationDetail = (id: string) => {
  return useQuery({
    queryKey: ['application', id],
    queryFn: () => fetchApplicationById(id),
    enabled: Boolean(id),
  });
};

export const useWorkflowTransition = (applicationId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: WorkflowTransitionPayload) => {
      const { data } = await axios.post<ApplicationDetail>(
        `${BASE_URL}/${applicationId}/transitions`,
        payload,
        withCredentialsConfig()
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['application', applicationId] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
    },
  });
};

export const useAssignOfficer = (applicationId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (assigned_officer_id: string | null) => {
      const { data } = await axios.patch(
        `${BASE_URL}/${applicationId}/assign`,
        { assigned_officer_id },
        withCredentialsConfig()
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['application', applicationId] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
    },
  });
};

const withCredentialsConfig = () => ({ withCredentials: true });