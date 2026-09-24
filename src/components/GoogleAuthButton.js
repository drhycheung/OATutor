import React from "react";
import { Avatar, Button, IconButton, Tooltip, Typography } from "@material-ui/core";
import ExitToAppIcon from "@material-ui/icons/ExitToApp";
import { ThemeContext } from "../config/config.js";

/**
 * Google Sign-in / account control for the top bar. Reads auth state from
 * ThemeContext (wired up in App.js). Renders nothing until auth is ready,
 * so this is invisible when Google auth is disabled for the build.
 */
class GoogleAuthButton extends React.Component {
    static contextType = ThemeContext;

    render() {
        const { authReady, authUser, signInWithGoogle, signOut } = this.context;
        const compact = this.props.compact === true;

        if (!authReady) return null;

        if (!authUser) {
            return (
                <div
                    style={{
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: compact ? "flex-end" : "flex-start",
                        flexWrap: "nowrap",
                        gap: 6,
                        maxWidth: compact ? 110 : 420,
                        minHeight: 32,
                    }}
                >
                    {!compact && (
                        <span
                            style={{
                                fontSize: 11,
                                lineHeight: 1.25,
                                color: "#cbd5e1",
                                whiteSpace: "normal",
                                maxWidth: 210,
                                flexShrink: 0,
                                textAlign: "right",
                            }}
                        >
                            Progress saved locally.<br />Log in to sync across sessions.
                        </span>
                    )}
                    <Button
                        variant="outlined"
                        size="small"
                        onClick={signInWithGoogle}
                        style={{
                            textTransform: "none",
                            borderColor: "#475569",
                            color: "#e2e8f0",
                            fontWeight: 600,
                            whiteSpace: "nowrap",
                            minWidth: compact ? 86 : 170,
                        }}
                    >
                        {compact ? "Log in" : "Log in with Google"}
                    </Button>
                </div>
            );
        }

        return (
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    color: "#cbd5e1",
                    whiteSpace: "nowrap",
                }}
            >
                <Avatar
                    src={authUser.photoURL || undefined}
                    style={{ width: 26, height: 26, backgroundColor: "#0f172a" }}
                />
                {!compact && (
                    <Typography
                        variant="body2"
                        style={{ fontWeight: 600, color: "#cbd5e1", maxWidth: 140 }}
                        noWrap
                        title={authUser.full_name}
                    >
                        {authUser.full_name}
                    </Typography>
                )}
                <Tooltip title="Sign out">
                    <IconButton
                        aria-label="Sign out"
                        size="small"
                        onClick={signOut}
                    >
                        <ExitToAppIcon htmlColor="#344054" style={{ fontSize: 20 }} />
                    </IconButton>
                </Tooltip>
            </div>
        );
    }
}

export default GoogleAuthButton;
