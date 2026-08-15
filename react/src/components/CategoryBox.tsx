import {
  Accordion,
  AccordionDetails,
  AccordionProps,
  AccordionSummary,
  AccordionSummaryProps,
  Box,
  styled,
} from "@mui/material";
import { ArrowForwardIosSharp as ArrowForwardIosSharpIcon } from "@mui/icons-material";
import { Category } from "../models";
import { RuleActions, RuleDetails } from "./RuleView";

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
  // AccordionSummary renders a native button. Inherit the surrounding font
  // instead of using the browser's smaller default button font.
  font: "inherit",
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

              <RuleActions jsonFile={f} />
            </Box>
            <AccordionDetails sx={{ pt: 0 }}>
              <RuleDetails jsonFile={f} />
            </AccordionDetails>
          </CategoryBoxAccordion>
        );
      })}
    </Box>
  );
};
