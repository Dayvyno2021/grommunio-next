import { brown } from "@mui/material/colors";
import grey from "../colors/grey";
import defaultStyles from "./defaultStyles";

const brownTheme = mode => ({
  components: {
    ...defaultStyles(mode),
    MuiToolbar: {
      styleOverrides: {
        root: {
          backgroundImage: `linear-gradient(150deg, ${brown['500']}, ${brown['800']})`,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        colorPrimary: {
          backgroundColor: mode === 'light' ? '#fff' : brown[600],
          color: mode === 'light' ? '#333' : '#fff',
          boxShadow: '0px 5px 5px -3px rgba(0, 0, 0, 0.06),0px 8px 10px 1px rgba(0, 0, 0, 0.042),0px 3px 14px 2px rgba(0, 0, 0, 0.036)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        colorError: {
          color: '#000',
        },
        colorPrimary: {
          backgroundColor: brown['300'],
          color: '#000',
        },
      },
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          '&.Mui-selected': {
            background: `linear-gradient(150deg, ${brown['500']}, ${brown['800']})`,
            color: '#fff',
          },
        },
      },
    },
  },
  typography: {
    h1: {
      color: mode === 'light' ? '#333' : '#fff',
      fontSize: '2em',
      fontWeight: 'bold',
    },
    h2: {
      color: mode === 'light' ? '#333' : '#fff',
      fontSize: '1.5em',
      fontWeight: 'bold',
    },
    caption: {
      color: mode === 'light' ? '#000' : '#fff',
    },
  },
  palette: {
    mode: mode,
    primary: brown,
    secondary: grey,
    ...(mode === 'light' ?
      {
        text: {
          primary: mode === 'light' ? '#000' : '#fff',
        },
      } :
      {
        background: {
          paper: "#121315",
        }
      }),
  },
});

export default brownTheme;