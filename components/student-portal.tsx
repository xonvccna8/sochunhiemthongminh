'use client';

import { ChangeEvent, FormEvent, useMemo, useState } from 'react';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { User } from 'firebase/auth';
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BookOpenCheck,
  Check,
  CheckCircle2,
  Clipboard,
  Eye,
  Home,
  Link2,
  LogOut,
  Save,
  School,
  ShieldCheck,
  UserRound,
  UsersRound,
} from 'lucide-react';
import { db } from '@/lib/firebase';
import { CLASS_ROSTER } from '@/lib/class-roster';
import { FIXED_CLASS, FIXED_SCHOOL_YEAR, FIXED_TEACHER, StudentProfile, emptyProfile, profileCompletion, requiredProfileFields } from '@/lib/types';
import { Field, Modal, Notice } from './ui';
import ProfileView from './profile-view';

const steps = [
  { label: 'Thông tin học sinh', short: 'Học sinh', caption: 'Thông tin cá nhân', icon: UserRound },
  { label: 'Gia đình & chính sách', short: 'Gia đình', caption: 'Người thân & chính sách', icon: UsersRound },
  { label: 'Thông tin trường học', short: 'Trường học', caption: 'Quá trình học tập', icon: School },
  { label: 'Kiểm tra & gửi', short: 'Hoàn tất', caption: 'Xác nhận hồ sơ', icon: CheckCircle2 },
];

function SelectYesNo({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return <select value={value} onChange={(e) => onChange(e.target.value)}><option>Không</option><option>Có</option></select>;
}

export default function StudentPortal({ user, initialProfile, onLogout }: { user: User; initialProfile: StudentProfile | null; onLogout: () => void }) {
  const [profile, setProfile] = useState<StudentProfile>(initialProfile || emptyProfile(user.uid, user.email || '', user.displayName || ''));
  const [step, setStep] = useState(initialProfile?.status === 'completed' ? 3 : 0);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const completion = useMemo(() => profileCompletion(profile), [profile]);

  const set = (key: keyof StudentProfile, value: string) => setProfile((current) => ({ ...current, [key]: value }));
  const input = (key: keyof StudentProfile) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => set(key, event.target.value);
  const chooseStudent = (value: string) => {
    const rosterStudent = CLASS_ROSTER.find((item) => String(item.no) === value);
    if (!rosterStudent) {
      setProfile((current) => ({ ...current, rosterNumber: '', formerSchool: '' }));
      return;
    }
    setProfile((current) => ({
      ...current,
      rosterNumber: String(rosterStudent.no),
      fullName: rosterStudent.fullName,
      birthDate: rosterStudent.birthDateISO,
      gender: rosterStudent.gender,
      ethnic: rosterStudent.ethnic,
      formerSchool: rosterStudent.formerSchool,
    }));
  };

  const validate = () => {
    const missing = requiredProfileFields.filter((key) => !String(profile[key] || '').trim());
    if (!missing.length) return true;
    setNotice('Vui lòng điền đủ các mục bắt buộc có dấu * trước khi gửi hồ sơ.');
    setStep(missing.some((key) => ['fatherName', 'fatherPhone', 'motherName', 'motherPhone'].includes(key)) ? 1 : 0);
    return false;
  };

  const persist = async (completed: boolean) => {
    setSaving(true);
    setNotice(null);
    try {
      const token = profile.shareToken || crypto.randomUUID().replaceAll('-', '').slice(0, 24);
      const next: StudentProfile = {
        ...profile,
        ownerId: user.uid,
        email: user.email || profile.email,
        className: FIXED_CLASS,
        schoolYear: FIXED_SCHOOL_YEAR,
        teacherName: FIXED_TEACHER,
        shareToken: token,
        status: completed ? 'completed' : profile.status,
        updatedAt: serverTimestamp(),
      };
      await setDoc(doc(db, 'profiles', user.uid), next, { merge: true });
      if (completed) await setDoc(doc(db, 'publicProfiles', token), { ...next, email: '', publishedAt: serverTimestamp() }, { merge: true });
      setProfile(next);
      setNotice(completed ? 'Hồ sơ đã được gửi thành công và liên kết xem đã sẵn sàng.' : 'Đã lưu bản nháp. Bạn có thể tiếp tục vào lần đăng nhập sau.');
      if (completed) setSubmitted(true);
    } catch {
      setNotice('Chưa thể lưu dữ liệu. Hãy kiểm tra Firestore và kết nối mạng rồi thử lại.');
    } finally {
      setSaving(false);
    }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (step < 3) {
      setStep(step + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (validate()) await persist(true);
  };

  const shareUrl = typeof window !== 'undefined' && profile.shareToken ? `${window.location.origin}/?hoso=${profile.shareToken}` : '';
  const copyLink = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setNotice('Đã sao chép liên kết xem hồ sơ.');
  };

  return (
    <main className="portal-shell">
      <header className="portal-topbar">
        <div className="portal-brand"><span><BookOpenCheck size={21} /></span><div><b>Sổ Chủ Nhiệm</b><small>Cổng thông tin học sinh</small></div></div>
        <div className="portal-context"><i /><div><span>Không gian học sinh</span><b>Hoàn thiện hồ sơ đầu năm</b></div></div>
        <div className="topbar-actions"><span className="class-chip"><School size={15} /> {FIXED_CLASS}<i />{FIXED_SCHOOL_YEAR}</span><button className="user-chip" onClick={onLogout} aria-label="Đăng xuất khỏi tài khoản"><span>{profile.fullName?.charAt(0) || 'H'}</span><b>{profile.fullName || user.displayName || 'Học sinh'}</b><small>Học sinh lớp {FIXED_CLASS}</small><LogOut size={16} /></button></div>
      </header>

      <div className="portal-layout student-layout">
        <aside className="student-sidebar">
          <div className="sidebar-title"><span>Phiếu thông tin điện tử</span><b>Hồ sơ học sinh</b><small>Hoàn thành lần lượt 4 bước dưới đây</small></div>
          <nav className="step-nav">
            {steps.map((item, index) => {
              const Icon = item.icon;
              return <button key={item.label} data-step={index} className={`${step === index ? 'active' : ''} ${step > index || profile.status === 'completed' ? 'done' : ''}`} onClick={() => setStep(index)}><span className="step-number">{step > index || profile.status === 'completed' ? <Check size={15} /> : index + 1}</span><Icon size={19} /><span><b>{item.short}</b><small>{item.caption}</small></span></button>;
            })}
          </nav>
          <div className="completion-card">
            <div className="completion-summary"><div className="completion-ring" style={{ background: `conic-gradient(#2fb67d ${completion * 3.6}deg, #e4eaf2 0deg)` }}><span>{completion}%</span></div><div><span>Tiến độ hồ sơ</span><b>{completion === 100 ? 'Sẵn sàng gửi' : 'Đang hoàn thiện'}</b></div></div>
            <div className="progress"><i style={{ width: `${completion}%` }} /></div><p>{completion === 100 ? 'Bạn đã điền đủ thông tin bắt buộc.' : 'Hoàn thiện các mục có dấu * để gửi hồ sơ.'}</p>
          </div>
          <div className="sidebar-adviser"><span>{FIXED_TEACHER.split(' ').map((word) => word.charAt(0)).slice(-2).join('')}</span><div><small>Giáo viên chủ nhiệm</small><b>{FIXED_TEACHER}</b></div><BadgeCheck size={18} /></div>
          <div className="security-card"><ShieldCheck size={20} /><div><b>Thông tin được bảo mật</b><p>Chỉ bạn, phụ huynh có liên kết và giáo viên được phân quyền mới có thể xem.</p></div></div>
        </aside>

        <section className={`form-surface step-theme-${step}`}>
          <div className="form-surface-head"><div><span>HỒ SƠ ĐIỆN TỬ · {FIXED_CLASS}</span><h2>Thông tin đầu năm học</h2><p>Mọi thay đổi đều có thể lưu lại và tiếp tục sau.</p></div><div className="surface-status"><BadgeCheck size={20} /><span><b>Dữ liệu chính thức</b><small>Đối chiếu theo danh sách nhà trường</small></span></div></div>
          <div className="mobile-stepbar">
            <div className="mobile-stepbar-head"><span>BƯỚC {String(step + 1).padStart(2, '0')} / {String(steps.length).padStart(2, '0')}</span><em>{completion}% hồ sơ</em></div>
            <b>{steps[step].label}</b>
            <nav className="mobile-step-dots" aria-label="Các bước hoàn thiện hồ sơ">
              {steps.map((item, index) => <button key={item.short} type="button" className={`${step === index ? 'active' : ''} ${step > index || profile.status === 'completed' ? 'done' : ''}`} onClick={() => setStep(index)} aria-label={`Bước ${index + 1}: ${item.label}`}><span>{step > index || profile.status === 'completed' ? <Check size={13} /> : index + 1}</span><small>{item.short}</small></button>)}
            </nav>
            <div className="progress"><i style={{ width: `${((step + 1) / steps.length) * 100}%` }} /></div>
          </div>
          <form onSubmit={submit}>
            {step === 0 && (
              <div className="form-page">
                <div className="form-heading"><span><UserRound size={20} /></span><div><p>BƯỚC 01</p><h1>Thông tin học sinh</h1><small>Cung cấp thông tin cá nhân và địa chỉ liên lạc hiện tại.</small></div></div>
                <div className="fixed-info"><div><School size={20} /><span><small>Học sinh lớp</small><b>{FIXED_CLASS}</b></span></div><div><Home size={20} /><span><small>Năm học</small><b>{FIXED_SCHOOL_YEAR}</b></span></div><p><ShieldCheck size={15} /> Các thông số này được giáo viên thiết lập cố định.</p></div>
                <div className="form-grid">
                  <Field label="Chọn học sinh trong danh sách lớp 10C3" required className="span-2" hint="Thông tin chính thức sẽ được điền tự động từ danh sách nhà trường."><select value={profile.rosterNumber} onChange={(event) => chooseStudent(event.target.value)}><option value="">— Chọn đúng họ và tên của em —</option>{CLASS_ROSTER.map((item) => <option key={item.no} value={item.no}>{String(item.no).padStart(2, '0')}. {item.fullName}</option>)}</select></Field>
                  <Field label="Họ và tên" required className="span-2"><input value={profile.fullName} disabled placeholder="Chọn học sinh ở danh sách phía trên" /></Field>
                  <Field label="Ngày sinh" required><input type="date" value={profile.birthDate} disabled /></Field>
                  <Field label="Giới tính" required><input value={profile.gender} disabled /></Field>
                  <Field label="Dân tộc" required><input value={profile.ethnic} disabled /></Field>
                  <Field label="Trường THCS đã học" className="span-2"><input value={profile.formerSchool} disabled /></Field>
                  <Field label="Nơi sinh" required><input value={profile.birthPlace} onChange={input('birthPlace')} placeholder="Tỉnh/Thành phố" /></Field>
                  <Field label="Hộ khẩu thường trú" required className="span-2"><textarea rows={2} value={profile.householdRegistration} onChange={input('householdRegistration')} placeholder="Số nhà, đường/thôn, xã/phường, tỉnh/thành" /></Field>
                  <Field label="Địa chỉ liên lạc hiện tại" required className="span-2"><textarea rows={2} value={profile.currentAddress} onChange={input('currentAddress')} placeholder="Địa chỉ đang sinh sống" /></Field>
                  <Field label="Đoàn viên"><SelectYesNo value={profile.youthUnion} onChange={(value) => set('youthUnion', value)} /></Field>
                  <Field label="Đội viên"><SelectYesNo value={profile.youngPioneers} onChange={(value) => set('youngPioneers', value)} /></Field>
                  <Field label="Diện học sinh" className="span-2"><input value={profile.studentCategory} onChange={input('studentCategory')} placeholder="Ví dụ: Không, khuyết tật, dân tộc nội trú..." /></Field>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="form-page">
                <div className="form-heading"><span><UsersRound size={20} /></span><div><p>BƯỚC 02</p><h1>Gia đình &amp; chính sách</h1><small>Thông tin người thân và các diện chính sách liên quan.</small></div></div>
                <h3 className="form-subheading">Thông tin cha</h3>
                <div className="form-grid">
                  <Field label="Họ tên cha" required><input value={profile.fatherName} onChange={input('fatherName')} /></Field>
                  <Field label="Nghề nghiệp cha"><input value={profile.fatherOccupation} onChange={input('fatherOccupation')} /></Field>
                  <Field label="Số điện thoại" required><input type="tel" value={profile.fatherPhone} onChange={input('fatherPhone')} placeholder="0xxx xxx xxx" /></Field>
                  <Field label="Số Zalo"><input type="tel" value={profile.fatherZalo} onChange={input('fatherZalo')} /></Field>
                </div>
                <h3 className="form-subheading">Thông tin mẹ</h3>
                <div className="form-grid">
                  <Field label="Họ tên mẹ" required><input value={profile.motherName} onChange={input('motherName')} /></Field>
                  <Field label="Nghề nghiệp mẹ"><input value={profile.motherOccupation} onChange={input('motherOccupation')} /></Field>
                  <Field label="Số điện thoại" required><input type="tel" value={profile.motherPhone} onChange={input('motherPhone')} placeholder="0xxx xxx xxx" /></Field>
                  <Field label="Số Zalo"><input type="tel" value={profile.motherZalo} onChange={input('motherZalo')} /></Field>
                </div>
                <h3 className="form-subheading">Diện chính sách</h3>
                <div className="form-grid">
                  <Field label="Con liệt sĩ"><SelectYesNo value={profile.martyrChild} onChange={(value) => set('martyrChild', value)} /></Field>
                  <Field label="Con hộ cận nghèo"><SelectYesNo value={profile.nearPoorHousehold} onChange={(value) => set('nearPoorHousehold', value)} /></Field>
                  <Field label="Con hộ nghèo"><SelectYesNo value={profile.poorHousehold} onChange={(value) => set('poorHousehold', value)} /></Field>
                  <Field label="Sổ hộ nghèo"><input value={profile.poorHouseholdNumber} onChange={input('poorHouseholdNumber')} disabled={profile.poorHousehold !== 'Có'} /></Field>
                  <Field label="Con thương binh, bệnh binh" className="span-2" hint="Ghi rõ thương binh/bệnh binh, hạng và tỷ lệ thương tật (nếu có)."><input value={profile.woundedSoldierChild} onChange={input('woundedSoldierChild')} /></Field>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="form-page">
                <div className="form-heading"><span><School size={20} /></span><div><p>BƯỚC 03</p><h1>Thông tin trường học</h1><small>Lịch sử nhập trường, khen thưởng và kỷ luật.</small></div></div>
                <div className="form-grid">
                  <Field label="Khen thưởng" className="span-2"><textarea rows={3} value={profile.reward} onChange={input('reward')} placeholder="Ghi các thành tích, danh hiệu hoặc để trống" /></Field>
                  <Field label="Kỷ luật" className="span-2"><textarea rows={3} value={profile.discipline} onChange={input('discipline')} placeholder="Ghi hình thức kỷ luật hoặc để trống" /></Field>
                  <Field label="Ngày nhập trường"><input type="date" value={profile.entryDate} onChange={input('entryDate')} /></Field>
                  <Field label="Ngày ra trường"><input type="date" value={profile.exitDate} onChange={input('exitDate')} /></Field>
                  <Field label="Lý do nhập trường" className="span-2"><textarea rows={2} value={profile.entryReason} onChange={input('entryReason')} placeholder="Tuyển mới, chuyển trường..." /></Field>
                  <Field label="Giáo viên chủ nhiệm" className="span-2" hint="Thông tin cố định do nhà trường thiết lập."><input value={FIXED_TEACHER} disabled /></Field>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="form-page review-page">
                <div className="form-heading"><span><CheckCircle2 size={20} /></span><div><p>BƯỚC 04</p><h1>Kiểm tra &amp; gửi hồ sơ</h1><small>Xem lại thông tin trước khi gửi cho giáo viên chủ nhiệm.</small></div></div>
                {submitted || profile.status === 'completed' ? (
                  <div className="success-panel">
                    <div className="success-icon"><CheckCircle2 size={36} /></div>
                    <h2>Hồ sơ đã sẵn sàng</h2>
                    <p>Thông tin đã được cập nhật cho giáo viên. Bạn có thể gửi liên kết riêng dưới đây cho phụ huynh xem ngay.</p>
                    <div className="share-box"><Link2 size={18} /><input readOnly value={shareUrl || 'Liên kết được tạo sau khi lưu'} /><button type="button" onClick={copyLink}><Clipboard size={17} /> Sao chép</button></div>
                    <button type="button" className="secondary-button" onClick={() => setShowPreview(true)}><Eye size={17} /> Xem trang phụ huynh</button>
                  </div>
                ) : (
                  <>
                    <div className="review-summary">
                      <div className="review-score"><strong>{completion}%</strong><span>mức độ hoàn thành</span></div>
                      <div><h3>{profile.fullName || 'Chưa nhập họ tên'}</h3><p>Lớp {FIXED_CLASS} · {FIXED_SCHOOL_YEAR}</p><small>{completion === 100 ? 'Hồ sơ đã đủ các mục bắt buộc.' : 'Còn thiếu một số mục bắt buộc.'}</small></div>
                      <button type="button" onClick={() => setShowPreview(true)}><Eye size={17} /> Xem toàn bộ</button>
                    </div>
                    <div className="consent-box"><input id="consent" type="checkbox" required /><label htmlFor="consent"><b>Tôi xác nhận thông tin trên là chính xác.</b><span>Tôi đồng ý gửi hồ sơ đến giáo viên chủ nhiệm và tạo liên kết riêng để phụ huynh theo dõi.</span></label></div>
                  </>
                )}
              </div>
            )}

            {notice && <Notice type={notice.includes('Chưa thể') || notice.includes('Vui lòng') ? 'error' : 'success'}>{notice}</Notice>}
            <div className="form-actions">
              <div>{step > 0 && <button type="button" className="secondary-button" onClick={() => setStep(step - 1)}><ArrowLeft size={17} /> Quay lại</button>}</div>
              <div className="action-right"><button type="button" className="save-button" onClick={() => persist(false)} disabled={saving}><Save size={17} /> {saving ? 'Đang lưu...' : 'Lưu bản nháp'}</button>{!(submitted || profile.status === 'completed') && <button type="submit" className="primary-button" disabled={saving}>{step === 3 ? 'Xác nhận & gửi' : 'Tiếp tục'} <ArrowRight size={17} /></button>}</div>
            </div>
          </form>
        </section>
      </div>

      {showPreview && <Modal title="Xem trước hồ sơ" wide onClose={() => setShowPreview(false)}><ProfileView profile={profile} /></Modal>}
    </main>
  );
}
