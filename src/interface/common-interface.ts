import { VideoType } from 'src/utills/enum';

export interface GetCommonInterface {
  _id: string;
  name: string;
}

export interface NameAsTitleInterface {
  _id: string;
  title: string;
}

export interface CommonPdfInterface {
  _id: string;
  title: string;
  thumbnail: string;
  url: string;
}

export interface CommonVideoInterface {
  _id: string;
  title: string;
  videoType: VideoType;
  thumbnail: string;
  url: string;
}
