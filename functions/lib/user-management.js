"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminGetUsers = exports.adminBootstrapMaster = exports.adminUpdateUserRole = exports.adminCreateUser = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
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
async function assertAdmin(request) {
    var _a;
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be logged in.');
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
        }
        catch (e) {
            console.warn('Auto-bootstrap admin error:', e);
        }
        return userId;
    }
    const userDoc = await db.collection('users').doc(userId).get();
    const isAdmin = userDoc.exists && ((_a = userDoc.data()) === null || _a === void 0 ? void 0 : _a.role) === 'admin';
    const hasAdminClaim = request.auth.token.admin === true;
    if (!isAdmin && !hasAdminClaim) {
        throw new https_1.HttpsError('permission-denied', 'Only admins can perform this action.');
    }
    return userId;
}
exports.adminCreateUser = (0, https_1.onCall)({ cors: true }, async (request) => {
    await assertAdmin(request);
    const { email, displayName, role, password } = request.data;
    if (!email)
        throw new https_1.HttpsError('invalid-argument', 'Email is required.');
    if (!password)
        throw new https_1.HttpsError('invalid-argument', 'Initial password is required.');
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
        return Object.assign({ success: true, uid: userRecord.uid }, userData);
    }
    catch (error) {
        console.error('Error creating user:', error);
        throw new https_1.HttpsError('internal', error.message || 'Failed to create user.');
    }
});
exports.adminUpdateUserRole = (0, https_1.onCall)({ cors: true }, async (request) => {
    var _a;
    const callerUid = await assertAdmin(request);
    const { targetUserId, newRole } = request.data;
    if (!targetUserId || !newRole)
        throw new https_1.HttpsError('invalid-argument', 'Missing userId or role.');
    if (newRole !== 'admin' && newRole !== 'user')
        throw new https_1.HttpsError('invalid-argument', 'Invalid role.');
    if (targetUserId === callerUid) {
        throw new https_1.HttpsError('failed-precondition', 'You cannot change your own role.');
    }
    const masterEmails = ['sanexcompany@gmail.com', 'orverxi@gmail.com', 'tharushyamagara@gmail.com'];
    const targetUserDoc = await db.collection('users').doc(targetUserId).get();
    if (targetUserDoc.exists && masterEmails.includes((_a = targetUserDoc.data()) === null || _a === void 0 ? void 0 : _a.email)) {
        throw new https_1.HttpsError('permission-denied', 'Cannot modify the master administrator.');
    }
    await db.collection('users').doc(targetUserId).update({ role: newRole });
    await admin.auth().setCustomUserClaims(targetUserId, { admin: newRole === 'admin' });
    return { success: true };
});
exports.adminBootstrapMaster = (0, https_1.onCall)({ cors: true }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Must be logged in.');
    const uid = request.auth.uid;
    const email = request.auth.token.email;
    const masterEmails = ['sanexcompany@gmail.com', 'orverxi@gmail.com', 'tharushyamagara@gmail.com'];
    if (!email || !masterEmails.includes(email)) {
        throw new https_1.HttpsError('permission-denied', 'Email not authorized to bootstrap.');
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
exports.adminGetUsers = (0, https_1.onCall)({ cors: true }, async (request) => {
    await assertAdmin(request);
    const snap = await db.collection('users').get();
    return snap.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
});
//# sourceMappingURL=user-management.js.map