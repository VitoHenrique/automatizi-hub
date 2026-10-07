import { IntegrationProvider, AdapterHealthResult } from "./types";

export interface SyncResult {
  success: boolean;
  itemsProcessed: number;
  errors?: string[];
  metadata?: Record<string, unknown>;
}

export interface IntegrationAdapter {
  readonly provider: IntegrationProvider;
  readonly name: string;
  healthCheck(): Promise<AdapterHealthResult>;
  sync(params?: Record<string, unknown>): Promise<SyncResult>;
}
