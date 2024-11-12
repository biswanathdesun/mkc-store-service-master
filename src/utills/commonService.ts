/* eslint-disable @typescript-eslint/no-unused-vars */
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { S3 } from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import { IMAGE_UPLOAD_ERROR } from './messages';
import { path } from '@ffmpeg-installer/ffmpeg';
import ffmpeg from 'fluent-ffmpeg';
import { MKC_CONVERTER } from './s3BucketFolder';
import ejs from 'ejs';
import * as pdf from 'html-pdf';

ffmpeg.setFfmpegPath(path);

@Injectable()
export class CommonService {
  private s3: S3;

  constructor() {
    //ANCHOR - S3 CONFIGURATION
    this.s3 = new S3({
      accessKeyId: process.env.AWS_ACCESS_KEY,
      secretAccessKey: process.env.AWS_SECRET_KEY,
      region: process.env.S3_REGION,
    });
  }

  //ANCHOR - regx to match the particular text
  escapeRegExp(text: string): string {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
  }

  //ANCHOR : content type
  getBase64ContentType(base64Data: string): string | null {
    let contentType: string | null = null;

    if (base64Data) {
      const commaIndex = base64Data.indexOf(',');
      if (commaIndex !== -1) {
        const dataHeader = base64Data.substring(0, commaIndex);
        if (dataHeader.startsWith('data:')) {
          contentType = dataHeader.split(':')[1].split(';')[0];
        } else {
          window.console.log('error');
        }
      }
    }
    return contentType;
  }

  //ANCHOR : get extension type
  getBase64ExtensionType(base64Data: string): string {
    const regex = /^data:([a-zA-Z]+)\/([a-zA-Z0-9+.-]+);base64,/i;
    const result = regex.exec(base64Data);
    if (!result) {
      throw new Error('Invalid base64 data');
    }

    const extension = result[2].toLowerCase();
    return extension;
  }

  //ANCHOR - function for upload file in aws s3 bucket
  uploadFileInS3Bucket = async (
    file: string,
    s3directorypath: string,
  ): Promise<AWS.S3.ManagedUpload.SendData | false> => {
    try {
      const contentType = this.getBase64ContentType(file);
      const extension = this.getBase64ExtensionType(file);
      const fileS3 = file.split('base64,')[1];

      //NOTE - COMPLETE FILE NAME
      const s3path = new Date().getTime() + '-' + uuidv4() + `.${extension}`;
      //NOTE - CONFIGURE
      const params: AWS.S3.PutObjectRequest = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: `${s3directorypath}/${s3path}`,
        Body: Buffer.from(fileS3, 'base64'),
        ContentEncoding: 'base64',
        ContentType: contentType,
      };

      //NOTE - UPLOAD
      const s3response: AWS.S3.ManagedUpload.SendData = await this.s3
        .upload(params)
        .promise();

      return s3response;
    } catch (error) {
      console.error('Error during S3 upload:', error);
      return false;
    }
  };

  //ANCHOR - function for get s3 url
  getSignedUrl = async (key: string): Promise<string | null> => {
    try {
      const s3info = this.s3.getSignedUrlPromise('getObject', {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: key,
        Expires: 2000,
      });
      return s3info;
    } catch (error) {
      return null;
    }
  };

  //ANCHOR - function for get s3 url
  getSignedUrlWithNoExpiry = async (key: string): Promise<string | null> => {
    try {
      const s3info = this.s3.getSignedUrlPromise('getObject', {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: key,
      });
      return s3info;
    } catch (error) {
      return null;
    }
  };

  //ANCHOR - function handle Image Upload
  handleImageUpload = async (
    imageData: string,
    uploadPath: string,
  ): Promise<string> => {
    if (imageData && imageData.includes('base64')) {
      const uploadImage = await this.uploadFileInS3Bucket(
        imageData,
        uploadPath,
      );

      if (uploadImage !== false) {
        return uploadImage.Key;
      } else {
        throw new HttpException(IMAGE_UPLOAD_ERROR, HttpStatus.BAD_REQUEST);
      }
    }
    return imageData;
  };

  removeCommonProperties = (obj: any) => {
    const { _id, createdAt, updatedAt, ...rest } = obj;
    return rest;
  };

  convertToM3U8 = (url: string) => {
    try {
      const qualityLevels = [
        { resolution: '640x360', bitrate: '500k' },
        { resolution: '854x480', bitrate: '1000k' },
        { resolution: '1280x720', bitrate: '2000k' },
        { resolution: '1920x1080', bitrate: '5000k' },
      ];
      const masterPlaylistEntries = [];
      const fileName = url.split('/')[url.split('/').length - 1];

      qualityLevels.map((qualityLevel) => {
        const playlistFilename = `${fileName.split('.')[0]}_${
          qualityLevel.resolution
        }.m3u8`;
        masterPlaylistEntries.push({
          bandwidth: qualityLevel.bitrate.replace('k', '000'), // Convert bitrate to bps
          resolution: qualityLevel.resolution,
          playlist: playlistFilename,
        });

        ffmpeg(`/home/ubuntu/mkcorigin/course-video/${fileName}`)
          .addOption('-c:v', 'libx264')
          .addOption('-b:v', qualityLevel.bitrate)
          .addOption('-maxrate', qualityLevel.bitrate)
          .addOption('-bufsize', '2M')
          .addOption('-vf', `scale=${qualityLevel.resolution}`)
          .addOption('-c:a', 'aac')
          .addOption('-b:a', '128k')
          .addOption('-hls_time', '10')
          .addOption('-hls_list_size', '0')
          .addOption('-start_number', '0')
          .addOption(
            '-hls_segment_filename',
            `/home/ubuntu/mkcdest/${fileName.split('.')[0]}_${
              qualityLevel?.resolution
            }_%03d.ts`,
          )
          .output(
            `/home/ubuntu/mkcdest/${fileName.split('.')[0]}_${
              qualityLevel?.resolution
            }.m3u8`,
          )
          .run();
      });

      //NOTE: Create master playlist
      const masterPlaylistContent =
        '#EXTM3U\n' +
        masterPlaylistEntries
          .map(
            (entry) =>
              `#EXT-X-STREAM-INF:BANDWIDTH=${entry.bandwidth},RESOLUTION=${entry.resolution}\n${entry.playlist}`,
          )
          .join('\n');

      const data = Buffer.from(masterPlaylistContent);

      const params = {
        Bucket: MKC_CONVERTER,
        Key: `${fileName.split('.')[0]}_master.m3u8`,
        Body: data,
      };

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      this.s3.upload(params, (err, data) => {
        if (err) throw err;
      });

      const masterLink = `https://${
        params.Bucket
      }.s3.amazonaws.com/${encodeURIComponent(params.Key)}`;

      return masterLink;
    } catch (err) {
      return err.message;
    }
  };

  //ANCHOR - generate Pdf For Reports
  generatePdfForReports = async (jsonData: any): Promise<any> => {
    // NOTE - sending to a functionn to render the data and send back html
    const htmlString = await this.pdfGenerator(jsonData);

    const pdfOptions: any = {
      format: 'A4', //TODO: Set the paper size to A5
    };

    // NOTE - creating a pdf buffer from the html
    const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
      pdf.create(htmlString, pdfOptions).toBuffer((err: any, buffer: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(buffer);
        }
      });
    });

    return pdfBuffer;
  };

  //ANCHOR - generate Landscape Pdf For Reports
  generateLandscapePdfForReports = async (jsonData: any): Promise<any> => {
    // NOTE - sending to a function to render the data and send back html
    const htmlString = await this.pdfGenerator(jsonData);

    const pdfOptions: any = {
      format: 'A4', // Set the paper size to A4
      orientation: 'landscape', // Set the orientation to landscape
    };

    // NOTE - creating a pdf buffer from the html
    const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
      pdf.create(htmlString, pdfOptions).toBuffer((err: any, buffer: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(buffer);
        }
      });
    });

    return pdfBuffer;
  };

  //ANCHOR: Generating html string from the data and ejs file
  pdfGenerator = async (jsonData: any) => {
    const html = await ejs.renderFile(jsonData.path, jsonData);
    return html as string;
  };

  //ANCHOR: Generating a four digit unique number
  genereatInvoiceNumber = () => {
    const number = Math.floor(1000 + Math.random() * 9000);
    return number;
  };

  //ANCHOR: convert To Short Date
  convertToShortDate = async (date: Date | null): Promise<string | null> => {
    if (!date) return null;

    const formattedDate = date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
    });

    return formattedDate;
  };
}
