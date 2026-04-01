export interface BriefFrontmatter {
  id: string;
  role: string;
  org_type: string;
  org_size: string;
  archetype: string;
  stance: string;
  use_cases: string[];
  spec_topics: string[];
  concerns: string[];
  frameworks_referenced: string[];
  key_terms: string[];
}

export interface Brief {
  frontmatter: BriefFrontmatter;
  body: string;
  filename: string;
}

export interface TaxonomyAxis {
  description: string;
  values: string[] | Record<string, string>;
}

export interface Taxonomy {
  [key: string]: TaxonomyAxis | string;
}

export type FilterAxis =
  | "archetype"
  | "stance"
  | "use_cases"
  | "spec_topics"
  | "concerns"
  | "frameworks_referenced";

export const FILTER_AXES: FilterAxis[] = [
  "archetype",
  "stance",
  "use_cases",
  "spec_topics",
  "concerns",
  "frameworks_referenced",
];
