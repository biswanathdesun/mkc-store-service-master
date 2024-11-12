export interface ResponseBody {
  statusCode: number;
  message: string;
  [propName: string]: unknown;
}
