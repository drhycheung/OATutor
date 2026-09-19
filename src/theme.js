import {createTheme, responsiveFontSizes} from '@material-ui/core/styles';

const SLATE_100 = '#f1f5f9';
const SLATE_200 = '#e2e8f0';
const SLATE_300 = '#cbd5e1';
const SLATE_400 = '#94a3b8';
const SLATE_500 = '#64748b';
const SLATE_700 = '#334155';
const SLATE_900 = '#0f172a';
const GLASS = 'rgba(30, 41, 59, 0.85)';
const GLASS_BORDER = 'rgba(71, 85, 105, 0.55)';

let theme = createTheme({
  palette: {
    type: 'dark',
    primary: {
      main: '#3b82f6',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#f59e0b',
    },
    success: {
      main: '#10b981',
    },
    error: {
      main: '#ef4444',
    },
    background: {
      default: SLATE_900,
      paper: GLASS,
    },
    text: {
      primary: SLATE_200,
      secondary: SLATE_400,
    },
    divider: 'rgba(148, 163, 184, 0.2)',
    action: {
      hover: 'rgba(59, 130, 246, 0.08)',
      selected: 'rgba(59, 130, 246, 0.16)',
      disabled: 'rgba(148, 163, 184, 0.35)',
    },
  },
  typography: {
    fontFamily: "'Inter', 'Titillium Web', Roboto, sans-serif",
    h1: {
      fontWeight: 700,
      fontSize: '3rem',
    },
    body1: {
      fontSize: '1rem',
    },
  },

  props: {
    MuiButton: {
      variant: 'contained',
      color: 'primary',
    },
  },

  overrides: {
    MuiButton: {
      root: {
        height: 42,
        padding: '8px 22px',
        fontFamily: 'Inter',
        fontSize: '15px',
        lineHeight: '26px',
        fontWeight: 600,
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.3)',
        textTransform: 'none',
      },
      containedPrimary: {
        backgroundColor: '#3b82f6',
        color: '#fff',
        '&:hover': {
          backgroundColor: '#2563eb',
        },
        '&:active': {
          backgroundColor: '#3b82f6',
          border: '1px solid #1d4ed8',
        },
        '&:disabled': {
          backgroundColor: 'rgba(148, 163, 184, 0.2)',
          color: SLATE_500,
          boxShadow: 'none',
        },
      },
      containedSecondary: {
        backgroundColor: GLASS,
        border: `1px solid ${SLATE_700}`,
        color: SLATE_300,
        boxShadow: 'none',
        '&:hover': {
          backgroundColor: SLATE_700,
          boxShadow: 'none',
        },
        '&.active': {
          backgroundColor: 'rgba(59, 130, 246, 0.16)',
          boxShadow: 'none',
        },
        '&:disabled': {
          backgroundColor: 'rgba(0, 0, 0, 0.15)',
          color: 'rgba(226, 232, 240, 0.38)',
          boxShadow: 'none',
        }
      },
    },

    MuiPaper: {
      root: {
        backgroundColor: GLASS,
        backgroundImage: 'none',
      },
      rounded: {
        borderRadius: 16,
      },
      outlined: {
        border: `1px solid ${GLASS_BORDER}`,
      },
      elevation1: {
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
      },
    },

    MuiAppBar: {
      root: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        backgroundImage: 'none',
        boxShadow: 'none',
        borderBottom: '1px solid rgba(71, 85, 105, 0.5)',
      },
      colorPrimary: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
      },
    },

    MuiToolbar: {
      root: {
        minHeight: 56,
      },
    },

    MuiDivider: {
      root: {
        backgroundColor: 'rgba(148, 163, 184, 0.18)',
      },
    },

    MuiLinearProgress: {
      root: {
        backgroundColor: 'rgba(148, 163, 184, 0.18)',
        height: 8,
        borderRadius: 4,
      },
      barColorPrimary: {
        backgroundColor: '#3b82f6',
      },
    },

    MuiInputBase: {
      root: {
        color: SLATE_100,
      },
    },

    MuiOutlinedInput: {
      root: {
        '& $notchedOutline': {
          borderColor: 'rgba(148, 163, 184, 0.4)',
        },
        '&:hover:not($disabled):not($focused):not($error) $notchedOutline': {
          borderColor: 'rgba(148, 163, 184, 0.6)',
        },
      },
    },

    MuiInputLabel: {
      root: {
        color: SLATE_400,
      },
    },

    MuiChip: {
      root: {
        backgroundColor: SLATE_700,
        color: SLATE_200,
      },
    },

    MuiTooltip: {
      tooltip: {
        backgroundColor: SLATE_900,
        color: SLATE_200,
        border: `1px solid ${GLASS_BORDER}`,
        fontSize: 12,
      },
    },

    MuiDialog: {
      paper: {
        backgroundColor: GLASS,
        backgroundImage: 'none',
      },
    },

    MuiMenu: {
      paper: {
        backgroundColor: GLASS,
        backgroundImage: 'none',
      },
    },

    MuiListSubheader: {
      root: {
        backgroundColor: GLASS,
        color: SLATE_300,
      },
    },

    MuiListItem: {
      root: {
        '&:hover': {
          backgroundColor: 'rgba(148, 163, 184, 0.08)',
        },
      },
    },
  }
});

theme = responsiveFontSizes(theme);
export {theme};