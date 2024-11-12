import axios from 'axios';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CONVERT_MSG_FAILED, MSG_FAILED } from './messages';

@Injectable()
export class SmsService {
  //SECTION - PRE-BOOK -INSTANT
  preBookInstantSms = async ({
    name,
    phone,
    course,
    date,
    url,
  }: {
    name: any;
    phone: any;
    course: string;
    date: any;
    url: any;
  }): Promise<any> => {
    try {
      const mobile = `91${phone}`;
      // NOTE - send sms
      const options = {
        method: 'POST',
        url: process.env.MSG_91_SMS_URL,
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
          authkey: process.env.MSG91_AUTH_KEY,
        },
        data: {
          template_id: process.env.PRE_BOOK_INSTANT_H,
          recipients: [
            {
              mobiles: mobile,
              name,
              course,
              date: this.convertToShortDate(date),
              url,
            },
          ],
        },
      };
      return await axios.request(options);
    } catch (error) {
      throw new HttpException(MSG_FAILED, HttpStatus.EXPECTATION_FAILED);
    }
  };

  //SECTION - extend Payment Date
  extendPaymentDate = async ({
    name,
    phone,
    course,
    date,
    url,
  }: {
    name: any;
    phone: any;
    course: string;
    date: any;
    url: any;
  }): Promise<any> => {
    try {
      const mobile = `91${phone}`;
      // NOTE - send sms
      const options = {
        method: 'POST',
        url: process.env.MSG_91_SMS_URL,
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
          authkey: process.env.MSG91_AUTH_KEY,
        },
        data: {
          template_id: process.env.PRE_BOOK_R_H,
          recipients: [
            {
              mobiles: mobile,
              name,
              course,
              date,
              url,
            },
          ],
        },
      };
      return await axios.request(options);
    } catch (error) {
      throw new HttpException(
        'Failed to send sms',
        HttpStatus.EXPECTATION_FAILED,
      );
    }
  };

  //SECTION - message On Order Confirmation
  messageOnOrderConfirmation = async ({
    amount,
    orderId,
    number,
    phone,
  }: {
    amount: any;
    number: any;
    phone: any;
    orderId: string;
  }): Promise<any> => {
    try {
      const mobile = `91${number}`;
      // NOTE - send sms
      const options = {
        method: 'POST',
        url: process.env.MSG_91_SMS_URL,
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
          authkey: process.env.MSG91_AUTH_KEY,
        },
        data: {
          template_id: process.env.MSG_91_SEND_MESSAGE_TEMPLATE_ID,
          recipients: [
            {
              mobiles: mobile,
              amount,
              order: orderId,
              phone,
            },
          ],
        },
      };
      return await axios.request(options);
    } catch (error) {
      throw new HttpException(
        'Failed to send sms',
        HttpStatus.EXPECTATION_FAILED,
      );
    }
  };

  //ANCHOR - convert To Short Date
  convertToShortDate(dateString: Date | null): string | null {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Months are zero-based
    const year = date.getFullYear().toString().slice(-2);
    return `${day}-${month}-${year}`;
  }

  //ANCHOR - function to replace the message content
  replaceMessagesContent = async ({
    message,
    variables,
  }: {
    message: string;
    variables: any;
  }): Promise<string> => {
    try {
      const regex = /##(.*?)##/g;
      const replacedMessage = message.replace(regex, (_, variable) => {
        return variables[variable.trim()] || '';
      });
      return replacedMessage;
    } catch (error) {
      throw new HttpException(
        CONVERT_MSG_FAILED,
        HttpStatus.EXPECTATION_FAILED,
      );
    }
  };
}
