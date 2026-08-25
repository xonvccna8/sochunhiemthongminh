'use client';

import { useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import {
  BarChart3,
  Bell,
  CheckCircle2,
  ChevronDown,
  Clipboard,
  Clock3,
  Download,
  Eye,
  FileSpreadsheet,
  LayoutDashboard,
  Link2,
  LogOut,
  Menu,
  MoreHorizontal,
  Search,
  Settings,
  ShieldCheck,
  UserPlus,
  UsersRound,
  X,
} from 'lucide-react';
import { db } from '@/lib/firebase';
import { exportProfilesToExcel } from '@/lib/export-excel';
import { FIXED_CLASS, FIXED_SCHOOL_YEAR, StudentProfile, profileCompletion } from '@/lib/types';
import { Modal, Notice } from './ui';
import ProfileView from './profile-view';

type Filter = 'all' | 'completed' | 'draft';

export default function TeacherPortal({ teacherName, onLogout }: { teacherName: string; onLogout: () => void }) {
  const [profiles, setProfiles] = useState<StudentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [selected, setSelected] = useState<StudentProfile | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [mobileMenu, setMobileMenu] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(query(collection(db, 'profiles')), (snapshot) => {
      setProfiles(snapshot.docs.map((item) => item.data() as StudentProfile));
      setLoading(false);
    }, () => {
      setNotice('Chưa thể tải danh sách. Hãy kiểm tra quyền đọc Firestore của tài khoản giáo viên.');
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const shown = useMemo(() => profiles.filter((profile) => {
    const matchesFilter = filter === 'all' || profile.status === filter;
    const term = search.toLocaleLowerCase('vi').trim();
    const matchesSearch = !term || [profile.fullName, profile.email, profile.fatherPhone, profile.motherPhone].some((value) => value?.toLocaleLowerCase('vi').includes(term));
    return matchesFilter && matchesSearch;
  }), [profiles, search, filter]);

  const completed = profiles.filter((profile) => profile.status === 'completed').length;
  const drafts = profiles.length - completed;
  const average = profiles.length ? Math.round(profiles.reduce((sum, profile) => sum + profileCompletion(profile), 0) / profiles.length) : 0;

  const copyShareLink = async (profile: StudentProfile) => {
    if (!profile.shareToken) {
      setNotice('Học sinh chưa gửi hồ sơ nên chưa có liên kết chia sẻ.');
      return;
    }
    await navigator.clipboard.writeText(`${window.location.origin}/?hoso=${profile.shareToken}`);
    setNotice(`Đã sao chép liên kết của ${profile.fullName}.`);
  };

  return (
    <main className="teacher-shell">
      <aside className={`teacher-sidebar ${mobileMenu ? 'open' : ''}`}>
        <div className="teacher-logo"><span>S</span><div><b>Sổ Chủ Nhiệm</b><small>Teacher Workspace</small></div><button onClick={() => setMobileMenu(false)} aria-label="Đóng menu"><X size={20} /></button></div>
        <div className="school-card"><small>KHÔNG GIAN LỚP HỌC</small><b>Lớp {FIXED_CLASS}</b><span>Năm học {FIXED_SCHOOL_YEAR}</span></div>
        <nav>
          <p>TỔNG QUAN</p>
          <button className="active"><LayoutDashboard size={18} /> Bảng điều khiển</button>
          <button><UsersRound size={18} /> Hồ sơ học sinh <span>{profiles.length}</span></button>
          <button><BarChart3 size={18} /> Báo cáo lớp</button>
          <p>QUẢN LÝ</p>
          <button><FileSpreadsheet size={18} /> Xuất dữ liệu</button>
          <button><Settings size={18} /> Thiết lập lớp</button>
        </nav>
        <div className="teacher-help"><ShieldCheck size={23} /><b>Dữ liệu được bảo vệ</b><p>Chỉ giáo viên được phân quyền mới xem được toàn bộ hồ sơ lớp.</p></div>
        <button className="sidebar-logout" onClick={onLogout}><LogOut size={18} /> Đăng xuất</button>
      </aside>

      <section className="teacher-main">
        <header className="teacher-topbar">
          <button className="mobile-menu-button" onClick={() => setMobileMenu(true)}><Menu size={22} /></button>
          <div className="global-search"><Search size={18} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm học sinh, số điện thoại..." /><kbd>Ctrl K</kbd></div>
          <div className="teacher-account"><button className="notification-button"><Bell size={19} /><i /></button><div className="teacher-avatar">{teacherName.charAt(0)}</div><div><b>{teacherName}</b><small>Giáo viên chủ nhiệm</small></div><ChevronDown size={16} /></div>
        </header>

        <div className="teacher-content">
          <div className="teacher-heading"><div><p className="eyebrow">BẢNG ĐIỀU KHIỂN</p><h1>Xin chào, thầy {teacherName.split(' ').slice(-1)[0]}!</h1><span>Theo dõi và quản lý thông tin học sinh lớp {FIXED_CLASS}.</span></div><div className="heading-actions"><button className="outline-action"><UserPlus size={18} /> Mời học sinh</button><button className="export-action" onClick={() => exportProfilesToExcel(shown)} disabled={!shown.length}><Download size={18} /> Xuất Excel</button></div></div>

          {notice && <div className="dashboard-notice"><Notice type={notice.includes('Chưa') ? 'error' : 'success'}>{notice}</Notice><button onClick={() => setNotice(null)}><X size={16} /></button></div>}

          <div className="stat-grid">
            <article><span className="stat-icon blue"><UsersRound /></span><div><small>Tổng số học sinh</small><strong>{profiles.length}</strong><p>Hồ sơ trong hệ thống</p></div></article>
            <article><span className="stat-icon green"><CheckCircle2 /></span><div><small>Đã hoàn thành</small><strong>{completed}</strong><p>{profiles.length ? Math.round((completed / profiles.length) * 100) : 0}% tổng số hồ sơ</p></div></article>
            <article><span className="stat-icon amber"><Clock3 /></span><div><small>Chưa hoàn thành</small><strong>{drafts}</strong><p>Cần nhắc cập nhật</p></div></article>
            <article><span className="stat-icon purple"><BarChart3 /></span><div><small>Mức độ đầy đủ</small><strong>{average}%</strong><p>Trung bình toàn lớp</p></div></article>
          </div>

          <section className="student-table-card">
            <header><div><h2>Hồ sơ học sinh</h2><p>Cập nhật theo thời gian thực từ Firebase</p></div><div className="table-tools"><div className="table-search"><Search size={17} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm kiếm..." /></div><select value={filter} onChange={(e) => setFilter(e.target.value as Filter)}><option value="all">Tất cả trạng thái</option><option value="completed">Đã hoàn thành</option><option value="draft">Bản nháp</option></select></div></header>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Học sinh</th><th>Liên hệ phụ huynh</th><th>Tiến độ</th><th>Trạng thái</th><th>Cập nhật</th><th></th></tr></thead>
                <tbody>
                  {loading ? <tr><td colSpan={6} className="empty-row">Đang tải danh sách học sinh...</td></tr> : shown.length ? shown.map((profile) => {
                    const progress = profileCompletion(profile);
                    return <tr key={profile.ownerId}>
                      <td><div className="student-cell"><span>{profile.fullName?.charAt(0) || 'H'}</span><div><b>{profile.fullName || 'Chưa cập nhật'}</b><small>{profile.email}</small></div></div></td>
                      <td><b className="phone-text">{profile.fatherPhone || profile.motherPhone || '—'}</b><small>{profile.fatherName || profile.motherName || 'Chưa có tên phụ huynh'}</small></td>
                      <td><div className="table-progress"><span><i style={{ width: `${progress}%` }} /></span><b>{progress}%</b></div></td>
                      <td><span className={`status-pill ${profile.status}`}>{profile.status === 'completed' ? <><CheckCircle2 size={14} /> Đã hoàn thành</> : <><Clock3 size={14} /> Bản nháp</>}</span></td>
                      <td><span className="updated-text">Gần đây</span></td>
                      <td><div className="row-actions"><button title="Xem hồ sơ" onClick={() => setSelected(profile)}><Eye size={17} /></button><button title="Sao chép liên kết" onClick={() => copyShareLink(profile)}><Link2 size={17} /></button><button title="Xuất Excel" onClick={() => exportProfilesToExcel([profile])}><Download size={17} /></button><button><MoreHorizontal size={17} /></button></div></td>
                    </tr>;
                  }) : <tr><td colSpan={6} className="empty-row">Chưa có hồ sơ phù hợp. Học sinh đăng ký và gửi hồ sơ sẽ xuất hiện tại đây.</td></tr>}
                </tbody>
              </table>
            </div>
            <footer><span>Hiển thị {shown.length} trên {profiles.length} học sinh</span><button onClick={() => exportProfilesToExcel(shown)} disabled={!shown.length}><FileSpreadsheet size={16} /> Xuất các hồ sơ đang hiển thị</button></footer>
          </section>

          <div className="dashboard-bottom-grid">
            <article className="activity-card"><header><h3>Hoạt động gần đây</h3><button>Xem tất cả</button></header>{profiles.slice(0, 3).map((profile, index) => <div className="activity-item" key={profile.ownerId}><span className={profile.status === 'completed' ? 'green' : 'amber'}>{profile.status === 'completed' ? <CheckCircle2 size={17} /> : <Clock3 size={17} />}</span><div><b>{profile.fullName || 'Một học sinh'} {profile.status === 'completed' ? 'đã gửi hồ sơ' : 'đang cập nhật hồ sơ'}</b><small>{index === 0 ? 'Vừa xong' : `${index + 1} giờ trước`}</small></div></div>)}{!profiles.length && <p className="empty-activity">Chưa có hoạt động mới.</p>}</article>
            <article className="share-class-card"><div className="share-class-icon"><Clipboard size={25} /></div><div><h3>Mời học sinh điền hồ sơ</h3><p>Gửi liên kết trang chủ để học sinh đăng ký, đăng nhập và tự khai thông tin.</p><div><code>{typeof window !== 'undefined' ? window.location.origin : 'Liên kết website'}</code><button onClick={() => { navigator.clipboard.writeText(window.location.origin); setNotice('Đã sao chép liên kết mời học sinh.'); }}><Clipboard size={16} /> Sao chép</button></div></div></article>
          </div>
        </div>
      </section>

      {selected && <Modal title={`Hồ sơ · ${selected.fullName}`} wide onClose={() => setSelected(null)}><div className="modal-profile-actions"><button onClick={() => copyShareLink(selected)}><Link2 size={17} /> Sao chép liên kết phụ huynh</button><button className="primary" onClick={() => exportProfilesToExcel([selected])}><Download size={17} /> Xuất Excel đúng mẫu</button></div><ProfileView profile={selected} /></Modal>}
    </main>
  );
}
