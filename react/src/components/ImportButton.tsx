import {
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import {
  Button,
  ButtonGroup,
  ClickAwayListener,
  Divider,
  Grow,
  Paper,
  MenuList,
  MenuItem,
  Popper,
} from "@mui/material";
import {
  ArrowDropDown as ArrowDropDownIcon,
  Code as CodeIcon,
  ContentCopy as ContentCopyIcon,
  Launch as LaunchIcon,
} from "@mui/icons-material";
import { useJsonModal, useSnackbar } from "../contexts";
import { KarabinerJsonFile } from "../models";
import { toAbsoluteUrl } from "../utils/url";
import { Base64 } from "js-base64";

export const ImportButton = ({ jsonFile }: { jsonFile: KarabinerJsonFile }) => {
  const jsonModal = useJsonModal();
  const { setText: setSnackbarText } = useSnackbar();
  const menuId = useId();

  //
  // Menu
  //

  const [menuOpen, setMenuOpen] = useState(false);
  const [anchorElement, setAnchorElement] = useState<HTMLDivElement | null>(
    null,
  );
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  const closeMenu = (restoreFocus = false) => {
    setMenuOpen(false);
    if (restoreFocus) {
      requestAnimationFrame(() => menuButtonRef.current?.focus());
    }
  };

  const handleMenuToggle = () => {
    setMenuOpen((prevOpen) => !prevOpen);
  };

  const handleMenuClose = (event: Event) => {
    if (anchorElement?.contains(event.target as HTMLElement)) {
      return;
    }

    closeMenu();
  };

  const handleMenuKeyDown = (event: ReactKeyboardEvent) => {
    if (event.key === "Tab") {
      event.preventDefault();
      closeMenu(true);
    } else if (event.key === "Escape") {
      closeMenu(true);
    }
  };

  const importJson = () => {
    const url = encodeURIComponent(toAbsoluteUrl(jsonFile.jsonUrl));
    window.location.href = `karabiner://karabiner/assets/complex_modifications/import?url=${url}`;
  };

  const copyUrl = async (url: string) => {
    const absoluteUrl = toAbsoluteUrl(url);

    try {
      if (navigator.clipboard === undefined) {
        throw new Error("Clipboard API is not available");
      }
      await navigator.clipboard.writeText(absoluteUrl);
      setSnackbarText(`You just copied: ${absoluteUrl}`);
    } catch (error) {
      console.error(error);
      setSnackbarText(`ERROR: Failed to copy: ${absoluteUrl}`);
    }
  };

  const openEditor = async () => {
    const editorWindow = window.open("about:blank", "_blank");
    if (editorWindow === null) {
      setSnackbarText("ERROR: The editor window was blocked");
      return;
    }
    editorWindow.opener = null;

    try {
      const response = await fetch(jsonFile.jsonUrl);
      if (!response.ok) {
        throw new Error(
          `Fetch failed: ${response.status} ${response.statusText}`,
        );
      }
      const json: unknown = await response.json();
      const base64string = Base64.encode(JSON.stringify(json));
      const url = `https://genesy.github.io/karabiner-complex-rules-generator/#${base64string}`;
      editorWindow.location.replace(url);
    } catch (error) {
      editorWindow.close();
      console.error(error);
      setSnackbarText("ERROR: Failed to open editor");
    }
  };

  return (
    <>
      <ButtonGroup variant="contained" ref={setAnchorElement}>
        <Button
          size="small"
          sx={{ textTransform: "none" }}
          onClick={(event) => {
            event.stopPropagation();
            importJson();
          }}
        >
          Import
        </Button>

        <Button
          ref={menuButtonRef}
          size="small"
          aria-label="Open import menu"
          aria-controls={menuOpen ? menuId : undefined}
          aria-expanded={menuOpen}
          aria-haspopup="menu"
          onClick={(event) => {
            event.stopPropagation();
            handleMenuToggle();
          }}
        >
          <ArrowDropDownIcon />
        </Button>
      </ButtonGroup>

      <Popper
        open={menuOpen}
        anchorEl={anchorElement}
        transition
        style={{ zIndex: 910 }}
      >
        {({ TransitionProps, placement }) => (
          <Grow
            {...TransitionProps}
            style={{
              transformOrigin:
                placement === "bottom" ? "center top" : "center bottom",
            }}
          >
            <Paper>
              <ClickAwayListener onClickAway={handleMenuClose}>
                <MenuList
                  id={menuId}
                  autoFocusItem={menuOpen}
                  onKeyDown={handleMenuKeyDown}
                >
                  <MenuItem
                    onClick={(event) => {
                      event.stopPropagation();
                      importJson();
                      closeMenu(true);
                    }}
                  >
                    Import to Karabiner-Elements
                  </MenuItem>
                  <Divider />

                  <MenuItem
                    onClick={(event) => {
                      event.stopPropagation();
                      void jsonModal.openModal(
                        jsonFile.object.json?.title ?? "",
                        jsonFile.jsonUrl,
                      );
                      closeMenu(true);
                    }}
                  >
                    <CodeIcon sx={{ marginRight: 1 }} />
                    <small>Show JSON</small>
                  </MenuItem>

                  <MenuItem
                    onClick={(event) => {
                      event.stopPropagation();
                      void copyUrl(jsonFile.anchorUrl);
                      closeMenu(true);
                    }}
                  >
                    <ContentCopyIcon sx={{ marginRight: 1 }} />
                    Copy URL
                  </MenuItem>

                  <MenuItem
                    onClick={(event) => {
                      event.stopPropagation();
                      void copyUrl(jsonFile.jsonUrl);
                      closeMenu(true);
                    }}
                  >
                    <ContentCopyIcon sx={{ marginRight: 1 }} />
                    Copy JSON URL
                  </MenuItem>

                  <MenuItem
                    onClick={(event) => {
                      event.stopPropagation();
                      void openEditor();
                      closeMenu(true);
                    }}
                  >
                    <LaunchIcon sx={{ marginRight: 1 }} />
                    Edit JSON (Open external site)
                  </MenuItem>
                </MenuList>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
    </>
  );
};
