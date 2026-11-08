export interface Client {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
}

export type NewClient = Omit<Client, 'id'>;
