import { Box, Chip } from "@mui/material";
import { Search as SearchIcon } from "@mui/icons-material";
import { useSearchQuery } from "../contexts";

export const SearchSuggestions = ({
  suggestions,
  counts,
}: {
  suggestions: readonly string[];
  counts: ReadonlyMap<string, number>;
}) => {
  const { query, setQuery } = useSearchQuery();
  const sortedSuggestions = suggestions
    .map((suggestion, index) => ({ suggestion, index }))
    .sort(
      (a, b) =>
        (counts.get(b.suggestion) ?? 0) - (counts.get(a.suggestion) ?? 0) ||
        a.index - b.index,
    )
    .map(({ suggestion }) => suggestion);

  return (
    <Box
      component="nav"
      aria-label="Suggested searches"
      sx={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "flex-start",
        gap: 1,
      }}
    >
      {sortedSuggestions.map((suggestion) => {
        const selected = query === suggestion;
        const count = counts.get(suggestion) ?? 0;

        return (
          <Chip
            key={suggestion}
            component="button"
            type="button"
            icon={<SearchIcon />}
            label={
              <Box component="span" sx={{ display: "flex", gap: 0.75 }}>
                <Box component="span">{suggestion}</Box>
                <Box
                  component="span"
                  sx={{
                    minWidth: "1.5em",
                    px: 0.5,
                    borderRadius: 1,
                    bgcolor: selected ? "primary.contrastText" : "action.hover",
                    color: selected ? "primary.main" : "text.secondary",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {count}
                </Box>
              </Box>
            }
            size="small"
            clickable
            sx={{ px: 0.75 }}
            color={selected ? "primary" : "default"}
            variant={selected ? "filled" : "outlined"}
            aria-pressed={selected}
            aria-label={`Search for ${suggestion} (${count} results)`}
            onClick={() => setQuery(suggestion)}
          />
        );
      })}
    </Box>
  );
};
