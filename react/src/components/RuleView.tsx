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
import { KarabinerJsonFile } from "../models";
import { ExtraDescription } from "./ExtraDescription";
import { ImportButton } from "./ImportButton";

const color = "#28A745";

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

export const RuleActions = ({
  jsonFile,
  showOpenRule = true,
}: {
  jsonFile: KarabinerJsonFile;
  showOpenRule?: boolean;
}) => (
  <Box
    sx={{
      display: "flex",
      alignItems: "center",
      flexWrap: "wrap",
      gap: 1,
      px: 2,
      py: 1,
    }}
  >
    {jsonFile.object.json.author && (
      <Chip
        label={`Author: ${jsonFile.object.json.author}`}
        variant="outlined"
        sx={{ marginRight: 2 }}
      />
    )}
    {jsonFile.object.json.maintainers?.map((maintainer) => (
      <Chip
        label={
          <>
            Maintained by @
            <Link
              href={`https://github.com/${maintainer}`}
              target="_blank"
              onClick={(event) => event.stopPropagation()}
            >
              {maintainer}
            </Link>
          </>
        }
        variant="outlined"
        sx={{ marginRight: 2 }}
        key={`${jsonFile.id}-maintainers-${maintainer}`}
      />
    ))}
    <ImportButton jsonFile={jsonFile} showOpenRule={showOpenRule} />
  </Box>
);

export const RuleDetails = ({ jsonFile }: { jsonFile: KarabinerJsonFile }) => (
  <>
    <GroupBox label="Rules">
      <List disablePadding>
        {jsonFile.object.json.rules?.map((rule, index) => (
          <ListItem key={`${jsonFile.id}-rules-${index}`} disablePadding>
            <ListItemIcon sx={{ minWidth: 0, mr: 0.5 }}>
              <StarIcon sx={{ color }} />
            </ListItemIcon>
            <ListItemText
              primary={rule.description}
              secondary={
                rule.available_since &&
                `Karabiner-Elements ${rule.available_since} or later`
              }
            />
          </ListItem>
        ))}
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
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        backgroundColor: "white",
      }}
    >
      <Box sx={{ flex: "1 1 20rem", minWidth: 0, px: 2, py: 1.5 }}>
        {jsonFile.object.json.title}
      </Box>
      <RuleActions jsonFile={jsonFile} showOpenRule={false} />
    </Box>
    <Box sx={{ px: 2, pb: 2 }}>
      <RuleDetails jsonFile={jsonFile} />
    </Box>
  </Box>
);
