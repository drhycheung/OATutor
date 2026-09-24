import localforage from "localforage";
import { PROGRESS_STORAGE_KEY } from "../config/config.js";
import {
    readRemoteProgress,
    removeRemoteKey,
    writeRemoteProgress,
} from "./remoteProgress";

const CANVAS_PROGRESS_KEY_MARKER = "::canvas::";
const GOOGLE_PROGRESS_KEY_MARKER = "::google::";

// Keys not prefixed with PROGRESS_STORAGE_KEY (e.g. meta-lesson paths) that
// should still be scoped/mirrored per owner.
const OTHER_PROGRESS_KEY_PREFIXES = ["meta_lesson_path_"];

class BrowserStorage {
    /**
     * @private
     * @param key
     * @return {*}
     */
    getCtxByKey = (key) => this._app['state']['additionalContext'][key]

    /**
     * @private
     * @return {*}
     */
    noRestore = () => this.getCtxByKey('noRestore')
    /**
     * @private
     */
    _app;

    constructor(app) {
        this._app = app
    }

    isOwnerScopedKey = (key) => {
        if (typeof key !== "string") return false;
        return (
            key.startsWith(PROGRESS_STORAGE_KEY) ||
            OTHER_PROGRESS_KEY_PREFIXES.some((prefix) => key.startsWith(prefix))
        );
    }

    /**
     * @return {string|null} the logged-in Google user's Firebase UID, or null.
     */
    getRemoteOwner = () => {
        const authContext = this._app.state.authContext || {};
        const authUser = authContext.authUser || null;
        return (authUser && authUser.user_id) || null;
    }

    /**
     * Reverses getStorageKey: turns a (possibly owner-suffixed) key stored in
     * localforage back into the logical key used for remote storage.
     * @param {string} key
     * @return {string}
     */
    getLogicalKey = (key) => {
        for (const marker of [GOOGLE_PROGRESS_KEY_MARKER, CANVAS_PROGRESS_KEY_MARKER]) {
            const idx = String(key).indexOf(marker);
            if (idx !== -1) return String(key).slice(0, idx);
        }
        return key;
    }

    getStorageKey = (key) => {
        if (!this.isOwnerScopedKey(key) ||
            key.includes(CANVAS_PROGRESS_KEY_MARKER) ||
            key.includes(GOOGLE_PROGRESS_KEY_MARKER)) {
            return key;
        }

        const authUser =
            (this._app.state.authContext && this._app.state.authContext.authUser) || {};
        if (authUser.user_id) {
            return `${key}${GOOGLE_PROGRESS_KEY_MARKER}${encodeURIComponent(authUser.user_id)}`;
        }

        const user = this._app.state.additionalContext.user || {};
        const isFromCanvas = String(user.tool_consumer_info_product_family_code || "").toLowerCase() === "canvas";
        const canvasProgressOwner = user.lis_result_sourcedid || user.user_id;

        return isFromCanvas && canvasProgressOwner
            ? `${key}${CANVAS_PROGRESS_KEY_MARKER}${encodeURIComponent(canvasProgressOwner)}`
            : key;
    }

    /**
     * Mirrors a write to Firestore. Uses the logical key so the remote schema
     * stays stable regardless of owner suffix. Best-effort: failures are
     * logged and the local cache remains authoritative.
     */
    mirrorRemoteWrite = async (key, value) => {
        const owner = this.getRemoteOwner();
        if (!owner) return;
        // A write of an empty plain object carries no progress (it is a
        // "nothing changed" save from the default bktParams) and must not
        // overwrite the user's cloud-stored entries for this key.
        if (
            value !== null &&
            typeof value === "object" &&
            !Array.isArray(value) &&
            Object.keys(value).length === 0
        ) {
            return;
        }
        await writeRemoteProgress(owner, { [this.getLogicalKey(key)]: value });
    }

    removeByKey = async key => {
        await localforage.removeItem(this.getStorageKey(key));
        await removeRemoteKey(this.getRemoteOwner(), this.getLogicalKey(key));
    }

    getKeys = async () =>  !this.noRestore() && localforage.keys()
    getByKey = async key => !this.noRestore() && localforage.getItem(this.getStorageKey(key))
    /**
     *
     * @param key
     * @param value
     * @param [callback]
     * @return {Promise<*>}
     */
    setByKey = async (key, value, callback) => {
        const storageKey = this.getStorageKey(key);
        console.debug('setting key', storageKey, 'to value', value)
        await localforage.setItem(storageKey, value, callback)
        await this.mirrorRemoteWrite(key, value)
    }

    /**
     * Brings remote progress into the local cache and ensures the remote
     * document exists. Call when a user signs in:
     *  - remote exists: merge remote entries in, but never overwrite a key the
     *    local device already has (the local session wins per key).
     *  - no remote yet: push local progress up as an initial migration.
     * @param {string} owner Firebase auth UID
     */
    ensureRemoteSync = async (owner) => {
        if (!owner) return;

        const isEmptyPlaceholder = (v) =>
            v !== null &&
            typeof v === "object" &&
            (Array.isArray(v) ? v.length === 0 : Object.keys(v).length === 0);

        const remote = await readRemoteProgress(owner);

        if (remote) {
            const entries = Object.entries(remote);
            for (const [logicalKey, value] of entries) {
                const storageKey = this.getStorageKey(logicalKey);
                const existing = await localforage
                    .getItem(storageKey)
                    .catch(() => null);
                // Local wins per key, but an empty placeholder (e.g. a "{}"
                // write that raced ahead of auth) is not real progress, so
                // the cloud copy wins in that case.
                if (
                    existing == null ||
                    (isEmptyPlaceholder(existing) && !isEmptyPlaceholder(value))
                ) {
                    await localforage.setItem(storageKey, value);
                }
            }
            return;
        }

        // Nothing stored remotely yet — migrate local progress up on first sign-in.
        const keys = await localforage.keys().catch(() => []);
        const updates = {};
        for (const key of keys) {
            if (!this.isOwnerScopedKey(key)) continue;
            const value = await localforage.getItem(key).catch(() => null);
            if (value == null) continue;
            updates[this.getLogicalKey(key)] = value;
        }
        if (Object.keys(updates).length > 0) {
            await writeRemoteProgress(owner, updates);
        }
    }
}

export default BrowserStorage