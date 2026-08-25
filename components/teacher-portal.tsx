'use client';

import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { collection, doc, onSnapshot, query, serverTimestamp, where, writeBatch } from 'firebase/firestore';
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
  Pencil,
  Search,
  Save,
  Settings,
  ShieldCheck,
  Trash2,
  UserPlus,
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
          <button><LayoutDashboard size={18} /> Bảng điều khiển</button>
          <button className="active"><UsersRound size={18} /> Danh sách lớp <span>50</span></button>
          <button><BarChart3 size={18} /> Báo cáo lớp</button>
          <p>QUẢN LÝ</p>
          <button><FileSpreadsheet size={18} /> Hồ sơ đã khai <span>{completed + drafts}</span></button>
          <button><Settings size={18} /> Thiết lập lớp</button>
        </nav>
        <div className="teacher-help"><ShieldCheck size={23} /><b>Chỉ quản lý một lớp</b><p>Tài khoản này chỉ được xem và cập nhật hồ sơ học sinh lớp {className}, năm học {schoolYear}.</p></div>
        <button className="sidebar-logout" onClick={onLogout}><LogOut size={18} /> Đăng xuất</button>
      </aside>

      <section className="teacher-main">
        <header className="teacher-topbar">
          <button className="mobile-menu-button" onClick={() => setMobileMenu(true)}><Menu size={22} /></button>
          <div className="global-search"><Search size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm họ tên, trường THCS, dân tộc..." /><kbd>Ctrl K</kbd></div>
          <div className="teacher-account"><button className="notification-button"><Bell size={19} /><i /></button><div className="teacher-avatar">{teacherName.charAt(0)}</div><div><b>{teacherName}</b><small>Giáo viên chủ nhiệm</small></div><ChevronDown size={16} /></div>
        </header>

        <div className="teacher-content">
          <div className="teacher-heading"><div><p className="eyebrow">DANH SÁCH CHÍNH THỨC</p><h1>Học sinh lớp {className}</h1><span>Giáo viên chủ nhiệm: {teacherName} · Năm học {schoolYear}</span></div><div className="heading-actions"><button className="outline-action" onClick={() => { navigator.clipboard.writeText(window.location.origin); setNotice('Đã sao chép liên kết mời học sinh.'); }}><UserPlus size={18} /> Mời học sinh</button><button className="export-action" onClick={() => exportClassRosterToExcel(CLASS_ROSTER)}><Download size={18} /> Xuất danh sách Excel</button></div></div>

          {notice && <div className="dashboard-notice"><Notice type={notice.includes('Chưa') || notice.includes('Không thể') ? 'error' : 'success'}>{notice}</Notice><button onClick={() => setNotice(null)}><X size={16} /></button></div>}

          <div className="stat-grid roster-stats">
            <article><span className="stat-icon blue"><UsersRound /></span><div><small>Tổng số học sinh</small><strong>{CLASS_ROSTER.length}</strong><p>{male} nam · {female} nữ</p></div></article>
            <article><span className="stat-icon green"><CheckCircle2 /></span><div><small>Đã hoàn thành hồ sơ</small><strong>{completed}</strong><p>Đã gửi cho giáo viên</p></div></article>
            <article><span className="stat-icon amber"><Clock3 /></span><div><small>Đang cập nhật</small><strong>{drafts}</strong><p>Đã lưu bản nháp</p></div></article>
            <article><span className="stat-icon purple"><BarChart3 /></span><div><small>Chưa bắt đầu</small><strong>{notStarted}</strong><p>Cần gửi liên kết đăng ký</p></div></article>
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
            <article className="activity-card"><header><h3>Tóm tắt hồ sơ trực tuyến</h3><button>{completed + drafts}/{CLASS_ROSTER.length} tài khoản</button></header><div className="activity-item"><span className="green"><CheckCircle2 size={17} /></span><div><b>{completed} học sinh đã gửi hồ sơ hoàn chỉnh</b><small>Dữ liệu sẵn sàng để xuất mẫu cá nhân</small></div></div><div className="activity-item"><span className="amber"><Clock3 size={17} /></span><div><b>{drafts} học sinh đang lưu bản nháp</b><small>Giáo viên có thể theo dõi tiến độ</small></div></div><div className="activity-item"><span className="amber"><UserPlus size={17} /></span><div><b>{notStarted} học sinh chưa bắt đầu</b><small>Gửi liên kết trang chủ để học sinh đăng ký</small></div></div></article>
            <article className="share-class-card"><div className="share-class-icon"><Clipboard size={25} /></div><div><h3>Mời học sinh điền hồ sơ</h3><p>Học sinh chọn đúng tên trong danh sách 50 em; họ tên, ngày sinh, giới tính, dân tộc và trường THCS sẽ tự động điền.</p><div><code>{siteOrigin || 'Liên kết website'}</code><button onClick={() => { navigator.clipboard.writeText(window.location.origin); setNotice('Đã sao chép liên kết mời học sinh.'); }}><Clipboard size={16} /> Sao chép</button></div></div></article>
          </div>
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
            <div className="profile-empty-state"><Clock3 size={28} /><h3>Chưa có hồ sơ trực tuyến</h3><p>Học sinh này có trong danh sách chính thức nhưng chưa đăng ký hoặc chưa chọn đúng tên trong biểu mẫu.</p></div>
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
