import {
    deleteDoc,
    deleteField,
    doc,
    getDoc,
    getFirestore,
    setDoc,
} from "firebase/firestore";

import { ENABLE_REMOTE_PROGRESS } from "../config/config.js";
import { getFirebaseApp } from "./firebase";

export const PROGRESS_COLLECTION = "users";

function getDb() {
    if (!ENABLE_REMOTE_PROGRESS) return null;
    const app = getFirebaseApp();
    return app ? getFirestore(app) : null;
}

/**
 * Firestore map keys must not contain `.`, `[` or `]`. Progress payloads are
 * plain JSON (numbers, strings, arrays, plain objects) so a shallow-preflight
 * is enough; undefined is dropped to avoid write errors.
 */
function sanitize(value) {
    if (value === undefined) return null;
    if (value === null || typeof value !== "object") return value;
    if (Array.isArray(value)) return value.map(sanitize);
    return Object.fromEntries(
        Object.entries(value).map(([key, val]) => [key, sanitize(val)])
    );
}

/**
 * Reads the stored progress map for a user. Returns null when nothing has
 * been stored yet or the read fails (e.g. rules not deployed / offline).
 * @param {string} owner Firebase auth UID
 * @return {Promise<object|null>} map of logical storage key -> value
 */
export async function readRemoteProgress(owner) {
    if (!owner) return null;
    const db = getDb();
    if (!db) return null;
    try {
        const snap = await getDoc(doc(db, PROGRESS_COLLECTION, owner));
        return snap.exists() ? snap.data()?.progress || null : null;
    } catch (err) {
        console.warn("[remoteProgress] read failed", err);
        return null;
    }
}

/**
 * Merges per-key progress updates into the user's Firestore doc.
 * @param {string} owner Firebase auth UID
 * @param {object} updates map of logical storage key -> value
 */
export async function writeRemoteProgress(owner, updates) {
    if (!owner || !updates || Object.keys(updates).length === 0) return;
    const db = getDb();
    if (!db) return;
    try {
        await setDoc(
            doc(db, PROGRESS_COLLECTION, owner),
            { progress: sanitize(updates) },
            { merge: true }
        );
    } catch (err) {
        console.warn("[remoteProgress] write failed", err);
    }
}

/**
 * Deletes the user's entire stored progress document.
 * @param {string} owner Firebase auth UID
 */
export async function clearRemoteProgress(owner) {
    if (!owner) return;
    const db = getDb();
    if (!db) return;
    try {
        await deleteDoc(doc(db, PROGRESS_COLLECTION, owner));
    } catch (err) {
        console.warn("[remoteProgress] clear failed", err);
    }
}

/**
 * Removes a single logical progress key from the user's stored document.
 * @param {string} owner Firebase auth UID
 * @param {string} logicalKey the storage key stored in the progress map
 */
export async function removeRemoteKey(owner, logicalKey) {
    if (!owner || !logicalKey) return;
    const db = getDb();
    if (!db) return;
    try {
        await setDoc(
            doc(db, PROGRESS_COLLECTION, owner),
            { progress: { [logicalKey]: deleteField() } },
            { merge: true }
        );
    } catch (err) {
        console.warn("[remoteProgress] remove failed", err);
    }
}