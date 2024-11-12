export interface GetAllWarehouseInterface {
  _id: string;
  name: string;
  address: string;
  state: string;
  city: string;
  pincode: string;
  isPrimary: boolean;
  status: boolean;
  createdBy: string;
  updatedBy: string;
}
export interface WarehouseInterface {
  name: string;
  address: string;
  state: any;
  city: any;
  pincode: string;
  isPrimary: boolean;
  status: boolean;
}
