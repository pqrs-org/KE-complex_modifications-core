import { Box, Button, Chip, Divider, Link } from "@mui/material";
import { useSearchQuery } from "../contexts";
import { SEARCH_RESULT_CATEGORY_ID, type Category } from "../models";
import { highlightElementById } from "../utils/hashTarget";

export const TableOfContents = ({ categories }: { categories: Category[] }) => {
  const color = "black";
  const { setQuery } = useSearchQuery();

  return (
    <Box
      sx={{
        border: `1px solid ${color}`,
        display: "flex",
        flexDirection: "column",
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
          const isSearchResult = c.object.id === SEARCH_RESULT_CATEGORY_ID;

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
                {isSearchResult ? (
                  <Box sx={{ overflowWrap: "anywhere" }}>{c.object.name}</Box>
                ) : (
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
                )}
                <Box>
                  <Chip label={c.files.length} />
                </Box>
                {isSearchResult && (
                  <Button
                    fullWidth
                    size="small"
                    variant="outlined"
                    aria-label="Clear search"
                    sx={{
                      gridColumn: "1 / -1",
                      textTransform: "none",
                    }}
                    onClick={() => setQuery("")}
                  >
                    Clear
                  </Button>
                )}
              </Box>

              <Divider />
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};
