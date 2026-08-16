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
  OpenInNew as OpenInNewIcon,
} from "@mui/icons-material";
import { useJsonModal, useSnackbar } from "../contexts";
import type { KarabinerJsonFile } from "../models";
import { toAbsoluteUrl, toKarabinerImportUrl } from "../utils/url";
import { Base64 } from "js-base64";
import { ruleHeaderLineHeight } from "./ruleHeaderLayout";

export const ImportButton = ({
  jsonFile,
  showOpenRule = true,
}: {
  jsonFile: KarabinerJsonFile;
  showOpenRule?: boolean;
}) => {
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

  const moveFocusOutsideMenu = (backwards: boolean) => {
    const menuButton = menuButtonRef.current;
    if (menuButton === null) return;

    const focusableElements = Array.from(
      menuButton.ownerDocument.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    ).filter(
      (element) =>
        element.tabIndex >= 0 &&
        !element.closest(
          '[hidden], [aria-hidden="true"], [inert], [role="menu"]',
        ),
    );
    const currentIndex = focusableElements.indexOf(menuButton);
    if (currentIndex === -1 || focusableElements.length < 2) return;

    const nextIndex = backwards
      ? (currentIndex - 1 + focusableElements.length) % focusableElements.length
      : (currentIndex + 1) % focusableElements.length;
    requestAnimationFrame(() => focusableElements[nextIndex]?.focus());
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
      closeMenu();
      moveFocusOutsideMenu(event.shiftKey);
    } else if (event.key === "Escape") {
      closeMenu(true);
    }
  };

  const importJson = () => {
    window.location.href = toKarabinerImportUrl(jsonFile.jsonUrl);
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
      <ButtonGroup
        variant="contained"
        ref={setAnchorElement}
        sx={{
          height: ruleHeaderLineHeight,
          "& .MuiButton-root": {
            minHeight: ruleHeaderLineHeight,
            py: 0,
            lineHeight: 1,
          },
        }}
      >
        <Button
          size="small"
          sx={{ px: { sm: 2 }, fontSize: "1rem", textTransform: "none" }}
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
          sx={{ px: { sm: 1.25 } }}
          aria-label="Open import menu"
          aria-controls={menuOpen ? menuId : undefined}
          aria-expanded={menuOpen}
          aria-haspopup="menu"
          onClick={(event) => {
            event.stopPropagation();
            handleMenuToggle();
          }}
        >
          <ArrowDropDownIcon sx={{ fontSize: "1.25rem" }} />
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
                        jsonFile.object.json.title ?? "",
                        jsonFile.jsonUrl,
                      );
                      closeMenu(true);
                    }}
                  >
                    <CodeIcon sx={{ marginRight: 1 }} />
                    <small>Show JSON</small>
                  </MenuItem>

                  {showOpenRule && (
                    <MenuItem
                      component="a"
                      href={toAbsoluteUrl(jsonFile.shareUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(event) => {
                        event.stopPropagation();
                        closeMenu(true);
                      }}
                    >
                      <OpenInNewIcon sx={{ marginRight: 1 }} />
                      Open rule in new tab
                    </MenuItem>
                  )}

                  <MenuItem
                    onClick={(event) => {
                      event.stopPropagation();
                      void copyUrl(jsonFile.shareUrl);
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
