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
                <div style={{ display: "flex", flexDirection: "column", alignItems: compact ? "flex-end" : "flex-start" }}>
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
                        }}
                    >
                        {compact ? "Log in" : "Log in with Google"}
                    </Button>
                    {!compact && (
                        <div
                            style={{
                                marginTop: 6,
                                maxWidth: 260,
                                fontSize: 12,
                                lineHeight: 1.3,
                                color: "#94a3b8",
                                textAlign: "left",
                            }}
                        >
                            If you do not log in, your progress is saved only on this device and may be lost when you close your browser.
                        </div>
                    )}
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
