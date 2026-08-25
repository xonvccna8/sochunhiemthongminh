'use client';

import { CalendarDays, Home, Phone, School, ShieldCheck, UserRound, UsersRound } from 'lucide-react';
import { StudentProfile } from '@/lib/types';

function Item({ label, value }: { label: string; value?: string }) {
  return <div className="profile-item"><span>{label}</span><b>{value || '—'}</b></div>;
}

export default function ProfileView({ profile, publicMode = false }: { profile: StudentProfile; publicMode?: boolean }) {
  return (
    <div className={`profile-view ${publicMode ? 'public-mode' : ''}`}>
      <div className="profile-hero">
        <div className="student-avatar">{profile.fullName?.trim().charAt(0).toUpperCase() || 'H'}</div>
        <div>
          <span className="profile-status"><ShieldCheck size={14} /> Hồ sơ đã xác nhận</span>
          <h1>{profile.fullName || 'Học sinh lớp 10C3'}</h1>
          <p><School size={16} /> Lớp {profile.className} · Năm học {profile.schoolYear}</p>
        </div>
      </div>

      <section className="profile-section">
        <h3><UserRound size={19} /> Thông tin học sinh</h3>
        <div className="profile-grid three">
          <Item label="Ngày sinh" value={profile.birthDate} />
          <Item label="Giới tính" value={profile.gender} />
          <Item label="Dân tộc" value={profile.ethnic} />
          <Item label="Nơi sinh" value={profile.birthPlace} />
          <Item label="Đoàn viên" value={profile.youthUnion} />
          <Item label="Đội viên" value={profile.youngPioneers} />
        </div>
      </section>

      <section className="profile-section">
        <h3><Home size={19} /> Nơi ở và liên hệ</h3>
        <div className="profile-grid">
          <Item label="Hộ khẩu thường trú" value={profile.householdRegistration} />
          <Item label="Địa chỉ liên lạc" value={profile.currentAddress} />
        </div>
      </section>

      <section className="profile-section">
        <h3><UsersRound size={19} /> Thông tin gia đình</h3>
        <div className="parent-cards">
          <article>
            <span>Thông tin cha</span>
            <h4>{profile.fatherName || 'Chưa cập nhật'}</h4>
            <p>{profile.fatherOccupation || 'Chưa cập nhật nghề nghiệp'}</p>
            <p><Phone size={15} /> {profile.fatherPhone || 'Chưa cập nhật'}</p>
          </article>
          <article>
            <span>Thông tin mẹ</span>
            <h4>{profile.motherName || 'Chưa cập nhật'}</h4>
            <p>{profile.motherOccupation || 'Chưa cập nhật nghề nghiệp'}</p>
            <p><Phone size={15} /> {profile.motherPhone || 'Chưa cập nhật'}</p>
          </article>
        </div>
      </section>

      <section className="profile-section">
        <h3><ShieldCheck size={19} /> Diện chính sách</h3>
        <div className="profile-grid three">
          <Item label="Con liệt sĩ" value={profile.martyrChild} />
          <Item label="Con thương binh, bệnh binh" value={profile.woundedSoldierChild} />
          <Item label="Hộ cận nghèo" value={profile.nearPoorHousehold} />
          <Item label="Hộ nghèo" value={profile.poorHousehold} />
          <Item label="Sổ hộ nghèo" value={profile.poorHouseholdNumber} />
          <Item label="Diện học sinh" value={profile.studentCategory} />
        </div>
      </section>

      <section className="profile-section compact">
        <h3><CalendarDays size={19} /> Thông tin trường học</h3>
        <div className="profile-grid three">
          <Item label="Ngày nhập trường" value={profile.entryDate} />
          <Item label="Ngày ra trường" value={profile.exitDate} />
          <Item label="Giáo viên chủ nhiệm" value={profile.teacherName} />
        </div>
      </section>
    </div>
  );
}
