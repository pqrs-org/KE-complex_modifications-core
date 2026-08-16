import { useState } from "react";
import {
  FormControl,
  IconButton,
  InputAdornment,
  OutlinedInput,
} from "@mui/material";
import { Clear as ClearIcon, Search as SearchIcon } from "@mui/icons-material";
import { useSearchQuery } from "../contexts";

export const SearchInput = () => {
  const { query, setQuery } = useSearchQuery();
  const [value, setValue] = useState(query);

  const submit = (nextValue = value) => {
    if (query !== nextValue) {
      setQuery(nextValue);
    }
  };

  return (
    <FormControl sx={{ width: "100%" }} variant="outlined">
      <OutlinedInput
        value={value}
        placeholder="Search..."
        slotProps={{ input: { "aria-label": "Search rules" } }}
        startAdornment={
          <InputAdornment position="start">
            <SearchIcon />
          </InputAdornment>
        }
        endAdornment={
          value === "" ? undefined : (
            <InputAdornment position="end">
              <IconButton
                aria-label="Clear search"
                edge="end"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  setValue("");
                  submit("");
                }}
              >
                <ClearIcon />
              </IconButton>
            </InputAdornment>
          )
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
  );
};
