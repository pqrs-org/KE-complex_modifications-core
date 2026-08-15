import { useState } from "react";
import { Box, FormControl, InputAdornment, OutlinedInput } from "@mui/material";
import { Search as SearchIcon } from "@mui/icons-material";
import { useSearchQuery } from "../contexts";

export const SearchInput = () => {
  const { query, setQuery } = useSearchQuery();
  const [value, setValue] = useState(query);

  const submit = () => {
    if (query !== value) {
      setQuery(value);

      window.history.pushState(
        { q: value },
        "",
        value === ""
          ? window.location.pathname
          : "?q=" + encodeURIComponent(value),
      );
    }
  };

  return (
    <Box>
      <FormControl sx={{ width: "100%", maxWidth: "50ch" }} variant="outlined">
        <OutlinedInput
          value={value}
          placeholder="Search..."
          slotProps={{ input: { "aria-label": "Search rules" } }}
          startAdornment={
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          }
          onChange={(event) => {
            setValue(event.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              submit();
            }
          }}
          onBlur={() => {
            submit();
          }}
        />
      </FormControl>
    </Box>
  );
};
