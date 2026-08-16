import { Suspense, lazy } from "react";
import {
  Backdrop,
  Box,
  CircularProgress,
  IconButton,
  Modal,
  Typography,
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";
import { useJsonModal } from "../contexts";

const JsonSyntaxHighlighter = lazy(() => import("./JsonSyntaxHighlighter"));

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: "90%",
  bgcolor: "background.paper",
  border: "2px solid #000",
  boxShadow: 24,
  p: 4,
} as const;

export const JsonModal = () => {
  const jsonModalContext = useJsonModal();

  const handleClose = () => {
    jsonModalContext.setOpen(false);
  };

  return (
    <>
      <Backdrop
        sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={jsonModalContext.fetching}
      >
        <CircularProgress color="inherit" />
      </Backdrop>

      <Modal
        open={jsonModalContext.open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
      >
        <Box sx={style}>
          <Typography
            id="modal-modal-title"
            variant="h6"
            component="h2"
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Box> {jsonModalContext.title}</Box>
            <IconButton aria-label="Close JSON viewer" onClick={handleClose}>
              <CloseIcon />
            </IconButton>
          </Typography>
          <Suspense fallback={<CircularProgress />}>
            <JsonSyntaxHighlighter>
              {jsonModalContext.jsonString}
            </JsonSyntaxHighlighter>
          </Suspense>
        </Box>
      </Modal>
    </>
  );
};
