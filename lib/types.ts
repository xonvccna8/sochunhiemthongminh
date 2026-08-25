export type Role = 'student' | 'teacher';

export type UserRecord = {
  uid: string;
  email: string;
  displayName: string;
  role: Role;
};

export type StudentProfile = {
  ownerId: string;
  email: string;
  fullName: string;
  birthDate: string;
  gender: string;
  ethnic: string;
  birthPlace: string;
  householdRegistration: string;
  currentAddress: string;
  className: string;
  schoolYear: string;
  youthUnion: string;
  youngPioneers: string;
  studentCategory: string;
  martyrChild: string;
  woundedSoldierChild: string;
  nearPoorHousehold: string;
  poorHousehold: string;
  poorHouseholdNumber: string;
  fatherName: string;
  fatherOccupation: string;
  fatherPhone: string;
  fatherZalo: string;
  motherName: string;
  motherOccupation: string;
  motherPhone: string;
  motherZalo: string;
  reward: string;
  discipline: string;
  entryDate: string;
  entryReason: string;
  exitDate: string;
  teacherName: string;
  status: 'draft' | 'completed';
  shareToken: string;
  updatedAt?: unknown;
};

export const FIXED_CLASS = '10C3';
export const FIXED_SCHOOL_YEAR = '2026 - 2027';
export const FIXED_TEACHER = 'Nguyễn Văn Xô';

export const emptyProfile = (ownerId = '', email = '', fullName = ''): StudentProfile => ({
  ownerId,
  email,
  fullName,
  birthDate: '',
  gender: '',
  ethnic: 'Kinh',
  birthPlace: '',
  householdRegistration: '',
  currentAddress: '',
  className: FIXED_CLASS,
  schoolYear: FIXED_SCHOOL_YEAR,
  youthUnion: 'Không',
  youngPioneers: 'Không',
  studentCategory: 'Không',
  martyrChild: 'Không',
  woundedSoldierChild: 'Không',
  nearPoorHousehold: 'Không',
  poorHousehold: 'Không',
  poorHouseholdNumber: '',
  fatherName: '',
  fatherOccupation: '',
  fatherPhone: '',
  fatherZalo: '',
  motherName: '',
  motherOccupation: '',
  motherPhone: '',
  motherZalo: '',
  reward: '',
  discipline: '',
  entryDate: '',
  entryReason: '',
  exitDate: '',
  teacherName: FIXED_TEACHER,
  status: 'draft',
  shareToken: '',
});

export const requiredProfileFields: Array<keyof StudentProfile> = [
  'fullName',
  'birthDate',
  'gender',
  'ethnic',
  'birthPlace',
  'householdRegistration',
  'currentAddress',
  'fatherName',
  'fatherPhone',
  'motherName',
  'motherPhone',
];

export function profileCompletion(profile: StudentProfile) {
  const complete = requiredProfileFields.filter((field) => Boolean(String(profile[field] ?? '').trim())).length;
  return Math.round((complete / requiredProfileFields.length) * 100);
}
