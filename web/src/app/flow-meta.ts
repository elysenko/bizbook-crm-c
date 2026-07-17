// budget: 400 lines
// Flow-graph metadata contract. `data.flow` on each route is the single source
// of truth for the user-flow graph AND the runtime navbar. The colossus
// flow-graph extractor projects it directly.
import { Route } from '@angular/router';

export interface FlowMeta {
  flowId: string;
  node: string;
  label: string;
  entry?: boolean;
  showInNavbar?: boolean;
  scope?: 'all' | 'admin' | 'user';
  edgesTo?: string[];
}

export type FlowRoute = Route & { data?: { flow?: FlowMeta } & Record<string, unknown> };
