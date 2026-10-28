
import { onCall, HttpsError, CallableRequest } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

const db = admin.firestore();

const MASTER_ADMIN_EMAILS = [
  'tharushyamagara@gmail.com',
  'sanexcompany@gmail.com',
  'orverxi@gmail.com',
];

/**
 * Helper to verify admin privileges.
 * Master root administrators are automatically authorized and self-bootstrapped.
 */
async function assertAdmin(request: CallableRequest) {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be logged in.');
  }
  const userId = request.auth.uid;
  const email = (request.auth.token.email || '').toLowerCase().trim();
  const isMaster = Boolean(email && MASTER_ADMIN_EMAILS.includes(email));

  if (isMaster) {
    try {
      await db.collection('users').doc(userId).set({
        email,
        role: 'admin',
        updatedAt: Date.now()
      }, { merge: true });
      if (!request.auth.token.admin) {
        await admin.auth().setCustomUserClaims(userId, { admin: true });
      }
    } catch (e) {
      console.warn('Auto-bootstrap admin error:', e);
    }
    return userId;
  }

  const userDoc = await db.collection('users').doc(userId).get();
  const isAdmin = userDoc.exists && userDoc.data()?.role === 'admin';
  const hasAdminClaim = request.auth.token.admin === true;
  
  if (!isAdmin && !hasAdminClaim) {
    throw new HttpsError('permission-denied', 'Only admins can perform this action.');
  }
  return userId;
}

export const adminCreateUser = onCall({ cors: true }, async (request: CallableRequest) => {
  await assertAdmin(request);
  const { email, displayName, role, password } = request.data;
  if (!email) throw new HttpsError('invalid-argument', 'Email is required.');
  if (!password) throw new HttpsError('invalid-argument', 'Initial password is required.');

  try {
    // Create the auth user with the provided password.
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: displayName || email.split('@')[0],
    });

    const userData = {
      email,
      displayName: userRecord.displayName,
      role: role === 'admin' ? 'admin' : 'user',
      lastLogin: null,
      createdAt: Date.now()
    };

    // Create firestore doc
    await db.collection('users').doc(userRecord.uid).set(userData);

    // Set custom claims if admin
    if (role === 'admin') {
      await admin.auth().setCustomUserClaims(userRecord.uid, { admin: true });
    }

    return { success: true, uid: userRecord.uid, ...userData };
  } catch (error: any) {
    console.error('Error creating user:', error);
    throw new HttpsError('internal', error.message || 'Failed to create user.');
  }
});

export const adminUpdateUserRole = onCall({ cors: true }, async (request: CallableRequest) => {
  const callerUid = await assertAdmin(request);
  const { targetUserId, newRole } = request.data;
  if (!targetUserId || !newRole) throw new HttpsError('invalid-argument', 'Missing userId or role.');
  if (newRole !== 'admin' && newRole !== 'user') throw new HttpsError('invalid-argument', 'Invalid role.');
  
  if (targetUserId === callerUid) {
    throw new HttpsError('failed-precondition', 'You cannot change your own role.');
  }
  
  const targetUserDoc = await db.collection('users').doc(targetUserId).get();
  const targetEmail = (targetUserDoc.data()?.email || '').toLowerCase().trim();
  if (targetUserDoc.exists && MASTER_ADMIN_EMAILS.includes(targetEmail)) {
    throw new HttpsError('permission-denied', 'Cannot modify the master administrator.');
  }
  
  await db.collection('users').doc(targetUserId).update({ role: newRole });
  await admin.auth().setCustomUserClaims(targetUserId, { admin: newRole === 'admin' });
  return { success: true };
});

export const adminDeleteUser = onCall({ cors: true }, async (request: CallableRequest) => {
  const callerUid = await assertAdmin(request);
  const { targetUserId } = request.data;
  if (!targetUserId) throw new HttpsError('invalid-argument', 'Missing targetUserId.');

  if (targetUserId === callerUid) {
    throw new HttpsError('failed-precondition', 'You cannot delete your own account.');
  }

  const targetUserDoc = await db.collection('users').doc(targetUserId).get();
  const targetEmail = (targetUserDoc.data()?.email || '').toLowerCase().trim();

  if (MASTER_ADMIN_EMAILS.includes(targetEmail)) {
    throw new HttpsError('permission-denied', 'Cannot delete a root master administrator.');
  }

  // 1. Delete from Firebase Authentication
  try {
    await admin.auth().deleteUser(targetUserId);
  } catch (authErr: any) {
    console.warn(`Auth delete warning for ${targetUserId}:`, authErr.message);
  }

  // 2. Delete from Firestore users collection
  await db.collection('users').doc(targetUserId).delete();

  return { success: true };
});

export const adminBootstrapMaster = onCall({ cors: true }, async (request: CallableRequest) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Must be logged in.');
  
  const uid = request.auth.uid;
  const email = (request.auth.token.email || '').toLowerCase().trim();
  
  if (!email || !MASTER_ADMIN_EMAILS.includes(email)) {
    throw new HttpsError('permission-denied', 'Email not authorized to bootstrap.');
  }
  
  await db.collection('users').doc(uid).set({
    email,
    displayName: request.auth.token.name || 'Admin',
    role: 'admin',
    lastLogin: Date.now(),
    isMaster: true
  }, { merge: true });
  
  await admin.auth().setCustomUserClaims(uid, { admin: true });
  return { success: true };
});

export const adminGetUsers = onCall({ cors: true }, async (request: CallableRequest) => {
  await assertAdmin(request);
  const snap = await db.collection('users').get();
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
});
