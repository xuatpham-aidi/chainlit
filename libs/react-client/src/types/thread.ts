import { IElement } from './element';
import { IStep } from './step';

export interface IThreadGroup {
  id: string;
  userId: string;
  name: string;
  displayOrder: number;
  createdAt?: string;
}

export interface IThread {
  id: string;
  createdAt: number | string;
  name?: string;
  userId?: string;
  userIdentifier?: string;
  groupId?: string | null;
  metadata?: Record<string, any>;
  steps: IStep[];
  elements?: IElement[];
}
