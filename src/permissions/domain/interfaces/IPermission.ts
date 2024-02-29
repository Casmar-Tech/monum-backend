export default interface IPermission {
  _id?: string;
  id?: string;
  name: string;
  description: string;
  action: string;
  entity: string;
  max?: number;
  min?: number;
  createdAt: Date;
  updatedAt: Date;
}
