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
  OpenInNew as OpenInNewIcon,
} from "@mui/icons-material";
import { useCodeModal, useSnackbar } from "../contexts";
import type { KarabinerFile } from "../models";
import { toAbsoluteUrl, toKarabinerImportUrl } from "../utils/url";
import { ruleHeaderLineHeight } from "./ruleHeaderLayout";

export const ImportButton = ({
  file,
  showOpenRule = true,
}: {
  file: KarabinerFile;
  showOpenRule?: boolean;
}) => {
  const codeModal = useCodeModal();
  const { setText: setSnackbarText } = useSnackbar();
  const menuId = useId();
  const rulesetJsonUrl = file.rulesetJsonUrl;

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

  const importRule = () => {
    window.location.href = toKarabinerImportUrl(file.sourceUrl);
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
            importRule();
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
                  {file.isJavaScript && rulesetJsonUrl !== undefined && (
                    <>
                      <MenuItem
                        component="a"
                        href={toKarabinerImportUrl(file.sourceUrl)}
                        onClick={(event) => {
                          event.stopPropagation();
                          closeMenu(true);
                        }}
                      >
                        Import JavaScript code
                      </MenuItem>
                      <MenuItem
                        component="a"
                        href={toKarabinerImportUrl(rulesetJsonUrl)}
                        onClick={(event) => {
                          event.stopPropagation();
                          closeMenu(true);
                        }}
                      >
                        Import JSON compatible with Karabiner-Elements 16.1.0 or
                        earlier
                      </MenuItem>
                      <Divider />
                    </>
                  )}

                  {showOpenRule && (
                    <MenuItem
                      component="a"
                      href={toAbsoluteUrl(file.shareUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(event) => {
                        event.stopPropagation();
                        closeMenu(true);
                      }}
                    >
                      <OpenInNewIcon sx={{ marginRight: 1 }} />
                      Open shareable rule page in new tab
                    </MenuItem>
                  )}

                  <MenuItem
                    onClick={(event) => {
                      event.stopPropagation();
                      void codeModal.openModal(
                        file.object.metadata.title ?? "",
                        file.sourceUrl,
                      );
                      closeMenu(true);
                    }}
                  >
                    <CodeIcon sx={{ marginRight: 1 }} />
                    {file.isJavaScript ? "Show JavaScript" : "Show JSON"}
                  </MenuItem>

                  {rulesetJsonUrl !== undefined && (
                    <MenuItem
                      onClick={(event) => {
                        event.stopPropagation();
                        void codeModal.openModal(
                          file.object.metadata.title ?? "",
                          rulesetJsonUrl,
                        );
                        closeMenu(true);
                      }}
                    >
                      <CodeIcon sx={{ marginRight: 1 }} />
                      Show compatible JSON
                    </MenuItem>
                  )}

                  <MenuItem
                    onClick={(event) => {
                      event.stopPropagation();
                      void copyUrl(file.shareUrl);
                      closeMenu(true);
                    }}
                  >
                    <ContentCopyIcon sx={{ marginRight: 1 }} />
                    Copy URL
                  </MenuItem>

                  <MenuItem
                    onClick={(event) => {
                      event.stopPropagation();
                      void copyUrl(file.sourceUrl);
                      closeMenu(true);
                    }}
                  >
                    <ContentCopyIcon sx={{ marginRight: 1 }} />
                    {file.isJavaScript
                      ? "Copy JavaScript URL"
                      : "Copy JSON URL"}
                  </MenuItem>

                  {rulesetJsonUrl !== undefined && (
                    <MenuItem
                      onClick={(event) => {
                        event.stopPropagation();
                        void copyUrl(rulesetJsonUrl);
                        closeMenu(true);
                      }}
                    >
                      <ContentCopyIcon sx={{ marginRight: 1 }} />
                      Copy compatible JSON URL
                    </MenuItem>
                  )}
                </MenuList>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
    </>
  );
};
