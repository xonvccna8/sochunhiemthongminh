'use client';

import { useMemo, useState } from 'react';
import { Check, Clipboard, KeyRound, Mail, Search, ShieldCheck, UserRound } from 'lucide-react';
import { CLASS_ROSTER, normalizeVietnameseName, studentAccountEmail, studentAccountPassword } from '@/lib/class-roster';

export default function StudentAccountDirectory({
  onUseAccount,
}: {
  onUseAccount: (email: string, password: string) => void;
}) {
  const [selectedNumber, setSelectedNumber] = useState('1');
  const [search, setSearch] = useState('');
  const [copied, setCopied] = useState<'email' | 'password' | 'both' | null>(null);
  const students = useMemo(() => {
    const term = normalizeVietnameseName(search);
    return !term ? CLASS_ROSTER : CLASS_ROSTER.filter((student) => (
      normalizeVietnameseName(`${student.no} ${student.fullName}`).includes(term)
    ));
  }, [search]);
  const selected = CLASS_ROSTER.find((student) => String(student.no) === selectedNumber) || students[0] || CLASS_ROSTER[0];
  const email = studentAccountEmail(selected);
  const password = studentAccountPassword(selected);

  const copy = async (value: string, field: 'email' | 'password' | 'both') => {
    await navigator.clipboard.writeText(value);
    setCopied(field);
    window.setTimeout(() => setCopied(null), 1800);
  };

  return (
    <div className="student-account-directory">
      <div className="account-directory-note"><ShieldCheck size={19} /><span><b>Tài khoản do giáo viên chủ nhiệm cấp</b><small>Học sinh chỉ cần dùng đúng email và mật khẩu bên dưới để đăng nhập.</small></span></div>

      <label className="account-student-search">
        <span>Chọn học sinh lớp 10C3</span>
        <div><Search size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm theo STT hoặc họ tên..." /></div>
      </label>

      <div className="account-student-list" role="listbox" aria-label="Danh sách học sinh">
        {students.map((student) => <button type="button" role="option" aria-selected={selected.no === student.no} className={selected.no === student.no ? 'active' : ''} key={student.no} onClick={() => { setSelectedNumber(String(student.no)); setCopied(null); }}><span>{String(student.no).padStart(2, '0')}</span><b>{student.fullName}</b><small>{student.birthDate}</small>{selected.no === student.no && <Check size={16} />}</button>)}
        {!students.length && <p>Không tìm thấy học sinh phù hợp.</p>}
      </div>

      <section className="student-credential-card">
        <header><span>{selected.fullName.charAt(0)}</span><div><small>TÀI KHOẢN HỌC SINH · STT {String(selected.no).padStart(2, '0')}</small><h3>{selected.fullName}</h3><p>Lớp 10C3 · Ngày sinh {selected.birthDate}</p></div></header>
        <div className="credential-row"><span><Mail size={18} /></span><div><small>Email đăng nhập</small><b>{email}</b></div><button type="button" onClick={() => copy(email, 'email')} aria-label="Sao chép email">{copied === 'email' ? <Check size={18} /> : <Clipboard size={18} />}</button></div>
        <div className="credential-row"><span className="password"><KeyRound size={18} /></span><div><small>Mật khẩu</small><b>{password}</b></div><button type="button" onClick={() => copy(password, 'password')} aria-label="Sao chép mật khẩu">{copied === 'password' ? <Check size={18} /> : <Clipboard size={18} />}</button></div>
        <div className="credential-actions"><button type="button" onClick={() => copy(`Họ và tên: ${selected.fullName}\nEmail: ${email}\nMật khẩu: ${password}`, 'both')}><Clipboard size={17} /> {copied === 'both' ? 'Đã sao chép' : 'Sao chép để gửi'}</button><button type="button" className="primary" onClick={() => onUseAccount(email, password)}><UserRound size={17} /> Dùng tài khoản này</button></div>
      </section>

      <p className="credential-security-hint"><ShieldCheck size={15} /> Chỉ gửi thông tin này cho đúng học sinh tương ứng và không đăng công khai trong nhóm chung.</p>
    </div>
  );
}
