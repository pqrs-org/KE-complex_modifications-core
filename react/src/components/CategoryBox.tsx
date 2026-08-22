import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  styled,
  type AccordionProps,
} from "@mui/material";
import { ArrowForwardIosSharp as ArrowForwardIosSharpIcon } from "@mui/icons-material";
import { SEARCH_RESULT_CATEGORY_ID, type Category } from "../models";
import { RuleDetails, RuleHeader, RuleHeaderContent } from "./RuleView";

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
  "& .Rule-expandIcon": {
    marginRight: theme.spacing(1),
    fontSize: "0.9rem",
    verticalAlign: "middle",
    transition: theme.transitions.create("transform", {
      duration: theme.transitions.duration.shortest,
    }),
  },
  "&.Mui-expanded .Rule-expandIcon": {
    transform: "rotate(90deg)",
  },
}));

const CategoryBoxAccordionSummary = styled(AccordionSummary)(() => ({
  // AccordionSummary renders a native button. Inherit the surrounding font
  // instead of using the browser's smaller default button font.
  font: "inherit",
  position: "absolute",
  inset: 0,
  zIndex: 0,
  minHeight: 0,
  padding: 0,
  "& .MuiAccordionSummary-content": {
    display: "none",
  },
}));

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
          // Keep category headings below the sticky search field on desktop.
          top: { xs: 0, md: "var(--sticky-search-height, 88px)" },
          zIndex: 900,
        }}
      >
        {category.object.name}
      </Box>

      {category.object.id === SEARCH_RESULT_CATEGORY_ID &&
        category.files.length === 0 && (
          <Box role="status" sx={{ p: 2, color: "text.secondary" }}>
            No matching rules found.
          </Box>
        )}

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
            <RuleHeader
              file={f}
              control={
                <CategoryBoxAccordionSummary
                  id={summaryId}
                  aria-controls={regionId}
                  aria-label={f.object.metadata.title}
                />
              }
            >
              {/* Keep the visible label in normal inline flow so it can wrap
                  around the floated import action. The summary is a separate
                  control layer because metadata links cannot be nested in it. */}
              <RuleHeaderContent
                file={f}
                leading={
                  <ArrowForwardIosSharpIcon className="Rule-expandIcon" />
                }
                overlaidBySummary
              />
            </RuleHeader>
            <AccordionDetails sx={{ pt: 0 }}>
              <RuleDetails file={f} />
            </AccordionDetails>
          </CategoryBoxAccordion>
        );
      })}
    </Box>
  );
};
