export interface GetAllHealthCare {
  _id: string;
  name: string;
  description: string;
  slugUrl: string;
  image: string;
  createdBy: string;
  updatedBy: string;
  status: boolean;
  isPreeBook: boolean;
}
export interface HealthCareForWebAndMobile {
  _id: string;
  name: string;
  description: string;
  slugUrl: string;
  image: string;
}
export interface GetHealthCareById {
  _id: string;
  name: string;
  description: string;
  slugUrl: string;
  image: string;
  isPreeBook: boolean;
}

export interface GetServiceForUser {
  _id: string;
  name: string;
}
