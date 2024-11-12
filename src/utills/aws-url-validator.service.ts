import { Injectable } from '@nestjs/common';
import { parse } from 'url';

@Injectable()
export class AwsUrlValidator {
  isAWSSignedURL(fileUrl: string): boolean {
    const parsedUrl = parse(fileUrl, true);
    const queryParams = parsedUrl.query;

    //NOTE: Check for typical AWS signed URL query parameters
    return (
      !!queryParams['X-Amz-Algorithm'] &&
      !!queryParams['X-Amz-Credential'] &&
      !!queryParams['X-Amz-Date'] &&
      !!queryParams['X-Amz-Expires'] &&
      !!queryParams['X-Amz-Signature']
    );
  }

  //NOTE: is AWSLocation URL
  isAWSLocationURL(fileUrl: string): boolean {
    const awsLocationPattern =
      /^https?:\/\/[a-z0-9.-]+\.s3\.amazonaws\.com\/.+/;
    return awsLocationPattern.test(fileUrl);
  }
}
