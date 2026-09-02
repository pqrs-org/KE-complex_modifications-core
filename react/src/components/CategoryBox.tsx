import { useLayoutEffect, useRef, type SyntheticEvent } from "react";
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
  scrollMarginTop: "var(--rule-heading-sticky-top, 56px)",
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
  "& > .MuiAccordion-heading": {
    borderBottom: `1px solid ${theme.palette.divider}`,
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
  const categoryBoxRef = useRef<HTMLDivElement>(null);
  const categoryHeadingRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const categoryBox = categoryBoxRef.current;
    const categoryHeading = categoryHeadingRef.current;
    if (!categoryBox || !categoryHeading) return;

    const updateCategoryHeadingHeight = () => {
      const height = categoryHeading.getBoundingClientRect().height;
      if (height > 0) {
        categoryBox.style.setProperty(
          "--category-heading-height",
          `${height}px`,
        );
      }
    };

    updateCategoryHeadingHeight();
    if (typeof ResizeObserver !== "undefined") {
      const resizeObserver = new ResizeObserver(updateCategoryHeadingHeight);
      resizeObserver.observe(categoryHeading);

      return () => resizeObserver.disconnect();
    }

    window.addEventListener("resize", updateCategoryHeadingHeight);
    return () => {
      window.removeEventListener("resize", updateCategoryHeadingHeight);
    };
  }, []);

  const handleRuleExpansionChange = (
    event: SyntheticEvent,
    expanded: boolean,
  ) => {
    if (expanded) return;

    const eventTarget = event.currentTarget;
    if (!(eventTarget instanceof Element)) return;

    const accordion = eventTarget.closest<HTMLElement>(".MuiAccordion-root");
    const heading = eventTarget.closest<HTMLElement>(".MuiAccordion-heading");
    if (!accordion || !heading) return;

    // A sticky heading moves below its accordion's natural top. Restore that
    // top before collapsing so removing the details does not leave the reader
    // at content that followed the rule. Allow for borders and subpixel layout
    // differences when the heading is already at its natural position.
    const accordionTop = accordion.getBoundingClientRect().top;
    const headingTop = heading.getBoundingClientRect().top;
    const stickyPositionTolerance = 2;
    if (accordionTop < headingTop - stickyPositionTolerance) {
      accordion.scrollIntoView({ block: "start" });
    }
  };

  return (
    <Box
      ref={categoryBoxRef}
      sx={{
        border: `1px solid ${categoryColor}`,
        "--category-heading-height": "56px",
        "--rule-heading-sticky-top": {
          xs: "var(--category-heading-height)",
          md: "calc(var(--sticky-search-height, 88px) + var(--category-heading-height))",
        },
      }}
    >
      <Box
        ref={categoryHeadingRef}
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
            onChange={handleRuleExpansionChange}
            slotProps={{
              heading: {
                style: {
                  position: "sticky",
                  top: "var(--rule-heading-sticky-top)",
                  zIndex: 890,
                },
              },
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
