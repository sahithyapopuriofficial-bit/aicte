// src/features/workflow/api.ts
import axios from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { WorkflowRuleVersion, WorkflowValidationResult } from './types';

const BASE_URL = '/api/v1/workflow';

export const fetchRuleVersions = async (): Promise<WorkflowRuleVersion[]> => {
  const { data } = await axios.get<WorkflowRuleVersion[]>(`${BASE_URL}/versions`, {
    withCredentials: true,
  });
  return data;
};

export const fetchActiveRuleVersion = async (): Promise<WorkflowRuleVersion> => {
  const { data } = await axios.get<WorkflowRuleVersion>(`${BASE_URL}/active`, {
    withCredentials: true,
  });
  return data;
};

export const validateRuleVersion = async (versionId: string): Promise<WorkflowValidationResult> => {
  const { data } = await axios.get<WorkflowValidationResult>(
    `${BASE_URL}/versions/${versionId}/validate`,
    { withCredentials: true }
  );
  return data;
};

export const useRuleVersions = () => {
  return useQuery({
    queryKey: ['workflow-rule-versions'],
    queryFn: fetchRuleVersions,
  });
};

export const useActiveRuleVersion = () => {
  return useQuery({
    queryKey: ['workflow-active-version'],
    queryFn: fetchActiveRuleVersion,
  });
};

export const useValidateVersion = (versionId: string | null) => {
  return useQuery({
    queryKey: ['workflow-version-validation', versionId],
    queryFn: () => (versionId ? validateRuleVersion(versionId) : null),
    enabled: Boolean(versionId),
  });
};

export const useActivateRuleVersion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (versionId: string) => {
      const { data } = await axios.post(
        `${BASE_URL}/versions/${versionId}/activate`,
        {},
        { withCredentials: true }
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-rule-versions'] });
      queryClient.invalidateQueries({ queryKey: ['workflow-active-version'] });
    },
  });
};