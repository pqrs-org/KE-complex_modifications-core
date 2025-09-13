import React, { useContext, useRef, useState } from "react";
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
import { JsonModalContext, SnackbarContext } from "../contexts";
import { KarabinerJsonFile } from "../models";
import { toAbsoluteUrl } from "../utils/url";
import { Base64 } from "js-base64";

export const ImportButton = ({ jsonFile }: { jsonFile: KarabinerJsonFile }) => {
  const jsonModalContext = useContext(JsonModalContext);
  const snackbarContext = useContext(SnackbarContext);

  //
  // Menu
  //

  const [menuOpen, setMenuOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);

  const handleMenuToggle = () => {
    setMenuOpen((prevOpen) => !prevOpen);
  };

  const handleMenuClose = (event: Event) => {
    if (
      anchorRef.current &&
      anchorRef.current.contains(event.target as HTMLElement)
    ) {
      return;
    }

    setMenuOpen(false);
  };

  const importJson = () => {
    const url = encodeURIComponent(toAbsoluteUrl(jsonFile.jsonUrl));
    window.location.href = `karabiner://karabiner/assets/complex_modifications/import?url=${url}`;
  };

  const copyUrl = (url: string) => {
    url = toAbsoluteUrl(url);

    if (navigator.clipboard !== undefined) {
      navigator.clipboard.writeText(url);
      snackbarContext.setText(`You just copied: ${url}`);
    } else {
      snackbarContext.setText(`ERROR: Failed to copy: ${url}`);
    }
  };

  const openEditor = async () => {
    try {
      const response = await fetch(jsonFile.jsonUrl);
      const json = await response.json();
      const base64string = Base64.encode(JSON.stringify(json));
      const url = `https://genesy.github.io/karabiner-complex-rules-generator/#${base64string}`;
      window.open(url);
    } catch (err) {
      console.log(err);
      snackbarContext.setText("ERROR: Failed to open editor");
    }
  };

  return (
    <>
      <ButtonGroup variant="contained" ref={anchorRef}>
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
          size="small"
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
        anchorEl={anchorRef.current}
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
                <MenuList id="split-button-menu">
                  <MenuItem
                    onClick={(event) => {
                      event.stopPropagation();
                      importJson();
                      handleMenuClose(event.nativeEvent);
                    }}
                  >
                    Import to Karabiner-Elements
                  </MenuItem>
                  <Divider />

                  <MenuItem
                    onClick={(event) => {
                      event.stopPropagation();
                      jsonModalContext.openModal(
                        jsonFile.object.json?.title ?? "",
                        jsonFile.jsonUrl,
                      );
                      handleMenuClose(event.nativeEvent);
                    }}
                  >
                    <CodeIcon sx={{ marginRight: 1 }} />
                    <small>Show JSON</small>
                  </MenuItem>

                  <MenuItem
                    onClick={(event) => {
                      event.stopPropagation();
                      copyUrl(jsonFile.anchorUrl);
                      handleMenuClose(event.nativeEvent);
                    }}
                  >
                    <ContentCopyIcon sx={{ marginRight: 1 }} />
                    Copy URL
                  </MenuItem>

                  <MenuItem
                    onClick={(event) => {
                      event.stopPropagation();
                      copyUrl(jsonFile.jsonUrl);
                      handleMenuClose(event.nativeEvent);
                    }}
                  >
                    <ContentCopyIcon sx={{ marginRight: 1 }} />
                    Copy JSON URL
                  </MenuItem>

                  <MenuItem
                    onClick={(event) => {
                      event.stopPropagation();
                      openEditor();
                      handleMenuClose(event.nativeEvent);
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
