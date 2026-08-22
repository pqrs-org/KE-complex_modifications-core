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
import { useCodeModal } from "../contexts";

const CodeSyntaxHighlighter = lazy(() => import("./CodeSyntaxHighlighter"));

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

export const CodeModal = () => {
  const codeModalContext = useCodeModal();

  const handleClose = () => {
    codeModalContext.setOpen(false);
  };

  return (
    <>
      <Backdrop
        sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={codeModalContext.fetching}
      >
        <CircularProgress color="inherit" />
      </Backdrop>

      <Modal
        open={codeModalContext.open}
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
            <Box>{codeModalContext.title}</Box>
            <IconButton aria-label="Close code viewer" onClick={handleClose}>
              <CloseIcon />
            </IconButton>
          </Typography>
          <Suspense fallback={<CircularProgress />}>
            <CodeSyntaxHighlighter language={codeModalContext.language}>
              {codeModalContext.source}
            </CodeSyntaxHighlighter>
          </Suspense>
        </Box>
      </Modal>
    </>
  );
};
