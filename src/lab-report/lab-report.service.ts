import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Document, Model, Types } from 'mongoose';
import * as pdf from 'html-pdf';
import { HealthCareFinance } from 'src/schema/healthcare-finance.schema';
import { GetLabReportDto } from './dto/get-lab-report.dto';
import {
  CompareValueRangeType,
  Gender,
  HealthCarePurchaseType,
  HealthCareTestDBType,
  HealthCareTestInputType,
  LabReportTestInputType,
} from 'src/utills/enum';
import {
  INVALID_ID,
  LAB_REPORT_NOT_EXIST,
  RECORD_NOT_FOUND,
} from 'src/utills/messages';
import { ModifyLabReportDto } from './dto/submit-lab-report.dto';
import { LabReport } from 'src/schema/lab.report.schema';
import { CommonService } from 'src/utills/commonService';
import { Setting } from 'src/schema/site-setting.schema';

@Injectable()
export class LabReportService {
  constructor(
    @InjectModel(LabReport.name)
    private labReportModel: Model<LabReport>,
    @InjectModel(HealthCareFinance.name)
    private healthCareFinanceModel: Model<HealthCareFinance>,
    @InjectModel(Setting.name) private settingModel: Model<Setting>,
    private readonly commonService: CommonService,
  ) {}

  //SECTION - get lab Report Of User
  async getLabReportOfUser(payload: GetLabReportDto): Promise<{ data: any }> {
    const { paymentId, isLabReportAdded, reportId } = payload;

    if (isLabReportAdded === false) {
      //NOTE - get finance report
      const paymentDetails: any = await this.healthCareFinanceModel
        .findById(paymentId)
        .populate([
          { path: 'userId', select: 'name dob gender' },
          {
            path: 'packageId',
            select: 'testPackagesId',
            populate: [
              {
                path: 'testPackagesId',
                select: 'name testIds',
                populate: [
                  {
                    path: 'testIds',
                    select:
                      'type name shortName parameters inputType document unitId document normalValues categoryId',
                    populate: [
                      { path: 'categoryId', select: 'name' },
                      { path: 'unitId', select: 'name' },
                      { path: 'parameters.unitId', select: 'name' },
                    ],
                  },
                ],
              },
            ],
          },
          {
            path: 'testDatabaseId',
            select:
              'type name shortName parameters inputType unitId document normalValues categoryId',
            populate: [
              { path: 'categoryId', select: 'name' },
              { path: 'unitId', select: 'name' },
              { path: 'parameters.unitId', select: 'name' },
            ],
          },
        ]);

      const age =
        paymentDetails?.userId?.dob !== null
          ? await this.calculateAge(paymentDetails?.userId?.dob)
          : null;
      const gender = paymentDetails?.userId?.gender;

      let testDetails: any;
      if (
        paymentDetails?.purchaseProductType ===
        HealthCarePurchaseType.TEST_DATABASE
      ) {
        testDetails = await this.mapLabReport(
          paymentDetails.testDatabaseId,
          gender,
          age,
        );
      } else {
        const testPackages = paymentDetails?.packageId?.testPackagesId || [];
        const testIds = testPackages.reduce(
          (acc: string | any[], curr: { testIds: any }) =>
            acc.concat(curr?.testIds || []),
          [],
        );
        testDetails = await this.mapLabReport(testIds, gender, age);
      }

      //NOTE: return the response
      const result = {
        name: paymentDetails?.userId?.name,
        gender: paymentDetails?.userId?.gender,
        age:
          paymentDetails?.userId?.dob !== null
            ? await this.calculateAge(paymentDetails?.userId?.dob)
            : null,
        enablePrint: false,
        reportDate: null,
        testDetails,
      };

      return { data: result };
    } else {
      const report: any = await this.labReportModel
        .findById(reportId)
        .populate([
          { path: 'userId', select: 'name' },
          {
            path: 'testDetails',
            select: 'categoryId allTests',
            populate: [
              { path: 'categoryId', select: 'name' },
              {
                path: 'allTests',
                select: 'testDatabaseId type nestedTest',
                populate: [
                  {
                    path: 'testDatabaseId',
                    select: 'name shortName ',
                  },
                  {
                    path: 'nestedTest',
                    select: 'sequence name valueType valueRange value unitId',
                    populate: {
                      path: 'unitId',
                      select: 'name ',
                    },
                  },
                ],
              },
            ],
          },
        ]);

      //NOTE: testDetails based on the data
      const details = report?.testDetails.map(
        (ele: { categoryId: { _id: any; name: any }; allTests: any[] }) => ({
          categoryId: ele.categoryId?._id ?? null,
          categoryName: ele.categoryId?.name ?? null,
          allTests: ele.allTests.map((item) => ({
            testDatabaseId: item.testDatabaseId?._id,
            name: item.testDatabaseId?.name ?? null,
            shortName: item.testDatabaseId?.shortName ?? null,
            type: item.type,
            nestedTest: item.nestedTest.map(
              (value: {
                sequence: number;
                name: string;
                valueType: LabReportTestInputType;
                valueRange: CompareValueRangeType;
                value: string;
                unitId: { _id: string; name: string };
                reference: any;
              }) => ({
                sequence: value.sequence ?? null,
                name: value.name ?? null,
                valueType: value.valueType ?? null,
                valueRange: value.valueRange ?? null,
                value: value?.value ?? null,
                unitId: value.unitId?._id ?? null,
                unitName: value.unitId?.name ?? null,
                reference: value.reference ?? null,
              }),
            ),
          })),
        }),
      );

      //NOTE: return the response
      const result = {
        name: report?.userId?.name,
        gender: report?.gender,
        age: report?.age,
        enablePrint: true,
        reportDate: report.createdAt,
        testDetails: details,
      };

      return { data: result };
    }
  }

  //SECTION - submit Lab Report from admin panel
  async submitLabReport(
    payload: ModifyLabReportDto,
    staffId: string,
  ): Promise<{ data: any }> {
    const { reportId, paymentId } = payload;

    let reportDetails: Document<unknown, object, LabReport> &
      LabReport & { _id: Types.ObjectId };
    if (reportId) {
      reportDetails = await this.labReportModel.findByIdAndUpdate(reportId, {
        ...payload,
        updatedBy: staffId,
      });

      if (!reportDetails)
        throw new HttpException(LAB_REPORT_NOT_EXIST, HttpStatus.BAD_REQUEST);
    } else {
      reportDetails = await this.labReportModel.create({
        ...payload,
        createdBy: staffId,
      });
    }

    await this.healthCareFinanceModel.findByIdAndUpdate(paymentId, {
      $set: { reportId: reportDetails._id, isLabReportAdded: true },
    });

    const data = {
      paymentId,
      reportId: reportDetails._id,
      isLabReportAdded: true,
    };
    return { data };
  }

  // SECTION - print Lab Report
  async printLabReport(id: string): Promise<any> {
    // NOTE - check whether id is valid or not and if it is not then throw error
    if (!mongoose.isValidObjectId(id))
      throw new HttpException(INVALID_ID, HttpStatus.BAD_REQUEST);

    const report: any = await this.labReportModel.findById(id).populate([
      { path: 'userId', select: 'name address' },
      {
        path: 'testDetails',
        select: 'categoryId allTests',
        populate: [
          { path: 'categoryId', select: 'name' },
          {
            path: 'allTests',
            select: 'testDatabaseId type nestedTest',
            populate: [
              {
                path: 'testDatabaseId',
                select: 'name shortName ',
              },
              {
                path: 'nestedTest',
                select: 'sequence name valueType valueRange value unitId',
                populate: {
                  path: 'unitId',
                  select: 'name ',
                },
              },
            ],
          },
        ],
      },
    ]);

    if (!report)
      throw new HttpException(RECORD_NOT_FOUND, HttpStatus.BAD_REQUEST);

    //NOTE - get logo url
    const getLogo = await this.settingModel.findOne();

    //NOTE: testDetails based on the data
    const details = await Promise.all(
      report?.testDetails.map(
        async (ele: {
          categoryId: { _id: any; name: any };
          allTests: any[];
        }) => ({
          userDetails: {
            logoLink: getLogo?.hospitalLogoLink
              ? await this.commonService.getSignedUrl(getLogo?.hospitalLogoLink)
              : null,
            name: report?.userId?.name,
            gender: report?.gender
              ? report.gender.charAt(0).toUpperCase() + report.gender.slice(1)
              : null,
            age: report?.age,
            address: report.userId?.address,
            reportDate: await this.convertToShortDate(report?.createdAt),
          },
          categoryName: ele.categoryId?.name ?? null,
          allTests: await Promise.all(
            ele.allTests.map(async (item) => ({
              testDatabaseId: item.testDatabaseId?._id,
              name: item.testDatabaseId?.name ?? null,
              shortName: item.testDatabaseId?.shortName ?? null,
              type: item.type,
              nestedTest: await Promise.all(
                item.nestedTest.map(
                  async (value: {
                    sequence: number;
                    name: string;
                    valueType: LabReportTestInputType;
                    valueRange: CompareValueRangeType;
                    value: string;
                    unitId: { _id: string; name: string };
                    reference: any;
                  }) => ({
                    sequence: value.sequence ?? null,
                    name: value.name ?? null,
                    valueType: value.valueType ?? null,
                    valueRange: value.valueRange ?? null,
                    value: value?.value ?? null,
                    unitId: value.unitId?._id ?? null,
                    unitName: value.unitId?.name ?? null,
                    reference: value.reference ?? null,
                  }),
                ),
              ),
            })),
          ),
        }),
      ),
    );

    // NOTE - Custom json to send to ejs file to replace the variables there
    const jsonData = {
      path: process.env.HEALTH_HUB_LAB_REPORT_EJS_URL,
      data: {
        testDetails: details,
      },
    };

    const pdf = await this.generatePdfForReports(jsonData);
    return pdf;
  }

  //ANCHOR - calculate Age based on DOB
  private async calculateAge(dob: string | number | Date): Promise<number> {
    // Create date objects for the DOB and current date
    const birthDate = new Date(dob);
    const currentDate = new Date();

    let age = currentDate.getFullYear() - birthDate.getFullYear();

    // Check if the current date has passed the birthday of the person this year
    if (
      currentDate.getMonth() < birthDate.getMonth() ||
      (currentDate.getMonth() === birthDate.getMonth() &&
        currentDate.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age;
  }

  //ANCHOR : map lab report if not added
  private async mapLabReport(
    paymentDetails: any[],
    gender: any,
    age: number,
  ): Promise<any> {
    const groupedTests = {};

    const mapNestedTest = (test) => {
      if (
        test.type === HealthCareTestDBType.SINGLE ||
        test.type === HealthCareTestDBType.DOCUMENT
      ) {
        return [
          {
            _id: test._id,
            name: test.name || null,
            valueType:
              test.type === HealthCareTestDBType.SINGLE
                ? test?.inputType
                : LabReportTestInputType.DOCUMENT,
            unitId: test.unitId?._id || null,
            unitName: test.unitId?.name || null,
            value:
              test.type === HealthCareTestDBType.DOCUMENT
                ? test.document
                : null,
            reference:
              test?.normalValues?.numericRangevalue
                ?.filter(
                  (range: { gender: Gender; minAge: number; maxAge: number }) =>
                    range.gender === gender &&
                    age >= range.minAge &&
                    age <= range.maxAge,
                )
                ?.map(
                  (range: { upperValue: number; lowerValue: number }) =>
                    `${range.lowerValue}-${range.upperValue}`,
                )
                .join(', ') || null,
          },
        ];
      } else if (test.type === HealthCareTestDBType.MULTIPLE) {
        return test.parameters?.map(
          (item: {
            sequence: number;
            name: string;
            inputType: HealthCareTestInputType;
            defaultResult: string;
            unitId: { _id: string; name: string };
          }) => ({
            sequence: item.sequence,
            name: item.name,
            valueType: item?.inputType ?? null,
            value: item?.defaultResult ?? null,
            unitId: item.unitId?._id || null,
            unitName: item.unitId?.name || null,
            reference:
              test?.normalValues?.numericRangevalue
                ?.filter(
                  (range: { gender: Gender; minAge: number; maxAge: number }) =>
                    range.gender === gender &&
                    age >= range.minAge &&
                    age <= range.maxAge,
                )
                ?.map(
                  (range: { upperValue: number; lowerValue: number }) =>
                    `${range.lowerValue}-${range.upperValue}`,
                )
                .join(', ') || null,
          }),
        );
      }
      return null;
    };

    const mapTest = (test: {
      _id: string;
      name: string;
      shortName: string;
      type: HealthCareTestDBType;
    }) => ({
      testDatabaseId: test._id,
      name: test.name || null,
      shortName: test.shortName || null,
      type: test.type || null,
      nestedTest: mapNestedTest(test),
    });

    paymentDetails.forEach((ele) => {
      const categoryId = ele.categoryId?._id;
      if (!groupedTests[categoryId]) {
        groupedTests[categoryId] = {
          categoryId: categoryId || null,
          categoryName: ele.categoryId?.name || null,
          allTests: [],
        };
      }
      groupedTests[categoryId].allTests.push(mapTest(ele));
    });

    return Object.values(groupedTests);
  }

  //ANCHOR - generate Pdf For Reports
  private async generatePdfForReports(jsonData: any): Promise<any> {
    // NOTE - sending to a functionn to render the data and send back html
    const htmlString = await this.commonService.pdfGenerator(jsonData);

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
  }

  //ANCHOR - convert To Short Date
  private async convertToShortDate(date: Date | null): Promise<string | null> {
    if (!date) return null;

    const formattedDate = date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
    });

    return formattedDate;
  }
}
