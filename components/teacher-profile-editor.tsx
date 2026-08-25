'use client';

import { Home, School, ShieldCheck, UserRound, UsersRound } from 'lucide-react';
import { StudentProfile } from '@/lib/types';

export type EditableProfileField =
  | 'fullName' | 'birthDate' | 'gender' | 'ethnic' | 'formerSchool' | 'birthPlace'
  | 'householdRegistration' | 'currentAddress' | 'youthUnion' | 'youngPioneers'
  | 'studentCategory' | 'fatherName' | 'fatherOccupation' | 'fatherPhone' | 'fatherZalo'
  | 'motherName' | 'motherOccupation' | 'motherPhone' | 'motherZalo'
  | 'martyrChild' | 'woundedSoldierChild' | 'nearPoorHousehold' | 'poorHousehold'
  | 'poorHouseholdNumber' | 'reward' | 'discipline' | 'entryDate' | 'entryReason' | 'exitDate';

type FieldConfig = {
  key: EditableProfileField;
  label: string;
  type?: 'text' | 'date' | 'tel' | 'textarea' | 'select';
  options?: string[];
  wide?: boolean;
};

const yesNo = ['Không', 'Có'];

const groups: Array<{ title: string; icon: typeof UserRound; fields: FieldConfig[] }> = [
  {
    title: 'Thông tin học sinh',
    icon: UserRound,
    fields: [
      { key: 'fullName', label: 'Họ và tên' },
      { key: 'birthDate', label: 'Ngày sinh', type: 'date' },
      { key: 'gender', label: 'Giới tính', type: 'select', options: ['Nữ', 'Nam'] },
      { key: 'ethnic', label: 'Dân tộc' },
      { key: 'birthPlace', label: 'Nơi sinh' },
      { key: 'formerSchool', label: 'Trường THCS đã học', wide: true },
      { key: 'youthUnion', label: 'Đoàn viên', type: 'select', options: yesNo },
      { key: 'youngPioneers', label: 'Đội viên', type: 'select', options: yesNo },
      { key: 'studentCategory', label: 'Diện học sinh', wide: true },
    ],
  },
  {
    title: 'Nơi ở và liên hệ',
    icon: Home,
    fields: [
      { key: 'householdRegistration', label: 'Hộ khẩu thường trú', type: 'textarea', wide: true },
      { key: 'currentAddress', label: 'Địa chỉ liên lạc hiện tại', type: 'textarea', wide: true },
    ],
  },
  {
    title: 'Thông tin gia đình',
    icon: UsersRound,
    fields: [
      { key: 'fatherName', label: 'Họ tên cha' },
      { key: 'fatherOccupation', label: 'Nghề nghiệp cha' },
      { key: 'fatherPhone', label: 'Số điện thoại cha', type: 'tel' },
      { key: 'fatherZalo', label: 'Zalo cha', type: 'tel' },
      { key: 'motherName', label: 'Họ tên mẹ' },
      { key: 'motherOccupation', label: 'Nghề nghiệp mẹ' },
      { key: 'motherPhone', label: 'Số điện thoại mẹ', type: 'tel' },
      { key: 'motherZalo', label: 'Zalo mẹ', type: 'tel' },
    ],
  },
  {
    title: 'Diện chính sách',
    icon: ShieldCheck,
    fields: [
      { key: 'martyrChild', label: 'Con liệt sĩ', type: 'select', options: yesNo },
      { key: 'woundedSoldierChild', label: 'Con thương binh, bệnh binh', type: 'select', options: yesNo },
      { key: 'nearPoorHousehold', label: 'Hộ cận nghèo', type: 'select', options: yesNo },
      { key: 'poorHousehold', label: 'Hộ nghèo', type: 'select', options: yesNo },
      { key: 'poorHouseholdNumber', label: 'Số hộ nghèo', wide: true },
    ],
  },
  {
    title: 'Quá trình học tập',
    icon: School,
    fields: [
      { key: 'entryDate', label: 'Ngày nhập trường', type: 'date' },
      { key: 'exitDate', label: 'Ngày ra trường', type: 'date' },
      { key: 'entryReason', label: 'Lý do nhập trường', wide: true },
      { key: 'reward', label: 'Khen thưởng', type: 'textarea', wide: true },
      { key: 'discipline', label: 'Kỷ luật', type: 'textarea', wide: true },
    ],
  },
];

export default function TeacherProfileEditor({
  profile,
  onChange,
}: {
  profile: StudentProfile;
  onChange: (field: EditableProfileField, value: string) => void;
}) {
  return (
    <div className="teacher-profile-editor">
      <div className="teacher-edit-assignment">
        <ShieldCheck size={20} />
        <div><span>Hồ sơ thuộc phạm vi quản lý</span><b>Lớp {profile.className} · Năm học {profile.schoolYear}</b></div>
        <em>STT {profile.rosterNumber || '—'}</em>
      </div>

      {groups.map(({ title, icon: Icon, fields }) => (
        <section className="teacher-edit-section" key={title}>
          <h3><Icon size={19} /> {title}</h3>
          <div className="teacher-edit-grid">
            {fields.map((field) => (
              <label className={field.wide ? 'wide' : ''} key={field.key}>
                <span>{field.label}</span>
                {field.type === 'textarea' ? (
                  <textarea value={String(profile[field.key] || '')} onChange={(event) => onChange(field.key, event.target.value)} rows={2} />
                ) : field.type === 'select' ? (
                  <select value={String(profile[field.key] || '')} onChange={(event) => onChange(field.key, event.target.value)}>
                    {field.options?.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                ) : (
                  <input type={field.type || 'text'} value={String(profile[field.key] || '')} onChange={(event) => onChange(field.key, event.target.value)} />
                )}
              </label>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
