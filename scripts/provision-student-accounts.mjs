import process from 'node:process';
import { deleteApp, initializeApp } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { doc, getFirestore, serverTimestamp, setDoc } from 'firebase/firestore';
import { CLASS_ROSTER, studentAccountEmail, studentAccountPassword } from '../lib/class-roster.ts';

try {
  process.loadEnvFile('.env.local');
} catch {
  // Dùng cấu hình project mặc định khi máy không có .env.local.
}

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyCOEdGchrqvbFgafxks4OIR-I7Yw8EufD8',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'xonvccna8.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'xonvccna8',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'xonvccna8.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '1020466597141',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:1020466597141:web:8325e954b3b6c9708aed1c',
};

const app = initializeApp(firebaseConfig, `student-provision-${Date.now()}`);
const auth = getAuth(app);
const db = getFirestore(app);
const results = { created: 0, existing: 0, failed: [] };

for (const student of CLASS_ROSTER) {
  const email = studentAccountEmail(student);
  const password = studentAccountPassword(student);

  try {
    let credential;
    try {
      credential = await createUserWithEmailAndPassword(auth, email, password);
      results.created += 1;
    } catch (error) {
      if (error?.code !== 'auth/email-already-in-use') throw error;
      credential = await signInWithEmailAndPassword(auth, email, password);
      results.existing += 1;
    }

    await updateProfile(credential.user, { displayName: student.fullName });
    await setDoc(doc(db, 'users', credential.user.uid), {
      uid: credential.user.uid,
      email,
      displayName: student.fullName,
      role: 'student',
      rosterNumber: String(student.no),
      className: student.className,
      schoolYear: '2026 - 2027',
      updatedAt: serverTimestamp(),
    }, { merge: true });
    await signOut(auth);
  } catch (error) {
    results.failed.push({ no: student.no, name: student.fullName, code: error?.code || 'unknown' });
  }
}

await deleteApp(app);
console.log(`Hoàn tất: tạo mới ${results.created}, đã tồn tại ${results.existing}, lỗi ${results.failed.length}.`);
if (results.failed.length) {
  for (const item of results.failed) console.error(`STT ${item.no} - ${item.name}: ${item.code}`);
  process.exitCode = 1;
}
