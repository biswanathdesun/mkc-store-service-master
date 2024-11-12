export interface GetAllCarePackages {
  _id: string;
  healthCare: string;
  title: string;
  features: string[];
  price: string;
  createdBy: string;
  updatedBy: string;
  prebookAmount: number;
  status: boolean;
}

export interface CarePackagesForWebAndMobile {
  _id: string;
  healthCare: string;
  title: string;
  features: string[];
  mrpPrice: string;
  discountPercentage: string;
  totalPrice: string;
}

export interface GetCarePackageById {
  _id: string;
  healthCareId: string;
  title: string;
  features: string[];
  priceId: any;
  image: string;
  prebookAmount: number;
  slugUrl: string;
  coins: number;
  testPackagesId: any[];
  showOnWebsite: boolean;
}

export interface GetAllEnquiry {
  _id: string;
  healthCare: string;
  carePackage: string;
  name: string;
  phone: string;
  queries: string;
  appointmentDate: Date;
  userType: string;
  status: boolean;
}
