export interface Group {
  id: number;
  name: string;
  size: number;
  fixedMembers: string[];
}

export interface GeneratedGroup {
  name: string;
  members: string[];
}

export type Schedule = GeneratedGroup[];
