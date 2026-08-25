'use client';

import { FormEvent, useState } from 'react';
import {
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { ArrowRight, Eye, EyeOff, GraduationCap, LockKeyhole, Mail, ShieldCheck, UserRound } from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { FIXED_TEACHER_EMAIL } from '@/lib/types';
import { Notice } from './ui';
import StudentAccountDirectory from './student-account-directory';

function readableAuthError(error: unknown) {
  const code = (error as { code?: string })?.code || '';
  if (code.includes('invalid-credential')) return 'Email hoặc mật khẩu chưa đúng.';
  if (code.includes('weak-password')) return 'Mật khẩu cần có ít nhất 6 ký tự.';
  if (code.includes('invalid-email')) return 'Địa chỉ email chưa đúng định dạng.';
  if (code.includes('too-many-requests')) return 'Bạn thao tác quá nhiều lần. Vui lòng thử lại sau.';
  if (code.includes('operation-not-allowed')) return 'Đăng nhập email chưa được bật trong Firebase Authentication.';
  if ((error as Error)?.message === 'role-mismatch') return 'Tài khoản không đúng loại đã chọn. Hãy chọn đúng Học sinh hoặc Giáo viên.';
  return 'Không thể kết nối tài khoản. Vui lòng kiểm tra Firebase và thử lại.';
}

export default function AuthScreen({ onBack, systemError = '' }: { onBack: () => void; systemError?: string }) {
  const [mode, setMode] = useState<'login' | 'accounts'>('login');
  const [accountType, setAccountType] = useState<'student' | 'teacher'>('student');
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const visibleMessage = message ?? (systemError ? { type: 'error' as const, text: systemError } : null);

  const updateEmail = (value: string) => {
    setEmail(value);
    if (mode === 'login' && value.trim().toLowerCase() === FIXED_TEACHER_EMAIL) {
      setAccountType('teacher');
      setMessage(null);
    }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setMessage(null);
    setBusy(true);
    try {
      const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const userSnapshot = await getDoc(doc(db, 'users', credential.user.uid));
      const isApprovedTeacher = credential.user.email?.trim().toLowerCase() === FIXED_TEACHER_EMAIL;
      const actualRole = isApprovedTeacher ? 'teacher' : userSnapshot.exists() ? userSnapshot.data().role : 'student';
      if (actualRole !== accountType) {
        await signOut(auth);
        throw new Error('role-mismatch');
      }
      if (!remember) localStorage.removeItem('remember-account');
      else localStorage.setItem('remember-account', email.trim());
    } catch (error) {
      setMessage({ type: 'error', text: readableAuthError(error) });
    } finally {
      setBusy(false);
    }
  };

  const resetPassword = async () => {
    if (accountType === 'student') {
      setMessage({ type: 'success', text: 'Mật khẩu ban đầu là ngày tháng năm sinh gồm 8 số. Nếu cần hỗ trợ, hãy liên hệ giáo viên chủ nhiệm.' });
      return;
    }
    if (!email.trim()) {
      setMessage({ type: 'error', text: 'Nhập email trước khi yêu cầu đặt lại mật khẩu.' });
      return;
    }
    setBusy(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setMessage({ type: 'success', text: 'Đã gửi liên kết đặt lại mật khẩu đến email của bạn.' });
    } catch (error) {
      setMessage({ type: 'error', text: readableAuthError(error) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="auth-shell">
      <button className="auth-back" onClick={onBack}>← Về trang chủ</button>
      <section className="auth-showcase">
        <div className="auth-showcase-inner">
          <div className="auth-symbol"><GraduationCap size={34} /></div>
          <p className="eyebrow light">Sổ chủ nhiệm số</p>
          <h1>Mỗi hồ sơ đầy đủ,<br />mỗi kết nối an tâm.</h1>
          <p className="auth-lead">Nền tảng quản lý thông tin lớp 10C3 dành cho giáo viên, học sinh và phụ huynh.</p>
          <div className="auth-benefits">
            <div><ShieldCheck size={20} /><span><b>Dữ liệu được bảo vệ</b><small>Phân quyền theo đúng tài khoản</small></span></div>
            <div><UserRound size={20} /><span><b>Thông tin tập trung</b><small>Cập nhật một lần, sử dụng xuyên suốt</small></span></div>
            <div><LockKeyhole size={20} /><span><b>Chia sẻ có kiểm soát</b><small>Liên kết riêng cho học sinh và phụ huynh</small></span></div>
          </div>
        </div>
        <div className="auth-school-year">10C3 <span>·</span> Năm học 2026 – 2027</div>
      </section>

      <section className="auth-panel">
        <div className="auth-form-wrap">
          <div className="auth-mini-logo"><span>S</span><b>Sổ Chủ Nhiệm</b></div>
          <div className="auth-heading">
            <h2>{mode === 'login' ? `Đăng nhập ${accountType === 'teacher' ? 'giáo viên' : 'học sinh'}` : 'Tài khoản học sinh'}</h2>
            <p>{mode === 'login' ? `Sử dụng tài khoản ${accountType === 'teacher' ? 'giáo viên do nhà trường cấp' : 'đã được giáo viên chủ nhiệm cấp'} để tiếp tục.` : 'Chọn đúng họ tên để xem và sao chép thông tin đăng nhập.'}</p>
          </div>
          <div className="auth-tabs" role="tablist">
            <button className={mode === 'login' ? 'active' : ''} onClick={() => { setMode('login'); setMessage(null); }}>Đăng nhập</button>
            <button className={mode === 'accounts' ? 'active' : ''} onClick={() => { setMode('accounts'); setMessage(null); }}>Tài khoản học sinh</button>
          </div>
          {mode === 'login' ? <>
            <div className="account-type-picker" role="group" aria-label="Chọn loại tài khoản">
              <button type="button" className={accountType === 'student' ? 'active student' : 'student'} onClick={() => { setAccountType('student'); setMessage(null); }}><UserRound size={21} /><span><b>Học sinh</b><small>Do GVCN cấp</small></span></button>
              <button type="button" className={accountType === 'teacher' ? 'active teacher' : 'teacher'} onClick={() => { setAccountType('teacher'); setMessage(null); }}><GraduationCap size={21} /><span><b>Giáo viên</b><small>Do nhà trường cấp</small></span></button>
            </div>
            <form onSubmit={submit} className="auth-form">
              <label>
                <span>Email</span>
                <div className="auth-input"><Mail size={18} /><input type="email" value={email} onChange={(e) => updateEmail(e.target.value)} placeholder={accountType === 'teacher' ? 'giaovien@truong.edu.vn' : 'hovaten@gmail.com'} autoComplete="email" required /></div>
              </label>
              <label>
                <span>Mật khẩu</span>
                <div className="auth-input"><LockKeyhole size={18} /><input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder={accountType === 'teacher' ? 'Mật khẩu giáo viên' : 'Ngày tháng năm sinh'} minLength={6} autoComplete="current-password" required /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label="Hiện hoặc ẩn mật khẩu">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>
              </label>
              <div className={`selected-role-note ${accountType}`}><ShieldCheck size={16} /><span>Hệ thống sẽ kiểm tra quyền {accountType === 'teacher' ? 'giáo viên và lớp được phân công' : 'học sinh'} từ Firebase.</span></div>
              <div className="auth-options"><label className="check"><input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} /><span>Ghi nhớ tôi</span></label><button type="button" onClick={resetPassword}>{accountType === 'teacher' ? 'Quên mật khẩu?' : 'Cần hỗ trợ?'}</button></div>
              {visibleMessage && <Notice type={visibleMessage.type}>{visibleMessage.text}</Notice>}
              <button className={`auth-submit ${accountType}`} type="submit" disabled={busy}>{busy ? 'Đang xử lý...' : `Đăng nhập ${accountType === 'teacher' ? 'giáo viên' : 'học sinh'}`} <ArrowRight size={18} /></button>
            </form>
          </> : <StudentAccountDirectory onUseAccount={(accountEmail, accountPassword) => { setEmail(accountEmail); setPassword(accountPassword); setAccountType('student'); setMode('login'); setMessage({ type: 'success', text: 'Đã điền tài khoản học sinh. Bấm Đăng nhập để tiếp tục.' }); }} />}
          <p className="auth-privacy">Bằng việc tiếp tục, bạn đồng ý sử dụng thông tin đúng mục đích quản lý giáo dục của lớp.</p>
        </div>
      </section>
    </main>
  );
}
