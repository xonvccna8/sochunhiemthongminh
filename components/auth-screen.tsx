'use client';

import { FormEvent, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { ArrowRight, Eye, EyeOff, GraduationCap, LockKeyhole, Mail, ShieldCheck, UserRound } from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { Notice } from './ui';

function readableAuthError(error: unknown) {
  const code = (error as { code?: string })?.code || '';
  if (code.includes('invalid-credential')) return 'Email hoặc mật khẩu chưa đúng.';
  if (code.includes('email-already-in-use')) return 'Email này đã được đăng ký.';
  if (code.includes('weak-password')) return 'Mật khẩu cần có ít nhất 6 ký tự.';
  if (code.includes('invalid-email')) return 'Địa chỉ email chưa đúng định dạng.';
  if (code.includes('too-many-requests')) return 'Bạn thao tác quá nhiều lần. Vui lòng thử lại sau.';
  if (code.includes('operation-not-allowed')) return 'Đăng nhập email chưa được bật trong Firebase Authentication.';
  return 'Không thể kết nối tài khoản. Vui lòng kiểm tra Firebase và thử lại.';
}

export default function AuthScreen({ onBack }: { onBack: () => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setMessage(null);
    setBusy(true);
    try {
      if (mode === 'register') {
        if (displayName.trim().length < 2) throw new Error('name');
        const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        await updateProfile(credential.user, { displayName: displayName.trim() });
        await setDoc(doc(db, 'users', credential.user.uid), {
          uid: credential.user.uid,
          email: email.trim().toLowerCase(),
          displayName: displayName.trim(),
          role: 'student',
          createdAt: serverTimestamp(),
        });
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }
      if (!remember) localStorage.removeItem('remember-account');
      else localStorage.setItem('remember-account', email.trim());
    } catch (error) {
      if ((error as Error)?.message === 'name') setMessage({ type: 'error', text: 'Vui lòng nhập đầy đủ họ và tên.' });
      else setMessage({ type: 'error', text: readableAuthError(error) });
    } finally {
      setBusy(false);
    }
  };

  const resetPassword = async () => {
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
            <h2>{mode === 'login' ? 'Chào mừng trở lại' : 'Tạo tài khoản học sinh'}</h2>
            <p>{mode === 'login' ? 'Đăng nhập để tiếp tục quản lý hồ sơ của bạn.' : 'Dùng email chính chủ để nhận thông báo và khôi phục tài khoản.'}</p>
          </div>
          <div className="auth-tabs" role="tablist">
            <button className={mode === 'login' ? 'active' : ''} onClick={() => { setMode('login'); setMessage(null); }}>Đăng nhập</button>
            <button className={mode === 'register' ? 'active' : ''} onClick={() => { setMode('register'); setMessage(null); }}>Đăng ký</button>
          </div>
          <form onSubmit={submit} className="auth-form">
            {mode === 'register' && (
              <label>
                <span>Họ và tên học sinh</span>
                <div className="auth-input"><UserRound size={18} /><input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Nguyễn Minh Anh" autoComplete="name" required /></div>
              </label>
            )}
            <label>
              <span>Email</span>
              <div className="auth-input"><Mail size={18} /><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="hocsinh@email.com" autoComplete="email" required /></div>
            </label>
            <label>
              <span>Mật khẩu</span>
              <div className="auth-input"><LockKeyhole size={18} /><input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Ít nhất 6 ký tự" minLength={6} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label="Hiện hoặc ẩn mật khẩu">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>
            </label>
            {mode === 'login' ? (
              <div className="auth-options"><label className="check"><input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} /><span>Ghi nhớ tôi</span></label><button type="button" onClick={resetPassword}>Quên mật khẩu?</button></div>
            ) : (
              <div className="account-note"><ShieldCheck size={17} /><span>Tài khoản giáo viên do nhà trường cấp và phân quyền riêng.</span></div>
            )}
            {message && <Notice type={message.type}>{message.text}</Notice>}
            <button className="auth-submit" type="submit" disabled={busy}>{busy ? 'Đang xử lý...' : mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'} <ArrowRight size={18} /></button>
          </form>
          <p className="auth-privacy">Bằng việc tiếp tục, bạn đồng ý sử dụng thông tin đúng mục đích quản lý giáo dục của lớp.</p>
        </div>
      </section>
    </main>
  );
}
