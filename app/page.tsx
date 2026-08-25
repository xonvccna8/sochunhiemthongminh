'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Download,
  Eye,
  FileCheck2,
  FileSpreadsheet,
  GraduationCap,
  Link2,
  LockKeyhole,
  LogIn,
  Menu,
  Printer,
  ShieldCheck,
  Sparkles,
  UserRound,
  UsersRound,
  X,
} from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { StudentProfile, UserRecord } from '@/lib/types';
import AuthScreen from '@/components/auth-screen';
import StudentPortal from '@/components/student-portal';
import TeacherPortal from '@/components/teacher-portal';
import ProfileView from '@/components/profile-view';
import { Logo, Spinner } from '@/components/ui';

function Landing({ onLogin }: { onLogin: () => void }) {
  const [menu, setMenu] = useState(false);
  return (
    <main className="landing">
      <header className="landing-header">
        <div className="container nav-inner">
          <Logo />
          <nav className={menu ? 'open' : ''}>
            <a href="#tinh-nang" onClick={() => setMenu(false)}>Tính năng</a>
            <a href="#quy-trinh" onClick={() => setMenu(false)}>Quy trình</a>
            <a href="#bao-mat" onClick={() => setMenu(false)}>Bảo mật</a>
          </nav>
          <div className="nav-actions"><button className="nav-login" onClick={onLogin}><LogIn size={17} /> Đăng nhập</button><button className="nav-primary" onClick={onLogin}>Khai hồ sơ <ArrowRight size={16} /></button></div>
          <button className="landing-menu" onClick={() => setMenu(!menu)} aria-label="Mở menu">{menu ? <X /> : <Menu />}</button>
        </div>
      </header>

      <section className="hero">
        <div className="hero-glow one" /><div className="hero-glow two" />
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="hero-badge"><Sparkles size={15} /> SỔ CHỦ NHIỆM SỐ · LỚP 10C3</span>
            <h1>Quản lý hồ sơ lớp học<br /><em>gọn gàng và an tâm.</em></h1>
            <p>Học sinh tự khai thông tin, phụ huynh xem qua liên kết riêng và giáo viên quản lý tập trung — tất cả trong một không gian chuyên nghiệp.</p>
            <div className="hero-actions"><button onClick={onLogin}>Bắt đầu khai hồ sơ <ArrowRight size={18} /></button><a href="#tinh-nang"><Eye size={18} /> Khám phá hệ thống</a></div>
            <div className="trust-row"><span><CheckCircle2 size={16} /> Miễn phí cho học sinh</span><span><CheckCircle2 size={16} /> Dữ liệu đồng bộ</span><span><CheckCircle2 size={16} /> Xuất Excel chuẩn mẫu</span></div>
          </div>

          <div className="hero-product">
            <div className="floating-pill top"><span><CheckCircle2 size={18} /></span><div><b>Hồ sơ đã hoàn thành</b><small>Vừa được cập nhật</small></div></div>
            <div className="product-window">
              <div className="product-top"><div className="mini-brand"><span>S</span><b>Sổ Chủ Nhiệm</b></div><div className="product-user"><i /><i /><span>NX</span></div></div>
              <div className="product-layout"><aside><i className="active" /><i /><i /><i /><i /></aside><section><div className="product-heading"><div><small>BẢNG ĐIỀU KHIỂN</small><b>Chào buổi sáng, thầy Xô!</b></div><button>Xuất Excel</button></div><div className="mini-stats"><article><span className="blue"><UsersRound size={17} /></span><small>Tổng học sinh</small><b>42</b></article><article><span className="green"><CheckCircle2 size={17} /></span><small>Đã hoàn thành</small><b>38</b></article><article><span className="amber"><FileCheck2 size={17} /></span><small>Chưa hoàn thành</small><b>04</b></article></div><div className="mini-table"><header><b>Hồ sơ học sinh</b><span>Tìm kiếm</span></header>{['Nguyễn Minh Anh', 'Trần Gia Hân', 'Lê Hoàng Nam'].map((name, index) => <div key={name}><span className={`avatar a${index}`}>{name.charAt(0)}</span><b>{name}</b><i><u style={{ width: index === 2 ? '72%' : '100%' }} /></i><em className={index === 2 ? 'draft' : ''}>{index === 2 ? 'Bản nháp' : 'Hoàn thành'}</em></div>)}</div></section></div>
            </div>
            <div className="floating-pill bottom"><span><FileSpreadsheet size={18} /></span><div><b>Xuất đúng mẫu nhà trường</b><small>Excel · 1 chạm</small></div></div>
          </div>
        </div>
      </section>

      <section className="role-strip"><div className="container"><p>Được thiết kế riêng cho cộng đồng lớp học</p><div><span><UserRound /> Học sinh</span><i /><span><UsersRound /> Phụ huynh</span><i /><span><GraduationCap /> Giáo viên chủ nhiệm</span></div></div></section>

      <section id="tinh-nang" className="feature-section section-pad">
        <div className="container">
          <div className="section-heading centered"><span>TÍNH NĂNG TRỌNG TÂM</span><h2>Một hệ thống, đầy đủ cho cả lớp</h2><p>Đơn giản cho học sinh, minh bạch với phụ huynh và mạnh mẽ cho giáo viên.</p></div>
          <div className="feature-grid">
            <article className="feature-card accent"><div className="feature-icon"><FileCheck2 /></div><span>DÀNH CHO HỌC SINH</span><h3>Khai hồ sơ thuận tiện</h3><p>Biểu mẫu chia theo từng bước, tự lưu bản nháp và nhắc các trường bắt buộc.</p><ul><li><CheckCircle2 /> Lớp và năm học được cố định</li><li><CheckCircle2 /> Xem lại trước khi gửi</li><li><CheckCircle2 /> Cập nhật bất cứ lúc nào</li></ul></article>
            <article className="feature-card"><div className="feature-icon green"><Link2 /></div><span>DÀNH CHO PHỤ HUYNH</span><h3>Xem hồ sơ qua liên kết riêng</h3><p>Ngay sau khi học sinh gửi, hệ thống tạo trang xem rõ ràng trên điện thoại và máy tính.</p><ul><li><CheckCircle2 /> Không cần tạo tài khoản riêng</li><li><CheckCircle2 /> Thông tin trình bày dễ đọc</li><li><CheckCircle2 /> Có thể in trực tiếp</li></ul></article>
            <article className="feature-card"><div className="feature-icon purple"><BarChart3 /></div><span>DÀNH CHO GIÁO VIÊN</span><h3>Quản lý toàn lớp tập trung</h3><p>Theo dõi tiến độ từng học sinh, tìm kiếm nhanh và xuất hồ sơ theo mẫu nhà trường.</p><ul><li><CheckCircle2 /> Dashboard thời gian thực</li><li><CheckCircle2 /> Phân quyền giáo viên riêng</li><li><CheckCircle2 /> Xuất từng hồ sơ hoặc cả lớp</li></ul></article>
          </div>
        </div>
      </section>

      <section id="quy-trinh" className="workflow-section section-pad"><div className="container workflow-grid"><div><div className="section-heading"><span>QUY TRÌNH ĐƠN GIẢN</span><h2>Hoàn tất hồ sơ chỉ trong vài phút</h2><p>Mọi thao tác đều rõ ràng, không cần cài ứng dụng và dùng tốt trên điện thoại.</p></div><div className="workflow-list">{[
              ['01', 'Đăng ký tài khoản', 'Học sinh dùng email để tạo tài khoản cá nhân.'],
              ['02', 'Điền và kiểm tra hồ sơ', 'Hoàn thiện thông tin theo đúng mẫu của lớp.'],
              ['03', 'Gửi & chia sẻ', 'Giáo viên nhận dữ liệu, phụ huynh xem qua liên kết riêng.'],
            ].map(([number, title, text]) => <div key={number}><span>{number}</span><div><h3>{title}</h3><p>{text}</p></div></div>)}</div><button className="workflow-button" onClick={onLogin}>Bắt đầu ngay <ArrowRight size={17} /></button></div><div className="form-preview"><div className="form-preview-top"><span><FileCheck2 /></span><div><small>PHIẾU THÔNG TIN</small><b>Hồ sơ học sinh</b></div><em>75%</em></div><div className="preview-progress"><i /></div><div className="preview-fields"><label>Họ và tên <span>Nguyễn Minh Anh</span></label><div><label>Học sinh lớp <b>10C3</b></label><label>Năm học <b>2026 – 2027</b></label></div><label>Địa chỉ liên lạc <span>Phường Hòa Cường, TP. Đà Nẵng</span></label><label>Giáo viên chủ nhiệm <b>Nguyễn Văn Xô</b></label></div><button>Tiếp tục <ArrowRight size={16} /></button></div></div></section>

      <section id="bao-mat" className="security-section"><div className="container security-inner"><div className="security-icon"><LockKeyhole /></div><div><span>BẢO MẬT &amp; PHÂN QUYỀN</span><h2>Thông tin học sinh được sử dụng đúng người, đúng mục đích.</h2><p>Tài khoản học sinh chỉ chỉnh sửa hồ sơ của mình. Tài khoản giáo viên được nhà trường cấp quyền để quản lý toàn lớp. Liên kết phụ huynh sử dụng mã riêng khó đoán.</p></div><div className="security-points"><span><ShieldCheck /> Firebase Authentication</span><span><LockKeyhole /> Quy tắc Firestore</span><span><FileCheck2 /> Lịch sử cập nhật</span></div></div></section>

      <section className="cta-section"><div className="container"><div><span>SẴN SÀNG BẮT ĐẦU?</span><h2>Hoàn thiện hồ sơ lớp 10C3 ngay hôm nay.</h2><p>Năm học 2026 – 2027 · Giáo viên chủ nhiệm Nguyễn Văn Xô</p></div><button onClick={onLogin}>Đăng nhập / Đăng ký <ArrowRight size={18} /></button></div></section>
      <footer className="landing-footer"><div className="container"><Logo /><p>Hệ thống quản lý hồ sơ học sinh trực tuyến dành cho lớp 10C3.</p><span>© 2026 Sổ Chủ Nhiệm Online</span></div></footer>
    </main>
  );
}

function PublicProfilePage({ token, onHome }: { token: string; onHome: () => void }) {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDoc(doc(db, 'publicProfiles', token)).then((snapshot) => {
      if (snapshot.exists()) setProfile(snapshot.data() as StudentProfile);
    }).finally(() => setLoading(false));
  }, [token]);

  if (loading) return <Spinner label="Đang mở hồ sơ học sinh..." />;
  if (!profile) return <main className="not-found"><div className="not-found-icon"><LockKeyhole /></div><h1>Liên kết không khả dụng</h1><p>Hồ sơ chưa được công khai, liên kết không đúng hoặc đã thay đổi.</p><button onClick={onHome}>Về trang chủ</button></main>;

  return <main className="public-profile-page"><header><Logo /><div><span><ShieldCheck size={16} /> Liên kết xem dành cho phụ huynh</span><button onClick={() => window.print()}><Printer size={17} /> In hồ sơ</button></div></header><section className="public-profile-wrap"><ProfileView profile={profile} publicMode /><div className="public-footer-note"><ShieldCheck size={18} /><p><b>Thông tin được cung cấp bởi học sinh và xác nhận trên Sổ Chủ Nhiệm Online.</b><span>Giáo viên chủ nhiệm: {profile.teacherName}</span></p></div></section></main>;
}

export default function Home() {
  const [screen, setScreen] = useState<'landing' | 'auth'>('landing');
  const [user, setUser] = useState<User | null>(null);
  const [record, setRecord] = useState<UserRecord | null>(null);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [publicToken, setPublicToken] = useState('');

  useEffect(() => {
    setPublicToken(new URLSearchParams(window.location.search).get('hoso') || '');
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setRecord(null);
        setProfile(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnapshot = await getDoc(userRef);
        let nextRecord: UserRecord;
        if (userSnapshot.exists()) nextRecord = userSnapshot.data() as UserRecord;
        else {
          nextRecord = { uid: currentUser.uid, email: currentUser.email || '', displayName: currentUser.displayName || 'Học sinh', role: 'student' };
          await setDoc(userRef, { ...nextRecord, createdAt: serverTimestamp() });
        }
        setRecord(nextRecord);
        if (nextRecord.role === 'student') {
          const profileSnapshot = await getDoc(doc(db, 'profiles', currentUser.uid));
          setProfile(profileSnapshot.exists() ? profileSnapshot.data() as StudentProfile : null);
        }
      } finally {
        setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  const logout = async () => {
    await signOut(auth);
    setScreen('landing');
  };

  if (publicToken) return <PublicProfilePage token={publicToken} onHome={() => { window.history.replaceState({}, '', '/'); setPublicToken(''); }} />;
  if (loading) return <Spinner />;
  if (user && record?.role === 'teacher') return <TeacherPortal teacherName={record.displayName || 'Nguyễn Văn Xô'} onLogout={logout} />;
  if (user && record?.role === 'student') return <StudentPortal user={user} initialProfile={profile} onLogout={logout} />;
  if (screen === 'auth') return <AuthScreen onBack={() => setScreen('landing')} />;
  return <Landing onLogin={() => setScreen('auth')} />;
}
