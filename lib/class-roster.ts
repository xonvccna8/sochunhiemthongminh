export type ClassStudent = {
  no: number;
  fullName: string;
  gender: 'Nam' | 'Nữ';
  birthDate: string;
  birthDateISO: string;
  ethnic: 'Thái' | 'Kinh' | 'Mông';
  formerSchool: string;
  className: '10C3';
};

const student = (
  no: number,
  fullName: string,
  gender: ClassStudent['gender'],
  birthDate: string,
  ethnic: ClassStudent['ethnic'],
  formerSchool: string,
): ClassStudent => {
  const [day, month, year] = birthDate.split('/');
  return { no, fullName, gender, birthDate, birthDateISO: `${year}-${month}-${day}`, ethnic, formerSchool, className: '10C3' };
};

export const CLASS_ROSTER: ClassStudent[] = [
  student(1, 'Vi Thị Ngọc Hiền', 'Nữ', '22/03/2011', 'Thái', 'Trường PTDTBT THCS Châu Cam'),
  student(2, 'Vi Thị Khánh Ly', 'Nữ', '08/01/2011', 'Thái', 'PTDT Bán trú THCS Thạch Ngàn'),
  student(3, 'Vi Đức Hoàng', 'Nam', '22/07/2011', 'Thái', 'PTDT Bán trú THCS Thạch Ngàn'),
  student(4, 'Vi Thị Yến Chi', 'Nữ', '04/05/2011', 'Thái', 'THCS Trà Lân'),
  student(5, 'Vi Khánh My', 'Nữ', '01/01/2011', 'Thái', 'PTDT Bán trú THCS Thạch Ngàn'),
  student(6, 'Ngân Tuấn Hậu', 'Nam', '22/08/2011', 'Thái', 'THCS Lạng Khê'),
  student(7, 'Hoàng Thị Kim Quý', 'Nữ', '05/11/2008', 'Kinh', 'Trường PTDTBT THCS Châu Cam'),
  student(8, 'Nguyễn Trần Bảo Đăng', 'Nam', '20/08/2011', 'Kinh', 'THCS Trà Lân'),
  student(9, 'Trần Quỳnh Trúc', 'Nữ', '30/11/2011', 'Thái', 'Trường THCS Chi Khê'),
  student(10, 'Hà Thị Mỹ Duyên', 'Nữ', '02/02/2011', 'Thái', 'Trường THCS Mậu Đôn'),
  student(11, 'Vi Tuấn Kiệt', 'Nam', '02/10/2011', 'Thái', 'PTDT Bán trú THCS Thạch Ngàn'),
  student(12, 'Vi Tiến Trọng', 'Nam', '13/09/2011', 'Thái', 'Trường THCS Yên Khê'),
  student(13, 'Kha Quang Đạt', 'Nam', '07/11/2011', 'Thái', 'Trường PTDTBT THCS Châu Cam'),
  student(14, 'Lương Thế Ngọc', 'Nam', '08/08/2011', 'Thái', 'THCS Bình Chuẩn'),
  student(15, 'Trương Văn Danh', 'Nam', '04/11/2011', 'Kinh', 'THCS Trà Lân'),
  student(16, 'Vi Thị Phương Nam', 'Nữ', '01/09/2011', 'Thái', 'Trường THCS Yên Khê'),
  student(17, 'Lô Thị Vân Anh', 'Nữ', '02/09/2011', 'Thái', 'Trường THCS Yên Khê'),
  student(18, 'Hà Gia Khiêm', 'Nam', '01/06/2011', 'Thái', 'Trường THCS Chi Khê'),
  student(19, 'Nguyễn Đình Phong', 'Nam', '19/01/2011', 'Kinh', 'THCS Lâm Thành'),
  student(20, 'Vi Thị Ngân Tâm', 'Nữ', '02/02/2011', 'Thái', 'Trường THCS Mậu Đôn'),
  student(21, 'Lương Thị Khánh Ly', 'Nữ', '22/06/2011', 'Thái', 'Trường PTDTBT THCS Châu Cam'),
  student(22, 'Trần Thị Thùy An', 'Nữ', '10/10/2011', 'Kinh', 'THCS Trà Lân'),
  student(23, 'Hà Nguyễn Thiên Bảo', 'Nam', '21/04/2011', 'Thái', 'PTDT Bán trú THCS Thạch Ngàn'),
  student(24, 'Vi Thị Thùy Vinh', 'Nữ', '11/08/2011', 'Thái', 'THCS Bình Chuẩn'),
  student(25, 'Kha Bảo Khang', 'Nam', '07/01/2011', 'Thái', 'THCS Bình Chuẩn'),
  student(26, 'Vy Bảo Nguyên', 'Nam', '20/12/2011', 'Thái', 'Trường PTDTBT THCS Châu Cam'),
  student(27, 'Lương Nam Dương', 'Nam', '17/08/2011', 'Thái', 'Trường THCS Mậu Đôn'),
  student(28, 'Lưu Quang Vinh', 'Nam', '27/09/2011', 'Kinh', 'THCS Trà Lân'),
  student(29, 'Vi Thu Thúy', 'Nữ', '25/06/2011', 'Thái', 'PTDT Bán trú THCS Thạch Ngàn'),
  student(30, 'Lương Quang Huân', 'Nam', '26/03/2011', 'Thái', 'PTDT Bán trú THCS Thạch Ngàn'),
  student(31, 'Lương Nhật Minh Huy', 'Nam', '15/12/2011', 'Thái', 'THCS Lục Dạ'),
  student(32, 'Lô Thị Thùy Trang', 'Nữ', '23/04/2011', 'Thái', 'Trường THCS Chi Khê'),
  student(33, 'Lương Thị Thảo Ly', 'Nữ', '11/08/2011', 'Thái', 'Trường THCS Mậu Đôn'),
  student(34, 'Đặng Quang Đạt', 'Nam', '14/03/2011', 'Kinh', 'THCS Thọ Lộc'),
  student(35, 'Lô Thị Ngọc Lan', 'Nữ', '22/10/2011', 'Thái', 'Trường PTDTBT THCS Châu Cam'),
  student(36, 'Lô Thị Trang', 'Nữ', '26/12/2011', 'Thái', 'Trường THCS Yên Khê'),
  student(37, 'Vi Tâm Đoan', 'Nữ', '06/08/2011', 'Thái', 'Trường THCS Mậu Đôn'),
  student(38, 'Lô Minh Quân', 'Nam', '29/11/2011', 'Thái', 'Trường THCS Chi Khê'),
  student(39, 'Vy Thị Khánh Hạ', 'Nữ', '23/11/2011', 'Thái', 'Trường PTDTBT THCS Châu Cam'),
  student(40, 'Vi Thị Khánh Băng', 'Nữ', '02/06/2011', 'Thái', 'Trường PTDTBT THCS Châu Cam'),
  student(41, 'Văn Thị Hoài Thương', 'Nữ', '05/07/2011', 'Thái', 'Trường THCS Mậu Đôn'),
  student(42, 'Đoàn Nam Phong', 'Nam', '21/10/2011', 'Kinh', 'THCS Trà Lân'),
  student(43, 'Lô Minh Đức', 'Nam', '29/10/2011', 'Thái', 'THCS Trà Lân'),
  student(44, 'Trần Khánh Thiện', 'Nam', '16/05/2010', 'Thái', 'PTDT Bán trú THCS Thạch Ngàn'),
  student(45, 'Vi Thị Bảo An', 'Nữ', '03/01/2011', 'Thái', 'PTDTNT THCS Con Cuông'),
  student(46, 'Quang Thị Ngọc Hằng', 'Nữ', '03/01/2011', 'Thái', 'PTDTNT THCS Con Cuông'),
  student(47, 'Chương Tú Quyên', 'Nữ', '19/11/2011', 'Thái', 'PTDTNT THCS Con Cuông'),
  student(48, 'Hà Lương Bảo Châu', 'Nữ', '15/05/2011', 'Thái', 'PTDTNT THCS Con Cuông'),
  student(49, 'Mùa Vĩ Đại', 'Nam', '31/01/2011', 'Mông', 'PTDTNT THCS Con Cuông'),
  student(50, 'Vi Đình Bảo Trân', 'Nữ', '07/07/2011', 'Thái', 'PTDTNT THCS Con Cuông'),
];

export const FORMER_SCHOOLS = Array.from(new Set(CLASS_ROSTER.map((item) => item.formerSchool))).sort((a, b) => a.localeCompare(b, 'vi'));

export function normalizeVietnameseName(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}
