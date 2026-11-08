export interface Owner {
  id: number;
  name: string;
  role: string;
}

export type NewOwner = Omit<Owner, 'id'>;
