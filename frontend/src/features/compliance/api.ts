// src/features/compliance/api.ts
import axios from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ObligationItem,
  PaginatedObligations,
  ComplianceQueryParams,
  SubmitEvidencePayload,
  VerifyObligationPayload,
} from './types';

const BASE_URL = '/api/v1/compliance';

export const fetchObligations = async (
  params: ComplianceQueryParams
): Promise<PaginatedObligations> => {
  const { data } = await axios.get<PaginatedObligations>(BASE_URL, {
    params,
    withCredentials: true,
  });
  return data;
};

export const useObligationsList = (params: ComplianceQueryParams) => {
  return useQuery({
    queryKey: ['compliance-obligations', params],
    queryFn: () => fetchObligations(params),
  });
};

export const useSubmitEvidence = (obligationId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: SubmitEvidencePayload) => {
      const { data } = await axios.post<ObligationItem>(
        `${BASE_URL}/${obligationId}/submit-evidence`,
        payload,
        { withCredentials: true }
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compliance-obligations'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
    },
  });
};

export const useVerifyObligation = (obligationId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: VerifyObligationPayload) => {
      const { data } = await axios.post<ObligationItem>(
        `${BASE_URL}/${obligationId}/verify`,
        payload,
        { withCredentials: true }
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compliance-obligations'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
    },
  });
};