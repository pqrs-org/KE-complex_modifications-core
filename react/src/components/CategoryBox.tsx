import type { ReactNode } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionProps,
  AccordionSummary,
  AccordionSummaryProps,
  Box,
  Chip,
  Link,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
  styled,
} from "@mui/material";
import {
  ArrowForwardIosSharp as ArrowForwardIosSharpIcon,
  Star as StarIcon,
} from "@mui/icons-material";
import { Category } from "../models";
import { ImportButton } from "./ImportButton";
import { ExtraDescription } from "./ExtraDescription";

const color = "#28A745";
const categoryColor = `var(--category-highlight-color, ${color})`;
const categoryTextColor = "var(--category-highlight-text-color, white)";

const CategoryBoxAccordion = styled(({ slots, ...props }: AccordionProps) => (
  <Accordion
    disableGutters
    elevation={0}
    square
    slots={{
      ...slots,
      // MUI wraps the first Accordion child in an h3 by default. The first
      // child here is the whole header row, including file actions, so use
      // a div to keep those actions out of a heading.
      heading: "div",
    }}
    {...props}
  />
))(({ theme }) => ({
  border: `1px solid ${categoryColor}`,
  scrollMarginTop: theme.spacing(2),
  "&:not(:last-child)": {
    borderBottom: 0,
  },
  "&:before": {
    display: "none",
  },
}));

const CategoryBoxAccordionSummary = styled((props: AccordionSummaryProps) => (
  <AccordionSummary
    expandIcon={<ArrowForwardIosSharpIcon sx={{ fontSize: "0.9rem" }} />}
    {...props}
  />
))(({ theme }) => ({
  backgroundColor: "white",
  flexDirection: "row-reverse",
  "& .MuiAccordionSummary-expandIconWrapper.Mui-expanded": {
    transform: "rotate(90deg)",
  },
  "& .MuiAccordionSummary-content": {
    marginLeft: theme.spacing(1),
    alignItems: "center",
  },
}));

const GroupBox = ({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) => {
  return (
    <Box
      sx={{
        p: 2,
        mt: 2,
        border: `1px solid gray`,
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
};

export const CategoryBox = ({ category }: { category: Category }) => {
  return (
    <Box
      sx={{
        border: `1px solid ${categoryColor}`,
      }}
    >
      <Box
        sx={{
          p: 2,
          color: categoryTextColor,
          backgroundColor: categoryColor,
          position: "sticky",
          top: 0,
          zIndex: 900,
        }}
      >
        {category.object.name}
      </Box>

      {category.files.map((f) => {
        const elementIdPrefix = [category.object.id, f.id]
          .map(encodeURIComponent)
          .join("-");
        const summaryId = `${elementIdPrefix}-summary`;
        const regionId = `${elementIdPrefix}-details`;

        return (
          <CategoryBoxAccordion
            id={f.id}
            slotProps={{
              region: { id: regionId, "aria-labelledby": summaryId },
              transition: { unmountOnExit: true },
            }}
            key={f.id}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                flexWrap: "wrap",
                backgroundColor: "white",
              }}
            >
              <CategoryBoxAccordionSummary
                id={summaryId}
                aria-controls={regionId}
                sx={{ flex: "1 1 20rem", minWidth: 0 }}
              >
                {f.object.json.title}
              </CategoryBoxAccordionSummary>

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
                {f.object.json.author && (
                  <Chip
                    label={`Author: ${f.object.json.author}`}
                    variant="outlined"
                    sx={{ marginRight: 2 }}
                  />
                )}
                {f.object.json.maintainers &&
                  f.object.json.maintainers.map((m) => (
                    <Chip
                      label={
                        <>
                          Maintained by @
                          <Link
                            href={`https://github.com/${m}`}
                            target="_blank"
                            onClick={(event) => event.stopPropagation()}
                          >
                            {m}
                          </Link>
                        </>
                      }
                      variant="outlined"
                      sx={{ marginRight: 2 }}
                      key={`${f.id}-maintainers-${m}`}
                    />
                  ))}

                <ImportButton jsonFile={f} />
              </Box>
            </Box>
            <AccordionDetails sx={{ pt: 0 }}>
              <GroupBox label="Rules">
                <List disablePadding>
                  {f.object.json.rules?.map((r, i) => (
                    <ListItem key={`${f.id}-rules-${i}`} disablePadding>
                      <ListItemIcon sx={{ minWidth: 0, mr: 0.5 }}>
                        <StarIcon sx={{ color }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={r.description}
                        secondary={
                          r.available_since &&
                          `Karabiner-Elements ${r.available_since} or later`
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </GroupBox>
              {f.object.extra_description_path && (
                <GroupBox label="Description">
                  <ExtraDescription src={f.object.extra_description_path} />
                </GroupBox>
              )}
            </AccordionDetails>
          </CategoryBoxAccordion>
        );
      })}
    </Box>
  );
};
