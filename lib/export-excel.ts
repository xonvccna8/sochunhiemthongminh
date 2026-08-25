import * as XLSX from 'xlsx';
import { StudentProfile } from './types';

const border = {
  top: { style: 'thin', color: { rgb: '000000' } },
  bottom: { style: 'thin', color: { rgb: '000000' } },
  left: { style: 'thin', color: { rgb: '000000' } },
  right: { style: 'thin', color: { rgb: '000000' } },
};

function safeSheetName(name: string, index: number) {
  const clean = (name || `Hoc sinh ${index + 1}`).replace(/[\\/?*\[\]:]/g, ' ').trim();
  return (clean || `Hoc sinh ${index + 1}`).slice(0, 31);
}

function buildProfileSheet(profile: StudentProfile) {
  const yesNo = (value: string) => value || 'Không';
  const rows: (string | number)[][] = [
    ['Họ và tên:', profile.fullName, '', '', '', '', '', ''],
    ['Ngày sinh:', profile.birthDate, '', 'Giới tính:', profile.gender, 'Dân tộc:', profile.ethnic, ''],
    ['Nơi sinh:', profile.birthPlace, '', '', '', '', '', ''],
    ['Hộ khẩu thường trú:', profile.householdRegistration, '', '', '', '', '', ''],
    ['Địa chỉ liên lạc:', profile.currentAddress, '', '', '', '', '', ''],
    ['Học sinh lớp:', profile.className, '', 'Năm học:', profile.schoolYear, '', '', ''],
    ['Đoàn viên:', yesNo(profile.youthUnion), '', '', '', '', '', ''],
    ['Đội viên:', yesNo(profile.youngPioneers), '', '', '', '', '', ''],
    ['Học sinh diện:', yesNo(profile.studentCategory), '', '', '', '', '', ''],
    ['Con liệt sỹ:', yesNo(profile.martyrChild), '', '', '', '', '', ''],
    ['Con thương binh, BB (Ghi rõ TB hay BB, hạng và tỷ lệ thương tật):', profile.woundedSoldierChild, '', '', '', '', '', ''],
    ['Con hộ cận nghèo:', yesNo(profile.nearPoorHousehold), '', '', '', '', '', ''],
    ['Con hộ nghèo:', yesNo(profile.poorHousehold), '', 'Sổ hộ nghèo:', profile.poorHouseholdNumber, '', '', ''],
    ['Họ tên cha:', profile.fatherName, '', '', '', '', '', ''],
    ['Nghề nghiệp cha:', profile.fatherOccupation, '', '', '', '', '', ''],
    ['Số điện thoại:', profile.fatherPhone, '', '', '', '', '', ''],
    ['Số Zalo:', profile.fatherZalo, '', '', '', '', '', ''],
    ['Họ tên mẹ:', profile.motherName, '', '', '', '', '', ''],
    ['Nghề nghiệp mẹ:', profile.motherOccupation, '', '', '', '', '', ''],
    ['Số điện thoại:', profile.motherPhone, '', '', '', '', '', ''],
    ['Số Zalo:', profile.motherZalo, '', '', '', '', '', ''],
    ['Khen thưởng:', profile.reward, '', '', '', '', '', ''],
    ['Kỷ luật:', profile.discipline, '', '', '', '', '', ''],
    ['Ngày nhập trường:', profile.entryDate, '', '', '', '', '', ''],
    ['Lý do nhập trường:', profile.entryReason, '', 'Ngày ra trường:', profile.exitDate, '', '', ''],
    ['Giáo viên chủ nhiệm:', profile.teacherName, '', '', '', '', '', ''],
  ];

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [
    { wch: 23 }, { wch: 23 }, { wch: 5 }, { wch: 14 },
    { wch: 11 }, { wch: 11 }, { wch: 12 }, { wch: 10 },
  ];
  ws['!rows'] = rows.map((_, index) => ({ hpt: index === 10 ? 30 : 21 }));
  ws['!merges'] = [
    { s: { r: 0, c: 1 }, e: { r: 0, c: 7 } },
    ...[2, 3, 4, 6, 7, 8, 9, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23].map((r) => ({ s: { r, c: 1 }, e: { r, c: 7 } })),
    { s: { r: 1, c: 1 }, e: { r: 1, c: 2 } },
    { s: { r: 1, c: 6 }, e: { r: 1, c: 7 } },
    { s: { r: 5, c: 1 }, e: { r: 5, c: 2 } },
    { s: { r: 5, c: 4 }, e: { r: 5, c: 7 } },
    { s: { r: 10, c: 0 }, e: { r: 10, c: 5 } },
    { s: { r: 10, c: 6 }, e: { r: 10, c: 7 } },
    { s: { r: 12, c: 1 }, e: { r: 12, c: 2 } },
    { s: { r: 12, c: 4 }, e: { r: 12, c: 7 } },
    { s: { r: 24, c: 1 }, e: { r: 24, c: 2 } },
    { s: { r: 24, c: 4 }, e: { r: 24, c: 7 } },
    { s: { r: 25, c: 1 }, e: { r: 25, c: 3 } },
    { s: { r: 25, c: 4 }, e: { r: 25, c: 7 } },
  ];

  for (let r = 0; r < rows.length; r += 1) {
    for (let c = 0; c < 8; c += 1) {
      const address = XLSX.utils.encode_cell({ r, c });
      if (!ws[address]) ws[address] = { t: 's', v: '' };
      ws[address].s = {
        border,
        font: { name: 'Times New Roman', sz: 12, bold: c === 1 && [0, 5, 25].includes(r) },
        alignment: { vertical: 'center', wrapText: true },
      };
    }
  }

  ws['!pageSetup'] = { orientation: 'portrait', paperSize: 9, fitToWidth: 1, fitToHeight: 1 };
  ws['!margins'] = { left: 0.25, right: 0.25, top: 0.35, bottom: 0.35, header: 0.1, footer: 0.1 };
  ws['!printArea'] = 'A1:H26';
  return ws;
}

export function exportProfilesToExcel(profiles: StudentProfile[]) {
  if (!profiles.length) return;
  const workbook = XLSX.utils.book_new();
  profiles.forEach((profile, index) => {
    XLSX.utils.book_append_sheet(workbook, buildProfileSheet(profile), safeSheetName(profile.fullName, index));
  });
  const suffix = profiles.length === 1 ? profiles[0].fullName.replace(/\s+/g, '-') : `Lop-${profiles[0].className}`;
  XLSX.writeFile(workbook, `Ho-so-${suffix || 'hoc-sinh'}.xlsx`, { cellStyles: true });
}
