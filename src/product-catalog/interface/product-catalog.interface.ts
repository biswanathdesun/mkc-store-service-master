export interface GetAllProductCatalogInterface {
  _id: string;
  title: string;
  unit: string;
  inventoryCategory: string;
  varients: string[];
  createdBy: string;
  updatedBy: string;
  status: boolean;
}

export interface ProductCatalogInterface {
  _id: string;
  title: string;
  unit: string;
  inventoryCategory: any;
  varients: string[];
}
