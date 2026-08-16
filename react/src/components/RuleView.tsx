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
import type { KarabinerJsonFile } from "../models";
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

export const RuleMetadata = ({ jsonFile }: { jsonFile: KarabinerJsonFile }) => {
  const author = jsonFile.object.json.author;
  const maintainers = jsonFile.object.json.maintainers ?? [];

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
          key={`${jsonFile.id}-maintainers-${maintainer}`}
        />
      ))}
    </Box>
  );
};

const RuleImportAction = ({
  jsonFile,
  showOpenRule = true,
}: {
  jsonFile: KarabinerJsonFile;
  showOpenRule?: boolean;
}) => (
  <Box sx={{ px: { xs: 1, sm: 2 }, py: 1.5 }}>
    <ImportButton jsonFile={jsonFile} showOpenRule={showOpenRule} />
  </Box>
);

export const RuleHeader = ({
  jsonFile,
  showOpenRule = true,
  control,
  children,
}: {
  jsonFile: KarabinerJsonFile;
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
      <RuleImportAction jsonFile={jsonFile} showOpenRule={showOpenRule} />
    </Box>
    {children}
  </Box>
);

export const RuleHeaderContent = ({
  jsonFile,
  leading,
  overlaidBySummary = false,
}: {
  jsonFile: KarabinerJsonFile;
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
      <Box component="span">{jsonFile.object.json.title}</Box>
    </Box>
    <RuleMetadata jsonFile={jsonFile} />
  </Box>
);

export const RuleDetails = ({ jsonFile }: { jsonFile: KarabinerJsonFile }) => (
  <>
    <GroupBox label="Rules">
      <List disablePadding>
        {jsonFile.object.json.rules?.map((rule, index) => {
          const secondaryLines = rule.description_notes ?? [];

          return (
            <ListItem
              key={`${jsonFile.id}-rules-${index}`}
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
    {jsonFile.object.extra_description_path && (
      <GroupBox label="Description">
        <ExtraDescription src={jsonFile.object.extra_description_path} />
      </GroupBox>
    )}
  </>
);

export const SharedRuleView = ({
  jsonFile,
}: {
  jsonFile: KarabinerJsonFile;
}) => (
  <Box sx={{ border: `1px solid ${color}` }}>
    <RuleHeader jsonFile={jsonFile} showOpenRule={false}>
      <RuleHeaderContent jsonFile={jsonFile} />
    </RuleHeader>
    <Box sx={{ px: 2, pb: 2 }}>
      <RuleDetails jsonFile={jsonFile} />
    </Box>
  </Box>
);
