import {
  CommonPdfInterface,
  CommonVideoInterface,
  GetCommonInterface,
  NameAsTitleInterface,
} from 'src/interface/common-interface';
import { CourseLibraryType } from 'src/utills/enum';

export interface GetCourseLibraryInterface {
  _id: string;
  onlineCourse: string;
  subject: string;
  chapter: string;
  topic: string;
  videoUrl: string;
  createdBy: string;
  updatedBy: boolean;
  status: boolean;
}

export interface GetCourseLibraryByIdInterface {
  _id: string;
  onlineCourseId: NameAsTitleInterface;
  subjectId: GetCommonInterface;
  chapterId: GetCommonInterface;
  topicId: GetCommonInterface;
  testMasterId: NameAsTitleInterface;
  type: CourseLibraryType;
  pdfUrl: CommonPdfInterface;
  videoUrl: CommonVideoInterface;
}
