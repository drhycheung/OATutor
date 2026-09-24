import { getApp, getApps, initializeApp } from "firebase/app";

let firebaseApp = null;

/**
 * Returns true when the config still has placeholder values (or is empty),
 * i.e. Firebase is not really configured for this build yet.
 * @param {object|null} credentials
 * @return {boolean}
 */
export function isPlaceholderFirebaseConfig(credentials) {
    const projectId = credentials?.projectId || "";
    const apiKey = credentials?.apiKey || "";
    return (
        projectId.includes("[projId]") ||
        apiKey.includes("[apikey]") ||
        !projectId ||
        !apiKey
    );
}

/**
 * Initialises (lazily, once) and returns the shared Firebase app when the
 * config is real. Returns null when Firebase is not configured, so callers
 * can degrade gracefully to local-only behaviour.
 * @param {object|null} credentials
 * @return {object|null}
 */
export function initializeFirebaseApp(credentials) {
    if (firebaseApp) return firebaseApp;
    if (!credentials || isPlaceholderFirebaseConfig(credentials)) return null;
    firebaseApp = getApps().length ? getApp() : initializeApp(credentials);
    return firebaseApp;
}

/**
 * @return {object|null} the initialised Firebase app, or null.
 */
export function getFirebaseApp() {
    return firebaseApp;
}