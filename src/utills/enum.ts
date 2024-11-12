export enum PageSourceType {
  HOME = 'home',
  DASHBOARD = 'dashboard',
}

export enum ApplicationType {
  WEB = 'web',
  MOBILE = 'mobile',
  ADMIN = 'admin',
  NDA_LANDING = 'nda_landing_page',
  HEALTH_CARE_LANDING = 'health_care_landing_page',
  NEET_LANDING = 'neet_landing_page',
  JEE_LANDING = 'jee_landing_page',
  TOP_PERFORMER = 'top_performer',
  SCHOLARSHIP_LANDING = 'scholarship_landing_page',
  ADS_APP = 'ads_app',
  SSB_LANDING = 'ssb_landing_page',
  CDS_LANDING = 'cds_landing_page',
}

export enum BindingType {
  CASE_BINDING = 'Case Binding',
  PERFECT_BINDING = 'Perfect Binding',
  SADDLE_STCH = 'Saddle Stitching',
  SPRIAL_BINDING = 'Spiral Binding',
}

export enum BookType {
  PAPER_BACK = 'Paperback',
  E_BOOK = 'Ebook',
}

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
}

export enum CourseContentType {
  PDF = 'Pdf',
  VIDEO = 'Video',
}

export enum FAQType {
  COMMON = 'Common',
  ONLINE_COURSE = 'Online course',
  REFER_EARN = 'Refer and earn',
}

export enum CourseThumbnailType {
  IMAGE = 'Image',
  VIDEO = 'Video',
}

export enum UserType {
  STUDENT = 'student',
  PARENT = 'parent',
  ENQUIRY = 'enquiry',
  STAFF = 'staff',
  ANONYMOUS = 'anonymous',
  HOSPITAL_STUDENT = 'hospital_student',
  HOSPITAL_ENQUIRY = 'hospital_enquiry',
  HOSTEL_ENQUIRY = 'hostel_enquiry',
  HOSTELLER = 'hosteller',
}

export enum ProductType {
  ONLINE_COURSE = 'Online Course',
  BOOK = 'Book',
  TEST_SERIES = 'Test series',
  OFFLINE_COURSE = 'Offline Course',
  HEALTH_CARE = 'Health Care',
  HOSTEL = 'HOSTEL',
}

export enum TestStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  PARTIALLY_PAID = 'partially paid',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum AnswerType {
  OPTION_A = 'a',
  OPTION_B = 'b',
  OPTION_C = 'c',
  OPTION_D = 'd',
  OPTION_E = 'e',
  OPTION_BLANK = '',
}

export enum DifficultyLevelType {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
}

export enum FollowUpTypes {
  CALL = 'call',
  MESSAGE = 'message',
}

export enum ModeTypes {
  ONLINE = 'online',
  OFFLINE = 'offline',
}

export enum VideoType {
  UPLOAD = 'upload',
  YOUTUBE = 'youtube',
}

export enum CouponType {
  AMOUNT = 'amount',
  PERCENT = 'percent',
}

export enum FreeContentType {
  LEARNING = 'learning',
  NOTES = 'notes',
}

export enum UserStatusTypes {
  APPLIED = 'applied',
  CALLING_PROCESS = 'calling process',
  WALK_IN = 'walk in',
  PRE_BOOK = 'pre book',
  BOOK_SOLD = 'book sold',
  TEST_SOLD = 'test sold',
  CONVERSION = 'conversion',
  PREFER_ADMISSION = 'prefer admission',
  ADMITTED = 'admitted',
}

export enum OfflinePaymentType {
  UPI = 'upi',
  CASH = 'cash',
  CHEQUE = 'cheque',
  CARD = 'card',
  BANK_TRANSFER = 'bank transfer',
  PHONE_PAY_BUSINESS = 'phone pay business',
  PHONE_PAY = 'phone pay',
  GOOGLE_PAY = 'google pay',
  PAYTM = 'paytm',
  REBATE = 'rebate',
  COURSE_CHANGE = 'course_change',
}

export enum OfflineCoursePriceType {
  PRE_BOOK = 'prebook',
  BASE_PRICE = 'base_price',
  DISCOUNT_PRICE = 'discount_price',
}

export enum EventTypes {
  FREE = 'free',
  PAID = 'paid',
}

export enum ShippingStatusType {
  ORDERED = 'ordered',
  DISPATCHED = 'dispatched',
  DELIVERED = 'delivered',
  RETURNED = 'returned',
}

export enum CoinTransactionReasonTypes {
  PRODUCT_PURCHASE = 'product_purchase',
  SIGN_UP = 'sign_up',
  REFER = 'refer',
}

export enum ConverterStatus {
  ONGOING = 'ongoing',
  COMPLETED = 'completed',
  ERROR = 'error',
}

export enum VideoQualities {
  LOW_DEFINITION = '360p',
  HIGH_DEFINITION = '720p',
  FULL_HIGH_DEFINITION = '1080p',
}

export enum OrderTypes {
  AUTOMATION = 'automation',
  MANUAL = 'manual',
  COURSE_CHANGE = 'course_change',
  BED_TYPE_CHANGE = 'bedType_change',
  HOSTEL_CHANGE = 'hostel_change',
  BOOK_PURCHASE = 'book_purchase',
}

export enum TransactionStatus {
  INSTALLMENT = 'installment',
  FULL_PAYMENT = 'full_payment',
  INSTALLMENT_COMPLETE = 'installment_complete',
  INSTALLMENT_CLOSED = 'installment_close',
  INSTALLMENT_CLOSED_DUE_TO_COURSE_CHANGE = 'installment_close_course_change',
}

export enum QuestionResponseStatus {
  ATTEMPTED = 'attempted',
  UNATTEMPTED = 'unattempted',
  SKIPPED = 'skipped',
}

export enum LibraryTypes {
  VIDEOURL = 'videoUrl',
  PDFURL = 'pdfUrl',
  TEST = 'test',
}

export enum SavedProductTypes {
  TEST = 'Test',
  LEARNING = 'Learning',
  NOTES = 'Notes',
  COURSE_VIDEO = 'course_video',
  COURSE_PDF = 'course_pdf',
}

export enum CourseLibraryType {
  VIDEO = 'video',
  NOTES = 'notes',
  TEST = 'test',
}

export enum FeeTypes {
  PRODUCT_PURCHASE = 'product_purchase',
  HOSTEL_PAYMENT = 'hostel_payment',
  HOSPITAL_PAYMENT = 'hospital_payment',
  ID_ISSUE = 'id_issue',
  RE_ADMISSION = 're_admission_fee',
  FINE = 'fine',
  CYCLE_STAND = 'cycle_stand_fee',
  BATCH_TRANSFER = 'batch_transfer_fee',
  OTHER = 'other',
}

export enum AdmissionStatus {
  PENDING = 'pending',
  DONE = 'done',
}

export enum StudentSignUpType {
  ONLINE = 'online',
  OFFLINE = 'offline',
  BOOK = 'Book',
  TEST_SERIES = 'Test series',
  MOCK_TEST = 'mock_test',
  SCHOLARSHIP_TEST = 'scholarship_test',
}
export enum FollowUpStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
}

export enum Units {
  GRAM = 'gram',
  KILOGRAM = 'kilogram',
  MILLIGRAM = 'milligram',
  PIECE = 'piece',
}

export enum AnswerKeyTypes {
  ALL = 'all',
  CORRECT = 'correct',
  INCORRECT = 'incorrect',
  UNATTEMPTED = 'unattempted',
}

export enum DefaulterTypes {
  TODAY = 'today',
  UPCOMING = 'upcoming',
  OVERDUE = 'overdue',
  EXTENDED = 'extended',
  PREBOOK = 'prebook',
  ADMITTED = 'admitted',
  CLOSED = 'closed',
  DROPPED = 'dropped',
}

export enum BedTypes {
  ONE_BED = 1,
  TWO_BED = 2,
  THREE_BED = 3,
  FOUR_BED = 4,
  FIVE_BED = 5,
  HALL = 6,
}

export enum Gst {
  GST_0 = 0,
  GST_5 = 5,
  GST_12 = 12,
  GST_18 = 18,
  GST_28 = 28,
}

export enum LiveClassType {
  ZOOM_CLASS = 'zoom_class',
  LIVE_STREAM = 'live_stream',
  YOUTUBE_LIVE_STREAM = 'youtube_live_stream',
}

export enum AnswerPaceTypes {
  TOO_FAST = 'too_fast',
  IDEAL = 'ideal',
  OVERTIME = 'overtime',
}

export enum StockEntryStatus {
  SPECIAL_QUOTA = 'special_quota',
  WITHDRAWN = 'withdrawn',
  AVAILABLE = 'available',
  ISSUED = 'issued',
  ON_REPAIR = 'onrepair',
  RETURN = 'return',
}

export enum StockEntryType {
  ISSUABLE = 'issuable',
  NON_ISSUABLE = 'non_issuable',
}

export enum StockEntryMemberType {
  STUDENT = 'student',
  STAFF = 'staff',
}

export enum LiveClassStatus {
  ONGOING = 'ongoing',
  UPCOMING = 'upcoming',
  COMPLETED = 'completed',
}
export enum CounsellorType {
  TELEPHONY = 'telephony',
  WALK_IN = 'walk_in',
  HEALTH_CARE_NORMAL = 'health_care_normal',
  HEALTH_CARE_TELEPHONY = 'health_care_telephony',
  HOSTEL_NORMAL = 'hostel_normal',
  ONLINE = 'online',
  OFFLINE = 'offline',
  BOOK = 'book',
  TEST = 'test',
  MOCK_TEST = 'mock_test',
  SCHOLARSHIP_TEST = 'scholarship_test',
}

export enum EnquiryStatus {
  NEW = 'new',
  INPROGRESS = 'inProgress',
  COMPLETED = 'completed',
  CLOSED = 'closed',
}

export enum HostelPriceType {
  PRE_BOOK = 'prebook',
  FULL_PAYMENT = 'full_payment',
  BED_TYPE_CHANGE = 'bed type change',
  HOSTEL_CHANGE = 'hostel change',
  REFUND = 'refund',
}

export enum OrderGenerateType {
  PRODUCT = 'product',
  HOSTEL = 'hostel',
  HOSPITAL = 'hospital',
}

export enum PaymentUpdateSourceType {
  ORDER = 'order',
  PAYMENT = 'payment',
}

export enum UserStatusType {
  EXISTING_STUDENT = 'EXISTING STUDENT',
  NEW_STUDENT = 'NEW STUDENT',
}

export enum LibraryDataTypes {
  COURSE_DATA = 'courseData',
  LIVE_CLASS = 'liveClass',
}

export enum GenerateReceipt {
  PAYMENT = 'payment',
  INSTALLMENT = 'installment',
}

export enum LeadEligibility {
  Interested = 'interested',
  Not_Interested = 'not interested',
  Not_Selected = 'not selected',
  Call_Not_Picked = 'call not picked',
}

export enum LeadSourceType {
  Organic_Website = 'organic website',
  Organic_App = 'organic app',
  Ads_Website = 'ads website',
  Ads_App = 'ads app',
  Telephony = 'telephony',
  Chatbot = 'chatbot',
  Direct_Entry = 'direct entry',
  Nda_Landing_Page = 'nda landing page',
  Neet_Landing_Page = 'neet landing page',
  Health_Care_Landing_Page = 'health care landing page',
  Jee_Landing_Page = 'jee landing page',
  Brand_Add = 'brand add',
  Scholarship_Landing_Page = 'scholarship landing page',
  Ssb_Landing_page = 'ssb landing page',
  Cds_Landing_page = 'cds landing page',
  Bharti_Landing_page = 'bharti landing page',
  Youtube_Landing_page = 'youtube landing page',
}

export enum FollowUpSource {
  EXTENDED_DATE = 'extended date',
  DROPPED_STUDENT = 'dropped student',
  OTHER = 'other',
  ADMISSION = 'admission',
}

export enum TestMasterTypes {
  ONLINE = 'online',
  OFFLINE = 'offline',
  EVENT = 'event',
}

export enum FollowUpSiteSource {
  STUDENT = 'student',
  HOSTEL = 'hostel',
  HOSPITAL = 'hospital',
}

export enum PeriodTypes {
  PERIOD_1 = 'period 1',
  PERIOD_2 = 'period 2',
  PERIOD_3 = 'period 3',
  PERIOD_4 = 'period 4',
  PERIOD_5 = 'period 5',
  PERIOD_6 = 'period 6',
  PERIOD_7 = 'period 7',
  PERIOD_8 = 'period 8',
}

export enum CouponProductType {
  ONLINE_COURSE = 'Online Course',
  BOOK = 'Book',
  TEST_SERIES = 'Test series',
  OFFLINE_COURSE = 'Offline Course',
  HEALTH_CARE = 'Health Care',
}

export enum AttendanceTypes {
  NOT_MARKED = 'not marked',
  PRESENT = 'present',
  ABSENT = 'absent',
  LEAVE = 'leave',
  RUSTICATED = 'rusticated',
  HOLIDAY = 'holiday',
  SUSPENDED = 'suspended',
  SUNDAY = 'sunday',
  ABSENT_RUSTICATED = 'absent rusticated',
  ABSENT_SUSPENDED = 'absent suspended',
  FINE_ACTIVE = 'fine(active)',
}
export enum PaymentModuleType {
  NEW = 'new',
  EXISTING = 'existing',
}

export enum HealthCareTestInputType {
  NUMERIC = 'Numeric',
  SINGLE_LINE = 'Single Line',
  PARAGRAPH = 'Paragraph',
}

export enum HealthCareTestDBType {
  SINGLE = 'single',
  MULTIPLE = 'multiple',
  DOCUMENT = 'document',
}

export enum HealthCarePurchaseType {
  CARE_PACKAGE = 'care_package',
  TEST_DATABASE = 'test_database',
}

export enum TestMasterAttemptModeTypes {
  SINGLE = 'single',
  MULTIPLE = 'multiple',
}

export enum EventModeTypes {
  ONLINE = 'online',
  CBT = 'cbt',
  OMR = 'omr',
}

export enum EventValidForTypes {
  MOCK_TEST = 'mock_test',
  SCHOLARSHIP_TEST = 'scholarship_test',
}

export enum DaysOfWeekTypes {
  MONDAY = 'monday',
  TUESDAY = 'tuesday',
  WEDNESDAY = 'wednesday',
  THURSDAY = 'thursday',
  FRIDAY = 'friday',
  SATURDAY = 'saturday',
  SUNDAY = 'sunday',
}

export enum OfflineModeType {
  PEN_PAPER = 'pen_paper',
  CBT = 'cbt',
  OMR = 'omr',
}

export enum TestSubmitType {
  PEN_PAPER = 'pen_paper',
  CBT = 'cbt',
  OMR = 'omr',
  ONLINE = 'online',
}

export enum TestNormalValueType {
  TEXT = 'text',
  NUMERIC_RANGE = 'numeric_range',
}

export enum NumericValueGenderType {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
  ANY = 'any',
}

export enum StudingClassType {
  TENTH = '10th',
  ELEVENTH = '11th',
  TWELVETH_APPEARING = '12th_Appearing',
  TWELVETH_PASS = '12th_Pass',
  GRADUATION_APPERING = 'Graduation_Appearing',
  GRADUATION_PASS = 'Graduation_Pass',
}

export enum EducationBoardType {
  STATE_BOARD = 'State_Board',
  ICSE = 'ICSE',
  CBSE = 'CBSE',
  ISC = 'ISC',
}

export enum CarrerAmbitionType {
  ENGINEER = 'Engineer',
  DOCTOR = 'Doctor',
  DEFENCE_OFFICER = 'Defence_Officer',
}

export enum StudentTypeForEventApply {
  STUDENT = 'student',
  PRE_BOOK = 'pre book',
}

export enum SchemaReferenceType {
  USER = 'User',
  STAFF = 'Staff',
  HEALTH_CARE_USER = 'HealthcareUser',
  HOSTEL_USER = 'HostelEnquiry',
  OFFLINE_ATTENDANCE = 'StudentAttendance',
  ONLINE_ATTENDANCE = 'AttendanceReport',
}

export enum CompareValueRangeType {
  H = 'H',
  L = 'L',
  NORMAL = 'normal',
}

export enum NotificationTypes {
  SMS = 'sms',
  PUSH_NOTIFICATION = 'push_notification',
  EMAIL = 'email',
  VOICE = 'voice',
  WHATSAPPS = 'whatsApp',
}

export enum NotificationSendType {
  USER = 'user',
  PARENT = 'parent',
  ANONYMOUS = 'anonymous',
  STAFF = 'staff',
}

export enum LabReportTestInputType {
  NUMERIC = 'Numeric',
  SINGLE_LINE = 'Single Line',
  PARAGRAPH = 'Paragraph',
  DOCUMENT = 'Document',
}

export enum HdfcPaymentStatus {
  CHARGED = 'CHARGED',
}

export enum TestAttemptFromTypes {
  MOBILE = 'mobile',
  WEB = 'web',
}

export enum HostelPaymentType {
  MONTH_WISE = 'monthly',
  DAY_WISE = 'daily',
  SUCURITY_REFUND = 'security_refund',
}

export enum MiscellaneousCostHostelType {
  AC = 'ac',
  COOLER = 'cooler',
  OTHER = 'other',
}

export enum DropStudentTypes {
  INTERESTED = 'interested',
  NOT_INTERESTED = 'not interested',
}

export enum ChangeHostelType {
  JOINING_DATE = 'joining date',
  ROOM_NUMBER = 'room number',
  BED_TYPE = 'bed type',
  HOSTEL = 'hostel',
}

export enum HostelTransactionStatus {
  AUTO_FULL_PAYMENT = 'auto full payment',
  MANUAL_FULL_PAYMENT = 'manual full payment',
  AUTO_INSTALLMENT = 'auto installment',
  MANUAL_INSTALLMENT = 'manual installment',
  INSTALLMENT_COMPLETE = 'installment complete',
  INSTALLMENT_TERMINATED = 'installment terminated',
  BED_TYPE_CHANGE = 'bed type change',
  SECURITY_REFUND = 'security refund',
}

export enum BankDetailsType {
  HDFC_BANK = 'hdfc bank',
  ICICI_BANK = 'icici bank',
}

export enum LiveAttendanceType {
  ALL = 'all',
  NOT_MARKED = 'not marked',
  PRESENT = 'present',
  ABSENT = 'absent',
  RUSTICATED = 'rusticated',
  SUSPENDED = 'suspended',
  ABSENT_RUSTICATED = 'absent rusticated',
  ABSENT_SUSPENDED = 'absent suspended',
  FINE_ACTIVE = 'fine(active)',
  LEAVE = 'leave',
  HOLIDAY = 'holiday',
  SUNDAY = 'sunday',
}

export enum BatchDurationType {
  DAYS = 'days',
  DATE = 'date',
}

export enum InventoryItemType {
  GOODS = 'goods',
  SERVICE = 'service',
}
