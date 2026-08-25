'use client';

import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { collection, doc, onSnapshot, query, serverTimestamp, where, writeBatch } from 'firebase/firestore';
import {
  Award,
  BarChart3,
  Bell,
  BookOpenCheck,
  CheckCircle2,
  ChevronDown,
  Clipboard,
  Clock3,
  Copy,
  Download,
  Eye,
  FileCheck2,
  FileSpreadsheet,
  GraduationCap,
  LayoutDashboard,
  Link2,
  LogOut,
  Menu,
  Pencil,
  Search,
  Save,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  TrendingUp,
  Trash2,
  UserCheck,
  UserPlus,
  UserX,
  UsersRound,
  X,
} from 'lucide-react';
import { db } from '@/lib/firebase';
import { CLASS_ROSTER, FORMER_SCHOOLS, ClassStudent, normalizeVietnameseName } from '@/lib/class-roster';
import { exportClassRosterToExcel, exportProfilesToExcel } from '@/lib/export-excel';
import { StudentProfile } from '@/lib/types';
import { Modal, Notice } from './ui';
import ProfileView from './profile-view';
import TeacherProfileEditor, { EditableProfileField } from './teacher-profile-editor';

type Filter = 'all' | 'completed' | 'draft' | 'not-started';
type RosterRow = { student: ClassStudent; profile: StudentProfile | null };
type TeacherView = 'dashboard' | 'roster' | 'reports' | 'profiles' | 'settings';
const subscribeToOrigin = () => () => undefined;

function matchProfile(student: ClassStudent, profiles: StudentProfile[]) {
  return profiles.find((profile) => profile.rosterNumber === String(student.no))
    || profiles.find((profile) => normalizeVietnameseName(profile.fullName) === normalizeVietnameseName(student.fullName))
    || null;
}

export default function TeacherPortal({
  teacherName,
  className,
  schoolYear,
  onLogout,
}: {
  teacherName: string;
  className: string;
  schoolYear: string;
  onLogout: () => void;
}) {
  const [profiles, setProfiles] = useState<StudentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [school, setSchool] = useState('all');
  const [selected, setSelected] = useState<RosterRow | null>(null);
  const [editing, setEditing] = useState<StudentProfile | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StudentProfile | null>(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [activeView, setActiveView] = useState<TeacherView>('roster');
  const [preferences, setPreferences] = useState({ completed: true, drafts: true, weekly: false });
  const siteOrigin = useSyncExternalStore(subscribeToOrigin, () => window.location.origin, () => '');

  useEffect(() => {
    const classProfiles = query(
      collection(db, 'profiles'),
      where('className', '==', className),
      where('schoolYear', '==', schoolYear),
    );
    const unsubscribe = onSnapshot(classProfiles, (snapshot) => {
      setProfiles(snapshot.docs.map((item) => item.data() as StudentProfile));
      setLoading(false);
    }, () => {
      setNotice('Danh sách chính thức vẫn hiển thị đủ 50 em. Chưa thể đồng bộ trạng thái hồ sơ từ Firestore.');
      setLoading(false);
    });
    return unsubscribe;
  }, [className, schoolYear]);

  const rosterRows = useMemo<RosterRow[]>(() => CLASS_ROSTER.map((student) => ({
    student,
    profile: matchProfile(student, profiles),
  })), [profiles]);

  const shown = useMemo(() => rosterRows.filter(({ student, profile }) => {
    const status = profile?.status || 'not-started';
    const matchesFilter = filter === 'all' || status === filter;
    const matchesSchool = school === 'all' || student.formerSchool === school;
    const term = normalizeVietnameseName(search);
    const matchesSearch = !term || [student.fullName, student.gender, student.birthDate, student.ethnic, student.formerSchool, String(student.no)]
      .some((value) => normalizeVietnameseName(value).includes(term));
    return matchesFilter && matchesSchool && matchesSearch;
  }), [rosterRows, search, filter, school]);

  const completed = rosterRows.filter(({ profile }) => profile?.status === 'completed').length;
  const drafts = rosterRows.filter(({ profile }) => profile?.status === 'draft').length;
  const notStarted = CLASS_ROSTER.length - completed - drafts;
  const male = CLASS_ROSTER.filter((student) => student.gender === 'Nam').length;
  const female = CLASS_ROSTER.length - male;
  const thai = CLASS_ROSTER.filter((student) => student.ethnic === 'Thái').length;
  const kinh = CLASS_ROSTER.filter((student) => student.ethnic === 'Kinh').length;
  const mong = CLASS_ROSTER.filter((student) => student.ethnic === 'Mông').length;
  const completionPercent = Math.round((completed / CLASS_ROSTER.length) * 100);
  const startedPercent = Math.round(((completed + drafts) / CLASS_ROSTER.length) * 100);
  const declaredRows = useMemo(() => rosterRows.filter(({ student, profile }) => {
    if (!profile) return false;
    const term = normalizeVietnameseName(search);
    return !term || [student.fullName, student.formerSchool, student.ethnic, String(student.no)]
      .some((value) => normalizeVietnameseName(value).includes(term));
  }), [rosterRows, search]);
  const managedRows = useMemo(() => declaredRows.filter(({ profile }) => (
    filter === 'all' || profile?.status === filter
  )), [declaredRows, filter]);
  const schoolBreakdown = useMemo(() => FORMER_SCHOOLS.map((name) => ({
    name,
    total: CLASS_ROSTER.filter((student) => student.formerSchool === name).length,
  })).sort((a, b) => b.total - a.total), []);
  const maxSchoolTotal = schoolBreakdown[0]?.total || 1;

  const navigateTo = (view: TeacherView) => {
    setActiveView(view);
    setMobileMenu(false);
    setNotice(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const copyInvitation = async () => {
    await navigator.clipboard.writeText(window.location.origin);
    setNotice('Đã sao chép liên kết mời học sinh.');
  };

  const savePreferences = () => {
    localStorage.setItem('teacher-notification-preferences', JSON.stringify(preferences));
    setNotice('Đã lưu thiết lập thông báo trên thiết bị này.');
  };

  const copyShareLink = async (profile: StudentProfile) => {
    if (!profile.shareToken) {
      setNotice('Học sinh chưa gửi hồ sơ nên chưa có liên kết chia sẻ.');
      return;
    }
    await navigator.clipboard.writeText(`${window.location.origin}/?hoso=${profile.shareToken}`);
    setNotice(`Đã sao chép liên kết của ${profile.fullName}.`);
  };

  const openEditor = (profile: StudentProfile) => {
    setSelected(null);
    setEditing({ ...profile });
  };

  const changeEditField = (field: EditableProfileField, value: string) => {
    setEditing((current) => current ? { ...current, [field]: value } : current);
  };

  const saveProfile = async () => {
    if (!editing?.ownerId || editing.className !== className || editing.schoolYear !== schoolYear) {
      setNotice('Không thể lưu vì hồ sơ không thuộc lớp được phân công.');
      return;
    }

    setSaving(true);
    try {
      const nextProfile: StudentProfile = {
        ...editing,
        teacherName,
        className,
        schoolYear,
        updatedAt: serverTimestamp(),
      };
      const batch = writeBatch(db);
      batch.set(doc(db, 'profiles', editing.ownerId), nextProfile, { merge: true });
      if (editing.shareToken) batch.set(doc(db, 'publicProfiles', editing.shareToken), nextProfile, { merge: true });
      await batch.commit();
      setEditing(null);
      setNotice(`Đã lưu thay đổi hồ sơ của ${editing.fullName}.`);
    } catch {
      setNotice('Không thể lưu hồ sơ. Hãy kiểm tra quyền giáo viên và thử lại.');
    } finally {
      setSaving(false);
    }
  };

  const deleteProfile = async () => {
    if (!deleteTarget?.ownerId || deleteTarget.className !== className || deleteTarget.schoolYear !== schoolYear) {
      setNotice('Không thể xóa vì hồ sơ không thuộc lớp được phân công.');
      return;
    }

    setSaving(true);
    try {
      const batch = writeBatch(db);
      batch.delete(doc(db, 'profiles', deleteTarget.ownerId));
      if (deleteTarget.shareToken) batch.delete(doc(db, 'publicProfiles', deleteTarget.shareToken));
      await batch.commit();
      setSelected(null);
      setDeleteTarget(null);
      setNotice(`Đã xóa hồ sơ trực tuyến của ${deleteTarget.fullName}. Tài khoản học sinh vẫn được giữ lại.`);
    } catch {
      setNotice('Không thể xóa hồ sơ. Hãy kiểm tra quyền giáo viên và thử lại.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="teacher-shell">
      <aside className={`teacher-sidebar ${mobileMenu ? 'open' : ''}`}>
        <div className="teacher-logo"><span>S</span><div><b>Sổ Chủ Nhiệm</b><small>Teacher Workspace</small></div><button onClick={() => setMobileMenu(false)} aria-label="Đóng menu"><X size={20} /></button></div>
        <div className="school-card"><small>KHÔNG GIAN LỚP HỌC</small><b>Lớp {className}</b><span>Năm học {schoolYear}</span></div>
        <nav>
          <p>TỔNG QUAN</p>
          <button className={activeView === 'dashboard' ? 'active' : ''} aria-current={activeView === 'dashboard' ? 'page' : undefined} onClick={() => navigateTo('dashboard')}><LayoutDashboard size={18} /> Bảng điều khiển</button>
          <button className={activeView === 'roster' ? 'active' : ''} aria-current={activeView === 'roster' ? 'page' : undefined} onClick={() => navigateTo('roster')}><UsersRound size={18} /> Danh sách lớp <span>50</span></button>
          <button className={activeView === 'reports' ? 'active' : ''} aria-current={activeView === 'reports' ? 'page' : undefined} onClick={() => navigateTo('reports')}><BarChart3 size={18} /> Báo cáo lớp</button>
          <p>QUẢN LÝ</p>
          <button className={activeView === 'profiles' ? 'active' : ''} aria-current={activeView === 'profiles' ? 'page' : undefined} onClick={() => { if (filter === 'not-started') setFilter('all'); navigateTo('profiles'); }}><FileSpreadsheet size={18} /> Hồ sơ đã khai <span>{completed + drafts}</span></button>
          <button className={activeView === 'settings' ? 'active' : ''} aria-current={activeView === 'settings' ? 'page' : undefined} onClick={() => navigateTo('settings')}><Settings size={18} /> Thiết lập lớp</button>
        </nav>
        <div className="teacher-help"><ShieldCheck size={23} /><b>Chỉ quản lý một lớp</b><p>Tài khoản này chỉ được xem và cập nhật hồ sơ học sinh lớp {className}, năm học {schoolYear}.</p></div>
        <button className="sidebar-logout" onClick={onLogout}><LogOut size={18} /> Đăng xuất</button>
      </aside>

      <section className="teacher-main">
        <header className="teacher-topbar">
          <button className="mobile-menu-button" onClick={() => setMobileMenu(true)}><Menu size={22} /></button>
          <div className="global-search"><Search size={18} /><input value={search} onChange={(event) => { setSearch(event.target.value); if (event.target.value) setActiveView('roster'); }} placeholder="Tìm họ tên, trường THCS, dân tộc..." /><kbd>Ctrl K</kbd></div>
          <div className="teacher-account"><button className="notification-button" onClick={() => { setActiveView('dashboard'); setNotice(completed ? `${completed} hồ sơ đã hoàn thành và sẵn sàng xử lý.` : 'Hiện chưa có hồ sơ mới cần xử lý.'); }} aria-label="Xem thông báo"><Bell size={19} /><i /></button><div className="teacher-avatar">{teacherName.charAt(0)}</div><div><b>{teacherName}</b><small>Giáo viên chủ nhiệm</small></div><ChevronDown size={16} /></div>
        </header>

        <div className="teacher-content">
          {notice && <div className="dashboard-notice"><Notice type={notice.includes('Chưa') || notice.includes('Không thể') ? 'error' : 'success'}>{notice}</Notice><button onClick={() => setNotice(null)}><X size={16} /></button></div>}
          <section className="teacher-workspace-view" hidden={activeView !== 'roster'}>
          <div className="teacher-heading"><div><p className="eyebrow">DANH SÁCH CHÍNH THỨC</p><h1>Học sinh lớp {className}</h1><span>Giáo viên chủ nhiệm: {teacherName} · Năm học {schoolYear}</span></div><div className="heading-actions"><button className="outline-action" onClick={() => { navigator.clipboard.writeText(window.location.origin); setNotice('Đã sao chép liên kết mời học sinh.'); }}><UserPlus size={18} /> Mời học sinh</button><button className="export-action" onClick={() => exportClassRosterToExcel(CLASS_ROSTER)}><Download size={18} /> Xuất danh sách Excel</button></div></div>

          <div className="stat-grid roster-stats">
            <article><span className="stat-icon blue"><UsersRound /></span><div><small>Tổng số học sinh</small><strong>{CLASS_ROSTER.length}</strong><p>{male} nam · {female} nữ</p></div></article>
            <article><span className="stat-icon green"><CheckCircle2 /></span><div><small>Đã hoàn thành hồ sơ</small><strong>{completed}</strong><p>Đã gửi cho giáo viên</p></div></article>
            <article><span className="stat-icon amber"><Clock3 /></span><div><small>Đang cập nhật</small><strong>{drafts}</strong><p>Đã lưu bản nháp</p></div></article>
            <article><span className="stat-icon purple"><BarChart3 /></span><div><small>Chưa bắt đầu</small><strong>{notStarted}</strong><p>Cần gửi thông tin đăng nhập</p></div></article>
          </div>

          <section className="roster-insights">
            <div><span>Cơ cấu giới tính</span><b>{female} Nữ</b><i>·</i><b>{male} Nam</b></div>
            <div><span>Cơ cấu dân tộc</span><b>{thai} Thái</b><i>·</i><b>{kinh} Kinh</b><i>·</i><b>{mong} Mông</b></div>
            <div><span>Trường THCS nguồn</span><b>{FORMER_SCHOOLS.length} trường</b></div>
            <div><span>Dữ liệu</span><b className="verified-label"><ShieldCheck size={14} /> Đã đối chiếu 50/50</b></div>
          </section>

          <section className="student-table-card roster-table-card">
            <header><div><h2>Danh sách học sinh lớp {className}</h2><p>Nhấn vào tên học sinh hoặc biểu tượng con mắt để xem hồ sơ chi tiết</p></div><div className="table-tools roster-tools"><div className="table-search"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm học sinh..." /></div><select value={school} onChange={(event) => setSchool(event.target.value)}><option value="all">Tất cả trường THCS</option>{FORMER_SCHOOLS.map((item) => <option key={item} value={item}>{item}</option>)}</select><select value={filter} onChange={(event) => setFilter(event.target.value as Filter)}><option value="all">Tất cả trạng thái</option><option value="completed">Đã hoàn thành</option><option value="draft">Đang cập nhật</option><option value="not-started">Chưa bắt đầu</option></select></div></header>
            <div className="table-wrap">
              <table className="roster-table">
                <thead><tr><th>STT</th><th>Họ và tên</th><th>Giới tính</th><th>Ngày sinh</th><th>Dân tộc</th><th>Học sinh trường</th><th>Hồ sơ online</th><th></th></tr></thead>
                <tbody>
                  {loading ? <tr><td colSpan={8} className="empty-row">Đang đồng bộ trạng thái hồ sơ từ Firestore...</td></tr> : shown.length ? shown.map(({ student, profile }) => {
                    const status = profile?.status || 'not-started';
                    return <tr key={student.no}>
                      <td><span className="roster-number">{String(student.no).padStart(2, '0')}</span></td>
                      <td><button className="student-cell student-open-button" onClick={() => setSelected({ student, profile })}><span>{student.fullName.charAt(0)}</span><div><b>{student.fullName}</b><small>Mã lớp: {className}-{String(student.no).padStart(2, '0')}</small></div></button></td>
                      <td><span className={`gender-pill ${student.gender === 'Nữ' ? 'female' : 'male'}`}>{student.gender}</span></td>
                      <td><b className="date-text">{student.birthDate}</b></td>
                      <td><span className="ethnic-text">{student.ethnic}</span></td>
                      <td><span className="former-school">{student.formerSchool}</span></td>
                      <td><span className={`status-pill ${status}`}>{status === 'completed' ? <><CheckCircle2 size={14} /> Đã hoàn thành</> : status === 'draft' ? <><Clock3 size={14} /> Đang cập nhật</> : <><Clock3 size={14} /> Chưa bắt đầu</>}</span></td>
                      <td><div className="row-actions"><button title="Xem thông tin" aria-label={`Xem hồ sơ ${student.fullName}`} onClick={() => setSelected({ student, profile })}><Eye size={17} /></button><button className="edit" title="Sửa hồ sơ" aria-label={`Sửa hồ sơ ${student.fullName}`} disabled={!profile} onClick={() => profile && openEditor(profile)}><Pencil size={17} /></button><button className="delete" title="Xóa hồ sơ" aria-label={`Xóa hồ sơ ${student.fullName}`} disabled={!profile} onClick={() => profile && setDeleteTarget(profile)}><Trash2 size={17} /></button><button title="Sao chép liên kết phụ huynh" aria-label={`Sao chép liên kết ${student.fullName}`} disabled={!profile?.shareToken} onClick={() => profile && copyShareLink(profile)}><Link2 size={17} /></button><button title="Xuất hồ sơ cá nhân" aria-label={`Xuất hồ sơ ${student.fullName}`} disabled={!profile} onClick={() => profile && exportProfilesToExcel([profile])}><Download size={17} /></button></div></td>
                    </tr>;
                  }) : <tr><td colSpan={8} className="empty-row">Không tìm thấy học sinh phù hợp với bộ lọc.</td></tr>}
                </tbody>
              </table>
            </div>
            <footer><span>Hiển thị {shown.length} trên {CLASS_ROSTER.length} học sinh · Sắp xếp theo STT danh sách chính thức</span><div><button onClick={() => exportClassRosterToExcel(shown.map((row) => row.student))} disabled={!shown.length}><FileSpreadsheet size={16} /> Xuất danh sách đang hiển thị</button><button onClick={() => exportProfilesToExcel(shown.flatMap((row) => row.profile ? [row.profile] : []))} disabled={!shown.some((row) => row.profile)}><Download size={16} /> Xuất hồ sơ đã khai</button></div></footer>
          </section>

          <div className="dashboard-bottom-grid">
            <article className="activity-card"><header><h3>Tóm tắt hồ sơ trực tuyến</h3><button>{completed + drafts}/{CLASS_ROSTER.length} tài khoản</button></header><div className="activity-item"><span className="green"><CheckCircle2 size={17} /></span><div><b>{completed} học sinh đã gửi hồ sơ hoàn chỉnh</b><small>Dữ liệu sẵn sàng để xuất mẫu cá nhân</small></div></div><div className="activity-item"><span className="amber"><Clock3 size={17} /></span><div><b>{drafts} học sinh đang lưu bản nháp</b><small>Giáo viên có thể theo dõi tiến độ</small></div></div><div className="activity-item"><span className="amber"><UserPlus size={17} /></span><div><b>{notStarted} học sinh chưa bắt đầu</b><small>Gửi tài khoản để học sinh đăng nhập</small></div></div></article>
            <article className="share-class-card"><div className="share-class-icon"><Clipboard size={25} /></div><div><h3>Mời học sinh điền hồ sơ</h3><p>Học sinh chọn đúng tên trong danh sách 50 em; họ tên, ngày sinh, giới tính, dân tộc và trường THCS sẽ tự động điền.</p><div><code>{siteOrigin || 'Liên kết website'}</code><button onClick={() => { navigator.clipboard.writeText(window.location.origin); setNotice('Đã sao chép liên kết mời học sinh.'); }}><Clipboard size={16} /> Sao chép</button></div></div></article>
          </div>
          </section>

          <section className="teacher-workspace-view" hidden={activeView !== 'dashboard'}>
            <div className="teacher-heading"><div><p className="eyebrow">TRUNG TÂM ĐIỀU HÀNH</p><h1>Bảng điều khiển lớp {className}</h1><span>Cập nhật trực tiếp từ hồ sơ học sinh · Năm học {schoolYear}</span></div><div className="heading-actions"><button className="outline-action" onClick={copyInvitation}><UserPlus size={18} /> Mời học sinh</button><button className="export-action" onClick={() => exportProfilesToExcel(profiles)} disabled={!profiles.length}><Download size={18} /> Xuất hồ sơ</button></div></div>

            <div className="stat-grid dashboard-stats">
              <article><span className="stat-icon blue"><UsersRound /></span><div><small>Sĩ số chính thức</small><strong>{CLASS_ROSTER.length}</strong><p>{male} nam · {female} nữ</p></div></article>
              <article><span className="stat-icon green"><UserCheck /></span><div><small>Đã hoàn thành</small><strong>{completed}</strong><p>{completionPercent}% sĩ số lớp</p></div></article>
              <article><span className="stat-icon amber"><Clock3 /></span><div><small>Đang khai hồ sơ</small><strong>{drafts}</strong><p>Cần tiếp tục hoàn thiện</p></div></article>
              <article><span className="stat-icon purple"><UserX /></span><div><small>Chưa tham gia</small><strong>{notStarted}</strong><p>Cần gửi lời mời</p></div></article>
            </div>

            <div className="teacher-overview-grid">
              <article className="workspace-card progress-card">
                <header><div><span className="card-icon green"><TrendingUp size={20} /></span><div><small>TIẾN ĐỘ HỒ SƠ</small><h2>Mức độ tham gia của lớp</h2></div></div><b>{startedPercent}%</b></header>
                <div className="large-progress"><i style={{ width: `${startedPercent}%` }} /></div>
                <div className="progress-legend"><span><i className="green" /> Hoàn thành <b>{completed}</b></span><span><i className="amber" /> Đang cập nhật <b>{drafts}</b></span><span><i className="gray" /> Chưa bắt đầu <b>{notStarted}</b></span></div>
                <p>{notStarted ? `Còn ${notStarted} học sinh chưa bắt đầu khai hồ sơ. Hãy gửi liên kết để bảo đảm dữ liệu lớp đầy đủ.` : 'Toàn bộ học sinh đã bắt đầu khai hồ sơ.'}</p>
              </article>

              <article className="workspace-card quick-actions-card">
                <header><div><span className="card-icon blue"><SlidersHorizontal size={20} /></span><div><small>THAO TÁC NHANH</small><h2>Công việc thường dùng</h2></div></div></header>
                <div className="quick-action-list">
                  <button onClick={() => { setFilter('not-started'); navigateTo('roster'); }}><UserPlus size={19} /><span><b>Học sinh chưa tham gia</b><small>Xem {notStarted} em cần gửi lời mời</small></span><ChevronDown size={16} /></button>
                  <button onClick={() => { setFilter('completed'); navigateTo('profiles'); }}><FileCheck2 size={19} /><span><b>Hồ sơ đã hoàn thành</b><small>Kiểm tra và xuất dữ liệu</small></span><ChevronDown size={16} /></button>
                  <button onClick={() => navigateTo('reports')}><BarChart3 size={19} /><span><b>Xem báo cáo lớp</b><small>Giới tính, dân tộc và trường nguồn</small></span><ChevronDown size={16} /></button>
                </div>
              </article>
            </div>

            <div className="teacher-overview-grid lower">
              <article className="workspace-card recent-profile-card">
                <header><div><span className="card-icon purple"><BookOpenCheck size={20} /></span><div><small>HỒ SƠ GẦN ĐÂY</small><h2>Dữ liệu đã được học sinh khai</h2></div></div><button onClick={() => navigateTo('profiles')}>Xem tất cả</button></header>
                <div className="recent-profile-list">
                  {declaredRows.slice(0, 4).map(({ student, profile }) => profile && <button key={student.no} onClick={() => setSelected({ student, profile })}><span>{student.fullName.charAt(0)}</span><div><b>{student.fullName}</b><small>STT {String(student.no).padStart(2, '0')} · {student.formerSchool}</small></div><em className={`status-pill ${profile.status}`}>{profile.status === 'completed' ? 'Đã hoàn thành' : 'Đang cập nhật'}</em></button>)}
                  {!declaredRows.length && <div className="workspace-empty"><FileSpreadsheet size={25} /><p>Chưa có học sinh khai hồ sơ trực tuyến.</p></div>}
                </div>
              </article>

              <article className="workspace-card class-snapshot-card">
                <header><div><span className="card-icon amber"><GraduationCap size={20} /></span><div><small>THÔNG TIN LỚP</small><h2>Phạm vi phụ trách</h2></div></div></header>
                <div className="snapshot-class"><span>{className}</span><div><b>Giáo viên chủ nhiệm {teacherName}</b><small>Năm học {schoolYear}</small></div><ShieldCheck size={22} /></div>
                <ul><li><span>Danh sách chính thức</span><b>50 học sinh</b></li><li><span>Trường THCS nguồn</span><b>{FORMER_SCHOOLS.length} trường</b></li><li><span>Dữ liệu đã đối chiếu</span><b className="positive">50/50</b></li></ul>
              </article>
            </div>
          </section>

          <section className="teacher-workspace-view" hidden={activeView !== 'reports'}>
            <div className="teacher-heading"><div><p className="eyebrow">PHÂN TÍCH DỮ LIỆU</p><h1>Báo cáo lớp {className}</h1><span>Tổng hợp từ danh sách chính thức và hồ sơ trực tuyến</span></div><div className="heading-actions"><button className="outline-action" onClick={() => window.print()}><FileCheck2 size={18} /> In báo cáo</button><button className="export-action" onClick={() => exportClassRosterToExcel(CLASS_ROSTER)}><Download size={18} /> Xuất Excel</button></div></div>

            <div className="report-summary-strip"><span><TrendingUp size={18} /><b>{completionPercent}%</b> hoàn thành hồ sơ</span><span><UsersRound size={18} /><b>{female}</b> nữ · <b>{male}</b> nam</span><span><GraduationCap size={18} /><b>{FORMER_SCHOOLS.length}</b> trường THCS nguồn</span><span><ShieldCheck size={18} /><b>50/50</b> đã đối chiếu</span></div>

            <div className="teacher-report-grid">
              <article className="report-card report-progress-card"><header><span className="card-icon green"><CheckCircle2 size={20} /></span><div><small>TIẾN ĐỘ</small><h2>Tình trạng hồ sơ trực tuyến</h2></div></header><div className="report-bars"><div><label><span>Đã hoàn thành</span><b>{completed} học sinh</b></label><i><u className="green" style={{ width: `${completionPercent}%` }} /></i></div><div><label><span>Đang cập nhật</span><b>{drafts} học sinh</b></label><i><u className="amber" style={{ width: `${Math.round((drafts / CLASS_ROSTER.length) * 100)}%` }} /></i></div><div><label><span>Chưa bắt đầu</span><b>{notStarted} học sinh</b></label><i><u className="gray" style={{ width: `${Math.round((notStarted / CLASS_ROSTER.length) * 100)}%` }} /></i></div></div></article>

              <article className="report-card donut-report-card"><header><span className="card-icon blue"><UsersRound size={20} /></span><div><small>GIỚI TÍNH</small><h2>Cơ cấu học sinh</h2></div></header><div className="donut-wrap"><div className="report-donut" style={{ background: `conic-gradient(#e96d9f 0 ${female * 2}%, #3478df ${female * 2}% 100%)` }}><span><b>50</b><small>học sinh</small></span></div><div className="donut-legend"><span><i className="female" /><b>{female} Nữ</b><small>{female * 2}%</small></span><span><i className="male" /><b>{male} Nam</b><small>{male * 2}%</small></span></div></div></article>

              <article className="report-card ethnic-report-card"><header><span className="card-icon purple"><Award size={20} /></span><div><small>DÂN TỘC</small><h2>Thành phần học sinh</h2></div></header><div className="ethnic-stats"><div className="primary"><strong>{thai}</strong><span>học sinh dân tộc Thái</span><i><u style={{ width: `${thai * 2}%` }} /></i></div><div><span><b>{kinh}</b> Kinh</span><span><b>{mong}</b> Mông</span></div></div></article>

              <article className="report-card school-report-card"><header><span className="card-icon amber"><GraduationCap size={20} /></span><div><small>TRƯỜNG NGUỒN</small><h2>Phân bổ theo trường THCS</h2></div></header><div className="school-bar-list">{schoolBreakdown.slice(0, 7).map((item) => <div key={item.name}><label><span>{item.name}</span><b>{item.total}</b></label><i><u style={{ width: `${Math.round((item.total / maxSchoolTotal) * 100)}%` }} /></i></div>)}</div></article>
            </div>
          </section>

          <section className="teacher-workspace-view" hidden={activeView !== 'profiles'}>
            <div className="teacher-heading"><div><p className="eyebrow">QUẢN LÝ HỒ SƠ</p><h1>Hồ sơ học sinh đã khai</h1><span>Xem, chỉnh sửa, xóa và xuất dữ liệu của học sinh lớp {className}</span></div><div className="heading-actions"><button className="outline-action" onClick={() => { setFilter('all'); setSearch(''); }}><SlidersHorizontal size={18} /> Xóa bộ lọc</button><button className="export-action" onClick={() => exportProfilesToExcel(managedRows.flatMap(({ profile }) => profile ? [profile] : []))} disabled={!managedRows.length}><Download size={18} /> Xuất hồ sơ</button></div></div>

            <div className="profile-filter-bar"><div><button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>Tất cả <b>{completed + drafts}</b></button><button className={filter === 'completed' ? 'active' : ''} onClick={() => setFilter('completed')}>Đã hoàn thành <b>{completed}</b></button><button className={filter === 'draft' ? 'active' : ''} onClick={() => setFilter('draft')}>Đang cập nhật <b>{drafts}</b></button></div><div className="table-search"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm hồ sơ học sinh..." /></div></div>

            <div className="managed-profile-grid">
              {managedRows.map(({ student, profile }) => {
                if (!profile) return null;
                return <article key={student.no} className="managed-profile-card"><header><span>{student.fullName.charAt(0)}</span><div><small>STT {String(student.no).padStart(2, '0')}</small><h2>{student.fullName}</h2><p>{student.formerSchool}</p></div><em className={`status-pill ${profile.status}`}>{profile.status === 'completed' ? <><CheckCircle2 size={14} /> Đã hoàn thành</> : <><Clock3 size={14} /> Đang cập nhật</>}</em></header><div className="managed-profile-meta"><span><small>Ngày sinh</small><b>{student.birthDate}</b></span><span><small>Dân tộc</small><b>{student.ethnic}</b></span><span><small>Liên hệ gia đình</small><b>{profile.fatherPhone || profile.motherPhone || 'Chưa có'}</b></span></div><footer><button onClick={() => setSelected({ student, profile })}><Eye size={17} /> Xem</button><button className="edit" onClick={() => openEditor(profile)}><Pencil size={17} /> Sửa</button><button onClick={() => copyShareLink(profile)} disabled={!profile.shareToken}><Link2 size={17} /> Liên kết</button><button className="delete" onClick={() => setDeleteTarget(profile)}><Trash2 size={17} /> Xóa</button></footer></article>;
              })}
              {!managedRows.length && <div className="managed-profile-empty"><FileSpreadsheet size={34} /><h2>Chưa có hồ sơ phù hợp</h2><p>Thử thay đổi bộ lọc hoặc tìm kiếm bằng tên học sinh.</p><button onClick={() => { setFilter('all'); setSearch(''); }}>Hiển thị tất cả hồ sơ</button></div>}
            </div>
          </section>

          <section className="teacher-workspace-view" hidden={activeView !== 'settings'}>
            <div className="teacher-heading"><div><p className="eyebrow">CẤU HÌNH LỚP HỌC</p><h1>Thiết lập lớp {className}</h1><span>Quản lý phạm vi lớp, lời mời và tùy chọn thông báo</span></div><div className="heading-actions"><button className="export-action" onClick={savePreferences}><Save size={18} /> Lưu thiết lập</button></div></div>

            <div className="teacher-settings-grid">
              <article className="settings-card assignment-settings"><header><span className="card-icon blue"><ShieldCheck size={20} /></span><div><small>PHÂN CÔNG HIỆN TẠI</small><h2>Thông tin lớp chủ nhiệm</h2></div><em>Đã xác thực</em></header><div className="assignment-detail"><span>{className}</span><div><label>Giáo viên chủ nhiệm<b>{teacherName}</b></label><label>Năm học<b>{schoolYear}</b></label><label>Sĩ số<b>{CLASS_ROSTER.length} học sinh</b></label></div></div><p><ShieldCheck size={16} /> Tài khoản chỉ được truy cập dữ liệu đúng lớp và năm học đã phân công.</p></article>

              <article className="settings-card invitation-settings"><header><span className="card-icon purple"><UserPlus size={20} /></span><div><small>LIÊN KẾT THAM GIA</small><h2>Mời học sinh khai hồ sơ</h2></div></header><p>Gửi liên kết này cùng tài khoản đã cấp cho học sinh lớp {className}. Các em chỉ cần đăng nhập để khai hồ sơ.</p><div className="invitation-link"><code>{siteOrigin || 'Đang lấy địa chỉ website...'}</code><button onClick={copyInvitation}><Copy size={17} /> Sao chép</button></div><small className="settings-hint">Liên kết sử dụng được trên điện thoại và máy tính.</small></article>

              <article className="settings-card notification-settings"><header><span className="card-icon amber"><Bell size={20} /></span><div><small>THÔNG BÁO</small><h2>Tùy chọn theo dõi hồ sơ</h2></div></header><div className="settings-toggle-list"><label><span><b>Hồ sơ hoàn thành</b><small>Thông báo khi học sinh gửi đủ dữ liệu</small></span><button role="switch" aria-checked={preferences.completed} className={preferences.completed ? 'active' : ''} onClick={() => setPreferences((value) => ({ ...value, completed: !value.completed }))}><i /></button></label><label><span><b>Bản nháp mới</b><small>Theo dõi học sinh đang cập nhật hồ sơ</small></span><button role="switch" aria-checked={preferences.drafts} className={preferences.drafts ? 'active' : ''} onClick={() => setPreferences((value) => ({ ...value, drafts: !value.drafts }))}><i /></button></label><label><span><b>Tóm tắt hằng tuần</b><small>Hiển thị nhắc việc theo tiến độ của lớp</small></span><button role="switch" aria-checked={preferences.weekly} className={preferences.weekly ? 'active' : ''} onClick={() => setPreferences((value) => ({ ...value, weekly: !value.weekly }))}><i /></button></label></div></article>

              <article className="settings-card data-settings"><header><span className="card-icon green"><FileSpreadsheet size={20} /></span><div><small>DỮ LIỆU LỚP</small><h2>Sao lưu và xuất dữ liệu</h2></div></header><div className="data-action-list"><button onClick={() => exportClassRosterToExcel(CLASS_ROSTER)}><UsersRound size={19} /><span><b>Xuất danh sách chính thức</b><small>50 học sinh · định dạng Excel</small></span><Download size={17} /></button><button onClick={() => exportProfilesToExcel(profiles)} disabled={!profiles.length}><FileCheck2 size={19} /><span><b>Xuất hồ sơ đã khai</b><small>{profiles.length} hồ sơ đang có trên Firestore</small></span><Download size={17} /></button></div></article>
            </div>
          </section>
        </div>
      </section>

      {selected && (
        <Modal title={`Học sinh ${String(selected.student.no).padStart(2, '0')} · ${selected.student.fullName}`} wide onClose={() => setSelected(null)}>
          <div className="official-record">
            <div className="official-record-head"><span><ShieldCheck size={20} /></span><div><small>THÔNG TIN DANH SÁCH CHÍNH THỨC</small><h3>{selected.student.fullName}</h3><p>Lớp {className} · Năm học {schoolYear}</p></div><b>STT {selected.student.no}</b></div>
            <div className="official-record-grid"><label><span>Giới tính</span><b>{selected.student.gender}</b></label><label><span>Ngày sinh</span><b>{selected.student.birthDate}</b></label><label><span>Dân tộc</span><b>{selected.student.ethnic}</b></label><label className="wide"><span>Trường THCS đã học</span><b>{selected.student.formerSchool}</b></label></div>
          </div>
          {selected.profile ? (
            <>
              <div className="modal-profile-actions teacher-record-actions">
                <button className="edit" onClick={() => openEditor(selected.profile!)}><Pencil size={17} /> Sửa hồ sơ</button>
                <button className="danger" onClick={() => { setDeleteTarget(selected.profile); setSelected(null); }}><Trash2 size={17} /> Xóa hồ sơ</button>
                <button onClick={() => copyShareLink(selected.profile!)} disabled={!selected.profile.shareToken}><Link2 size={17} /> Liên kết phụ huynh</button>
                <button className="primary" onClick={() => exportProfilesToExcel([selected.profile!])}><Download size={17} /> Xuất Excel</button>
              </div>
              <ProfileView profile={selected.profile} />
            </>
          ) : (
            <div className="profile-empty-state"><Clock3 size={28} /><h3>Chưa có hồ sơ trực tuyến</h3><p>Học sinh này có trong danh sách chính thức nhưng chưa đăng nhập hoặc chưa chọn đúng tên trong biểu mẫu.</p></div>
          )}
        </Modal>
      )}

      {editing && (
        <Modal title={`Chỉnh sửa hồ sơ · ${editing.fullName}`} wide onClose={() => !saving && setEditing(null)}>
          <TeacherProfileEditor profile={editing} onChange={changeEditField} />
          <div className="teacher-edit-actions">
            <button type="button" onClick={() => setEditing(null)} disabled={saving}>Hủy</button>
            <button type="button" className="primary" onClick={saveProfile} disabled={saving}><Save size={18} /> {saving ? 'Đang lưu...' : 'Lưu thay đổi'}</button>
          </div>
        </Modal>
      )}

      {deleteTarget && (
        <Modal title="Xác nhận xóa hồ sơ" onClose={() => !saving && setDeleteTarget(null)}>
          <div className="delete-profile-confirm">
            <span><Trash2 size={28} /></span>
            <h3>Xóa hồ sơ của {deleteTarget.fullName}?</h3>
            <p>Hồ sơ trực tuyến và liên kết phụ huynh sẽ bị xóa. Tài khoản học sinh vẫn được giữ để em có thể khai lại.</p>
            <div><button onClick={() => setDeleteTarget(null)} disabled={saving}>Không xóa</button><button className="danger" onClick={deleteProfile} disabled={saving}><Trash2 size={17} /> {saving ? 'Đang xóa...' : 'Xóa hồ sơ'}</button></div>
          </div>
        </Modal>
      )}
    </main>
  );
}
