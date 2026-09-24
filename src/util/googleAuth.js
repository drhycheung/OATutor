import {
    GoogleAuthProvider,
    browserLocalPersistence,
    getAuth,
    onAuthStateChanged,
    setPersistence,
    signInWithPopup,
    signOut as firebaseSignOut,
} from "firebase/auth";

import { getFirebaseApp } from "./firebase";

let _auth = null;

function getAuthOrNull() {
    const app = getFirebaseApp();
    if (!app) return null;
    if (!_auth) {
        _auth = getAuth(app);
        setPersistence(_auth, browserLocalPersistence).catch(() => {});
    }
    return _auth;
}

/**
 * Maps a Firebase `User` into the shape the app already uses for LTI users
 * (`user_id`, `full_name`, `privileged`), so persistence and display logic
 * can treat Google accounts uniformly.
 * @param {object|null} fbUser
 * @return {object|null}
 */
export function mapGoogleUser(fbUser) {
    if (!fbUser) return null;
    return {
        user_id: fbUser.uid,
        full_name: fbUser.displayName || fbUser.email || "Google user",
        email: fbUser.email || null,
        photoURL: fbUser.photoURL || null,
        provider: "google",
        privileged: false,
    };
}

/**
 * Subscribes to auth state changes. Returns an unsubscribe function.
 * @param {(user: object|null) => void} callback receives the mapped Google user
 */
export function subscribeAuth(callback) {
    const auth = getAuthOrNull();
    if (!auth) return () => {};
    return onAuthStateChanged(auth, (fbUser) => {
        callback(mapGoogleUser(fbUser));
    });
}

export async function signInWithGoogle() {
    const auth = getAuthOrNull();
    if (!auth) throw new Error("Firebase is not configured.");
    return signInWithPopup(auth, new GoogleAuthProvider());
}

export async function signOutGoogle() {
    const auth = getAuthOrNull();
    if (!auth) return;
    await firebaseSignOut(auth);
}