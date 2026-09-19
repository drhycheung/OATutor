import Tooltip from "@material-ui/core/Tooltip";
import { withStyles } from "@material-ui/core/styles";

export const ProgressTooltip = withStyles((theme) => ({
  tooltip: {
    backgroundColor: "rgba(15, 23, 42, 0.95)",
    color: "#fff",
    padding: 16,
    borderRadius: 6,
    width: 280,
    maxWidth: 280,
    boxSizing: "border-box",
    fontFamily: theme.typography.fontFamily,
    boxShadow: "none",
  },
  arrow: { color: "rgba(15, 23, 42, 0.95)" },
}))(Tooltip);

export const InfoTooltip = withStyles(() => ({
  tooltip: { backgroundColor: "rgba(15, 23, 42, 0.95)", color:"#fff", padding:12, borderRadius:6, maxWidth:240, fontFamily:"Inter, sans-serif", boxShadow:"none" },
  arrow: { color: "rgba(15, 23, 42, 0.95)" },
}))(Tooltip);