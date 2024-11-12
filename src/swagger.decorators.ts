import { ApiQuery } from '@nestjs/swagger';

export function ApiQueriesForGetAll(): MethodDecorator {
  return (
    target: any,
    key: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    ApiQuery({ name: 'page', description: 'Page number', required: false })(
      target,
      key,
      descriptor,
    );
    ApiQuery({
      name: 'limit',
      description: 'Number of items per page',
      required: false,
    })(target, key, descriptor);
    ApiQuery({
      name: 'search',
      description: 'Search with name',
      required: false,
    })(target, key, descriptor);
  };
}

export function ApiQueriesBookInStock(): MethodDecorator {
  return (
    target: any,
    key: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    ApiQuery({
      name: 'stock',
      description: 'Book available in stock or not',
      required: false,
    })(target, key, descriptor);
    ApiQuery({
      name: 'category',
      description: 'categoryId',
      required: false,
    })(target, key, descriptor);
  };
}

export function ApiQueriesProducts(): MethodDecorator {
  return (
    target: any,
    key: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    ApiQuery({
      name: 'type',
      description: 'Get products based on type',
      required: false,
    })(target, key, descriptor);
    ApiQuery({
      name: 'course',
      description: 'Get products based on course',
      required: false,
    })(target, key, descriptor);
    ApiQuery({
      name: 'category',
      description: 'category Id',
      required: false,
    })(target, key, descriptor);
  };
}

export function ApiQueriesForPayment(): MethodDecorator {
  return (
    target: any,
    key: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    ApiQuery({
      name: 'fromDate',
      description: 'fromDate - 2023-09-01',
      required: false,
    })(target, key, descriptor);
    ApiQuery({
      name: 'toDate',
      description: 'toDate - 2023-09-10',
      required: false,
    })(target, key, descriptor);
    ApiQuery({
      name: 'search',
      description: 'search',
      required: false,
    })(target, key, descriptor);
    ApiQuery({
      name: 'status',
      description: 'paymentstatus - paid ,failed or pending',
      required: false,
    })(target, key, descriptor);
  };
}

export function ApiQueriesWallet(): MethodDecorator {
  return (
    target: any,
    key: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    ApiQuery({
      name: 'wallet',
      description: 'Apply amount based on the user coint ',
      required: false,
    })(target, key, descriptor);
  };
}

export function ApiQueriesForExistingPaymnet(): MethodDecorator {
  return (
    target: any,
    key: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    ApiQuery({
      name: 'categoryId',
      description: 'categoryId ',
      required: false,
    })(target, key, descriptor);
    ApiQuery({
      name: 'courseId',
      description: 'courseId',
      required: false,
    })(target, key, descriptor);
    ApiQuery({
      name: 'type',
      description: 'type',
      required: false,
    })(target, key, descriptor);
    ApiQuery({
      name: 'userId',
      description: 'userId',
      required: false,
    })(target, key, descriptor);
  };
}

export function ApiQueriesForReceipt(): MethodDecorator {
  return (
    target: any,
    key: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    ApiQuery({
      name: 'orderId',
      description: 'orderId',
      required: false,
    })(target, key, descriptor);
    ApiQuery({
      name: 'type',
      description: 'type of receipt',
      required: false,
    })(target, key, descriptor);
  };
}

export function ApiQueriesForType(): MethodDecorator {
  return (
    target: any,
    key: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    ApiQuery({
      name: 'type',
      description: 'type',
      required: false,
    })(target, key, descriptor);
  };
}

export function ApiQueriesForDate(): MethodDecorator {
  return (
    target: any,
    key: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    ApiQuery({
      name: 'date',
      description: 'date',
      required: false,
    })(target, key, descriptor);
  };
}

//NOTE - assignment query
export function ApiQueriesForCourseLibrary(): MethodDecorator {
  return (
    target: any,
    key: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    ApiQuery({
      name: 'fromDate',
      description: 'fromDate - 2023-09-01',
      required: false,
    })(target, key, descriptor);
    ApiQuery({
      name: 'toDate',
      description: 'toDate - 2023-09-10',
      required: false,
    })(target, key, descriptor);
    ApiQuery({
      name: 'course',
      description: 'courseId',
      required: false,
    })(target, key, descriptor);
    ApiQuery({
      name: 'subject',
      description: 'subjectId',
      required: false,
    })(target, key, descriptor);
    ApiQuery({
      name: 'chapter',
      description: 'chapterId',
      required: false,
    })(target, key, descriptor);
    ApiQuery({
      name: 'type',
      description: 'Attachment Type: video, notes, test',
      required: false,
    })(target, key, descriptor);
  };
}

export function ApiQueriesForRangeDateFilter(): MethodDecorator {
  return (
    target: any,
    key: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    ApiQuery({
      name: 'fromDate',
      description: 'fromDate - 2023-09-01',
      required: false,
    })(target, key, descriptor);
    ApiQuery({
      name: 'toDate',
      description: 'toDate - 2023-09-10',
      required: false,
    })(target, key, descriptor);
  };
}

export function ApiQueriesTestStatus(): MethodDecorator {
  return (
    target: any,
    key: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    ApiQuery({
      name: 'testStatus',
      description: 'testStatus as draft or published',
      required: false,
    })(target, key, descriptor);
  };
}

export function ApiQueriesPaymentStatus(): MethodDecorator {
  return (
    target: any,
    key: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    ApiQuery({
      name: 'status',
      description: 'paymentStatus as new or existing',
      required: false,
    })(target, key, descriptor);
  };
}

export function ApiQueriesUser(): MethodDecorator {
  return (
    target: any,
    key: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    ApiQuery({
      name: 'user',
      description: 'user (search with name, email, mobile)',
      required: false,
    })(target, key, descriptor);
  };
}

export function ApiQueriesHealthcareService(): MethodDecorator {
  return (
    target: any,
    key: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    ApiQuery({
      name: 'serviceId',
      description: 'serviceId (Healthcare service Id)',
      required: false,
    })(target, key, descriptor);
  };
}

export function ApiQueriesDoctor(): MethodDecorator {
  return (
    target: any,
    key: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    ApiQuery({
      name: 'doctorId',
      description: 'doctor id',
      required: false,
    })(target, key, descriptor);
  };
}

export function ApiQueriesStaff(): MethodDecorator {
  return (
    target: any,
    key: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    ApiQuery({
      name: 'staffId',
      description: 'Staff id',
      required: false,
    })(target, key, descriptor);
  };
}

export function ApiQueriesHostelRoomReport(): MethodDecorator {
  return (
    target: any,
    key: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    ApiQuery({
      name: 'hostelId',
      description: 'hostel id',
      required: true,
    })(target, key, descriptor);

    ApiQuery({
      name: 'bedType',
      description: 'bedType',
      required: false,
    })(target, key, descriptor);

    ApiQuery({
      name: 'roomNumber',
      description: 'room number',
      required: false,
    })(target, key, descriptor);

    ApiQuery({
      name: 'floorNumber',
      description: 'floor number',
      required: false,
    })(target, key, descriptor);
  };
}

export function ApiQueriesHostelId(): MethodDecorator {
  return (
    target: any,
    key: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    ApiQuery({
      name: 'hostelId',
      description: 'Hostel Id',
      required: false,
    })(target, key, descriptor);
  };
}
