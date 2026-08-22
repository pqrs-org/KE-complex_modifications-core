import type { ReactNode } from "react";
import {
  Box,
  Chip,
  Link,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
} from "@mui/material";
import { Star as StarIcon } from "@mui/icons-material";
import type { KarabinerFile } from "../models";
import { ExtraDescription } from "./ExtraDescription";
import { ImportButton } from "./ImportButton";
import { ruleHeaderLineHeight } from "./ruleHeaderLayout";

const color = "#28A745";
const metadataChipSx = {
  marginInlineStart: "1.5rem",
  height: ruleHeaderLineHeight,
  fontSize: "0.75rem",
  verticalAlign: "middle",
} as const;

const GroupBox = ({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) => (
  <Box
    sx={{
      p: 2,
      mt: 2,
      border: "1px solid gray",
      position: "relative",
    }}
  >
    <Typography
      variant="caption"
      sx={{
        position: "absolute",
        top: 0,
        left: 16,
        transform: "translateY(-50%)",
        px: 0.5,
        bgcolor: "white",
        color: "text.secondary",
        fontWeight: 600,
      }}
    >
      {label}
    </Typography>
    {children}
  </Box>
);

export const RuleMetadata = ({ file }: { file: KarabinerFile }) => {
  const author = file.object.json.author;
  const maintainers = file.object.json.maintainers ?? [];

  if (!author && maintainers.length === 0) return null;

  return (
    <Box
      component="span"
      sx={{ position: "relative", zIndex: 2, pointerEvents: "auto" }}
    >
      {author && (
        <Chip
          component="span"
          label={`Author: ${author}`}
          variant="outlined"
          sx={metadataChipSx}
        />
      )}
      {maintainers.map((maintainer) => (
        <Chip
          component="span"
          label={
            <>
              Maintained by @
              <Link
                href={`https://github.com/${maintainer}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {maintainer}
              </Link>
            </>
          }
          variant="outlined"
          sx={metadataChipSx}
          key={`${file.id}-maintainers-${maintainer}`}
        />
      ))}
    </Box>
  );
};

const RuleImportAction = ({
  file,
  showOpenRule = true,
}: {
  file: KarabinerFile;
  showOpenRule?: boolean;
}) => (
  <Box sx={{ px: { xs: 1, sm: 2 }, py: 1.5 }}>
    <ImportButton file={file} showOpenRule={showOpenRule} />
  </Box>
);

export const RuleHeader = ({
  file,
  showOpenRule = true,
  control,
  children,
}: {
  file: KarabinerFile;
  showOpenRule?: boolean;
  control?: ReactNode;
  children: ReactNode;
}) => (
  <Box
    sx={{
      display: "flow-root",
      position: "relative",
      backgroundColor: "white",
    }}
  >
    {control}
    <Box sx={{ float: "right", position: "relative", zIndex: 1 }}>
      <RuleImportAction file={file} showOpenRule={showOpenRule} />
    </Box>
    {children}
  </Box>
);

export const RuleHeaderContent = ({
  file,
  leading,
  overlaidBySummary = false,
}: {
  file: KarabinerFile;
  leading?: ReactNode;
  overlaidBySummary?: boolean;
}) => (
  <Box
    sx={{
      minWidth: 0,
      px: 2,
      py: 1.5,
      lineHeight: ruleHeaderLineHeight,
      textAlign: "left",
      overflowWrap: "anywhere",
      ...(overlaidBySummary && {
        position: "relative",
        zIndex: 1,
        pointerEvents: "none",
      }),
    }}
  >
    <Box component="span" aria-hidden={overlaidBySummary ? true : undefined}>
      {leading}
      <Box component="span">{file.object.json.title}</Box>
    </Box>
    <RuleMetadata file={file} />
  </Box>
);

export const RuleDetails = ({ file }: { file: KarabinerFile }) => (
  <>
    <GroupBox label="Rules">
      <List disablePadding>
        {file.object.json.rules?.map((rule, index) => {
          const secondaryLines = rule.description_notes ?? [];

          return (
            <ListItem
              key={`${file.id}-rules-${index}`}
              disablePadding
              alignItems="flex-start"
            >
              <ListItemIcon sx={{ minWidth: 0, mt: 0.5, mr: 0.5 }}>
                <StarIcon sx={{ color }} />
              </ListItemIcon>
              <ListItemText
                primary={rule.description}
                secondary={
                  secondaryLines.length === 0
                    ? undefined
                    : secondaryLines.map((line, lineIndex) => (
                        <Box
                          component="span"
                          sx={{ display: "block" }}
                          key={`${lineIndex}-${line}`}
                        >
                          {line}
                        </Box>
                      ))
                }
              />
            </ListItem>
          );
        })}
      </List>
    </GroupBox>
    {file.object.extra_description_path && (
      <GroupBox label="Description">
        <ExtraDescription src={file.object.extra_description_path} />
      </GroupBox>
    )}
  </>
);

export const SharedRuleView = ({ file }: { file: KarabinerFile }) => (
  <Box sx={{ border: `1px solid ${color}` }}>
    <RuleHeader file={file} showOpenRule={false}>
      <RuleHeaderContent file={file} />
    </RuleHeader>
    <Box sx={{ px: 2, pb: 2 }}>
      <RuleDetails file={file} />
    </Box>
  </Box>
);
