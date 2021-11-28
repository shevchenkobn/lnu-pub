import { t } from '../lib/types';

export interface Citation {
  id: string;
  name: string;
  year: number;
  pubs: number;
  department: string;
  faculty: string;
  university: string;
}

export function getDefaultYearRange() {
  return t(0, new Date().getFullYear());
}
