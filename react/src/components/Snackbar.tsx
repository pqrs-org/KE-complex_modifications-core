import { Snackbar as MuiSnackbar } from "@mui/material";
import { useSnackbar } from "../contexts";

export const Snackbar = () => {
  const { text, setText } = useSnackbar();

  return (
    <MuiSnackbar
      open={text !== ""}
      autoHideDuration={3000}
      onClose={(_event, reason) => {
        if (reason === "clickaway") {
          return;
        }

        setText("");
      }}
      message={text}
    />
  );
};
