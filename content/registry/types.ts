export interface RegistryStatistics {
  notes: number;
  mcq: number;
  pyq: number;
  subjective: number;
  caseBased: number;
  totalResources: number;
}

export interface RegistryItem {
  className: string;

  importPath: string;

  statistics: RegistryStatistics;
}

export type RegistryMap = Record<string, RegistryItem>;