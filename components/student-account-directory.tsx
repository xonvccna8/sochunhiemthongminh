'use client';

import { useMemo, useState } from 'react';
import { ArrowRight, Search, ShieldCheck } from 'lucide-react';
import { CLASS_ROSTER, normalizeVietnameseName, studentAccountEmail, studentAccountPassword } from '@/lib/class-roster';

export default function StudentAccountDirectory({
  onUseAccount,
}: {
  onUseAccount: (email: string, password: string) => void;
}) {
  const [search, setSearch] = useState('');
  const students = useMemo(() => {
    const term = normalizeVietnameseName(search);
    return !term ? CLASS_ROSTER : CLASS_ROSTER.filter((student) => (
      normalizeVietnameseName(student.fullName).includes(term)
    ));
  }, [search]);

  return (
    <div className="student-account-directory simple">
      <div className="account-directory-note">
        <ShieldCheck size={21} />
        <span>
          <b>Chọn đúng họ và tên của học sinh</b>
          <small>Bấm vào tên để tự động điền email và mật khẩu đăng nhập.</small>
        </span>
      </div>

      <label className="account-student-search">
        <span>Danh sách học sinh lớp 10C3</span>
        <div>
          <Search size={20} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm theo họ và tên..."
            aria-label="Tìm học sinh theo họ và tên"
          />
        </div>
      </label>

      <div className="account-student-list simple" role="listbox" aria-label="Danh sách học sinh">
        {students.map((student) => (
          <button
            type="button"
            role="option"
            aria-selected="false"
            key={student.no}
            onClick={() => onUseAccount(
              studentAccountEmail(student),
              studentAccountPassword(student),
            )}
          >
            <b>{student.fullName}</b>
            <ArrowRight size={21} aria-hidden="true" />
          </button>
        ))}
        {!students.length && <p>Không tìm thấy học sinh phù hợp.</p>}
      </div>

      <p className="credential-security-hint">
        <ShieldCheck size={16} /> Tài khoản chỉ được dùng bởi đúng học sinh có tên trong danh sách.
      </p>
    </div>
  );
}
