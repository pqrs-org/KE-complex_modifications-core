import React, { useContext } from "react";
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
import { LocationHashContext } from "../contexts";
import { Category } from "../models";
import { ImportButton } from "./ImportButton";
import { ExtraDescription } from "./ExtraDescription";

const color = "#28A745";

const CategoryBoxAccordion = styled((props: AccordionProps) => (
  <Accordion disableGutters elevation={0} square {...props} />
))(({ theme }) => ({
  border: `1px solid ${color}`,
  "&:not(:last-child)": {
    borderBottom: 0,
  },
  "&:before": {
    display: "none",
  },
}));

const CategoryBoxAccordionSummary = styled((props: AccordionSummaryProps) => (
  <AccordionSummary
    component="div"
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

export const CategoryBox = ({ category }: { category: Category }) => {
  const locationHashContext = useContext(LocationHashContext);

  return (
    <Box
      sx={{
        border: `1px solid ${color}`,
      }}
    >
      <Box
        sx={{
          p: 2,
          color: "white",
          backgroundColor: color,
          position: "sticky",
          top: 0,
          zIndex: 900,
        }}
      >
        {category.object.name}
      </Box>

      {category.files.map((f) => {
        if (locationHashContext.hash !== "") {
          if (
            // location.hash is not file id
            locationHashContext.hash !== f.id &&
            // location.hash is not category id
            locationHashContext.hash !== category.object.id
          ) {
            return undefined;
          }
        }

        return (
          <CategoryBoxAccordion
            id={f.id}
            slotProps={{ transition: { unmountOnExit: true } }}
            key={f.id}
          >
            <CategoryBoxAccordionSummary>
              {f.object.json?.title}

              <Box sx={{ ml: "auto" }}>
                {f.object.json?.author && (
                  <Chip
                    label={`Author: ${f.object.json.author}`}
                    variant="outlined"
                    sx={{ marginRight: 2 }}
                  />
                )}
                {f.object.json?.maintainers &&
                  f.object.json?.maintainers.map((m) => (
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
            </CategoryBoxAccordionSummary>
            <AccordionDetails sx={{ pt: 0 }}>
              <List sx={{ px: 2 }} disablePadding>
                {f.object.json?.rules?.map((r, i) => (
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
              {f.object.extra_description_path && (
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
                    Description
                  </Typography>
                  <ExtraDescription src={f.object.extra_description_path} />
                </Box>
              )}
            </AccordionDetails>
          </CategoryBoxAccordion>
        );
      })}
    </Box>
  );
};
