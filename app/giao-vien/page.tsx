'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { LockKeyhole } from 'lucide-react';
import TeacherPortal from '@/components/teacher-portal';
import { Spinner } from '@/components/ui';
import { auth, db } from '@/lib/firebase';
import { FIXED_CLASS, FIXED_SCHOOL_YEAR, FIXED_TEACHER, UserRecord } from '@/lib/types';

export default function TeacherPage() {
  const router = useRouter();
  const [record, setRecord] = useState<UserRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.replace('/');
        return;
      }

      try {
        const snapshot = await getDoc(doc(db, 'users', currentUser.uid));
        const nextRecord = snapshot.exists() ? snapshot.data() as UserRecord : null;
        if (!nextRecord || nextRecord.role !== 'teacher') {
          setDenied(true);
          setLoading(false);
          return;
        }
        setRecord(nextRecord);
      } finally {
        setLoading(false);
      }
    });
    return unsubscribe;
  }, [router]);

  const logout = async () => {
    await signOut(auth);
    router.replace('/');
  };

  if (loading) return <Spinner label="Đang xác minh quyền giáo viên..." />;

  if (denied || !record) {
    return (
      <main className="teacher-access-denied">
        <span><LockKeyhole size={30} /></span>
        <h1>Khu vực dành riêng cho giáo viên</h1>
        <p>Tài khoản hiện tại không được phân quyền quản lý lớp học.</p>
        <button onClick={() => router.replace('/')}>Quay về trang chính</button>
      </main>
    );
  }

  return (
    <TeacherPortal
      teacherName={record.displayName || FIXED_TEACHER}
      className={record.className || FIXED_CLASS}
      schoolYear={record.schoolYear || FIXED_SCHOOL_YEAR}
      onLogout={logout}
    />
  );
}
