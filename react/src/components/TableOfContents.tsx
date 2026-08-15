import { Box, Chip, Divider, Link } from "@mui/material";
import { Category } from "../models";
import { highlightElementById } from "../utils/hashTarget";

export const TableOfContents = ({ categories }: { categories: Category[] }) => {
  const color = "black";

  return (
    <Box
      sx={{
        border: `1px solid ${color}`,
        display: "flex",
        flexDirection: "column",
        flex: { md: 1 },
        minHeight: 0,
      }}
    >
      <Box
        sx={{
          p: 2,
          flexShrink: 0,
          color: "white",
          backgroundColor: color,
        }}
      >
        Table of Contents
      </Box>

      <Box sx={{ flex: 1, minHeight: 0, overflowY: { md: "auto" } }}>
        {categories.map((c) => {
          return (
            <Box key={c.object.id}>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "minmax(0, 1fr) auto",
                  alignItems: "center",
                  gap: 1,
                  px: 2,
                  my: 1,
                }}
              >
                <Link
                  href={`#${encodeURIComponent(c.object.id)}`}
                  sx={{ overflowWrap: "anywhere" }}
                  onClick={(event) => {
                    if (
                      event.button === 0 &&
                      !event.altKey &&
                      !event.ctrlKey &&
                      !event.metaKey &&
                      !event.shiftKey
                    ) {
                      highlightElementById(c.object.id);
                    }
                  }}
                >
                  {c.object.name}
                </Link>
                <Box>
                  <Chip label={c.files.length} />
                </Box>
              </Box>

              <Divider />
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};
