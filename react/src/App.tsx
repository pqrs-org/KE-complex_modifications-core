import React, { useContext, useEffect, useMemo, useState } from "react";
import {
  Alert,
  AppBar,
  Box,
  Button,
  CircularProgress,
  Container,
  Link,
  Toolbar,
  Typography,
} from "@mui/material";
import {
  InfoOutlined as InfoOutlinedIcon,
  OpenInNew as OpenInNewIcon,
} from "@mui/icons-material";
import lunr from "lunr";
import { LocationHashContext, SearchQueryContext } from "./contexts";
import { Category, KarabinerJsonFile } from "./models";
import { CategoryObject } from "./types";
import {
  CategoryBox,
  JsonModal,
  TableOfContents,
  SearchInput,
  Snackbar,
} from "./components";

const App = () => {
  const locationHashContext = useContext(LocationHashContext);
  const searchQueryContext = useContext(SearchQueryContext);

  const [fetching, setFetching] = useState(true);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [revision, setRevision] = useState("");
  const [updatedAt, setUpdatedAt] = useState(0);
  const searchQuery = searchQueryContext.query;
  const hasSearchQuery = searchQuery !== "";

  //
  // Fetch dist.json
  //

  useEffect(() => {
    fetch("dist.json")
      .then((res) => res.json())
      .then(
        (result: {
          index: CategoryObject[];
          example: CategoryObject[];
          revision: string;
          updatedAt: number;
        }) => {
          setAllCategories(
            [
              result.index.map((c) => new Category(c)),
              result.example.map((c) => new Category(c)),
            ].flat(),
          );

          setRevision(result.revision);
          setUpdatedAt(result.updatedAt);
        },
        (error) => {
          console.log(error);
        },
      )
      .then(() => {
        setFetching(false);
      });
  }, []);

  //
  // Update lunrIndex
  //

  const lunrIndex = useMemo(() => {
    // Skip if allCategories is not initialized.
    if (allCategories.length === 0) {
      return undefined;
    }

    // Skip if search query is empty.
    if (!hasSearchQuery) {
      return undefined;
    }

    return lunr((l) => {
      l.ref("fileId");
      l.field("title", { boost: 2 });
      l.field("text");

      allCategories.forEach((c) => {
        c.files.forEach((f) => {
          let text = "";
          if (f.object.json?.maintainers !== undefined) {
            f.object.json?.maintainers.forEach((m) => {
              text = `${text} ${m ?? ""}`;
            });
          }
          f.object.json?.rules?.forEach((r) => {
            text = `${text} ${r.description ?? ""}`;
          });
          text = `${text} ${f.object.extra_description_text ?? ""}`;

          let boost = 1;
          if (f.object.json?.maintainers || f.object.json?.author) {
            boost *= 2;
          }

          l.add(
            {
              fileId: f.id,
              title: f.object.json?.title ?? "",
              text: text.toLowerCase(),
            },
            {
              boost,
            },
          );
        });
      });
    });
  }, [allCategories, hasSearchQuery]);

  //
  // Update categories
  //

  const categories = useMemo(() => {
    if (allCategories.length === 0) {
      return [];
    }

    if (searchQuery === "") {
      return allCategories;
    }

    //
    // Filter categories by search query
    //

    if (lunrIndex === undefined) {
      return [];
    }

    const filteredCategories: Category[] = [
      {
        object: {
          id: "__search_result__",
          name: "Search Result",
        },
        files: [] as KarabinerJsonFile[],
      },
    ];

    const results = lunrIndex.query((q) => {
      lunr.tokenizer(searchQuery.toLowerCase()).forEach((token) => {
        const queryString = token.toString();
        q.term(queryString, {
          boost: 100,
        });
        q.term(queryString, {
          wildcard: lunr.Query.wildcard.LEADING | lunr.Query.wildcard.TRAILING,
          boost: 10,
        });
        q.term(queryString, {
          editDistance: 2,
        });
      });
    });

    results.forEach((r) => {
      const fileId = r.ref;

      allCategories.forEach((c) => {
        c.files.forEach((f) => {
          if (f.id === fileId) {
            filteredCategories[0].files.push(f);
          }
        });
      });
    });

    return filteredCategories;
  }, [searchQuery, allCategories, lunrIndex]);

  return (
    <React.Fragment>
      <AppBar position="static">
        <Toolbar>
          <Link href={`./`} color="inherit" underline="none">
            <Typography sx={{ fontWeight: "bold" }}>
              Karabiner-Elements complex_modifications rules
            </Typography>
          </Link>

          {fetching && (
            <CircularProgress color="inherit" sx={{ marginLeft: 4 }} />
          )}

          <Box sx={{ marginLeft: "auto", textAlign: "right" }}>
            <Link
              href="https://github.com/pqrs-org/KE-complex_modifications"
              color="inherit"
              target="_blank"
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "end",
              }}
            >
              <OpenInNewIcon sx={{ mr: 0.5 }} />
              GitHub
            </Link>
            {revision !== "" && (
              <Box>{`revision: ${revision} / ${new Date(updatedAt * 1000)
                .toISOString()
                .substring(0, 10)}`}</Box>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      <Container>
        {/*
         ** Search & Table of Contents
         **/}
        {locationHashContext.hash === "" && (
          <>
            <Box sx={{ mt: 4, textAlign: "center" }}>
              <SearchInput />
            </Box>

            {searchQueryContext.query === "" && (
              <Box sx={{ mt: 4 }}>
                <TableOfContents categories={categories} />
              </Box>
            )}
          </>
        )}

        {/*
         ** Show all button
         **/}
        {locationHashContext.hash !== "" && (
          <Box sx={{ mt: 2 }}>
            <Alert variant="outlined" severity="warning" icon={false}>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <InfoOutlinedIcon sx={{ mr: 1 }} />
                Rules are filtered by &quot;
                <strong>{locationHashContext.hash}</strong>&quot;.
                <Button
                  variant="contained"
                  component={Link}
                  href={`./`}
                  sx={{ ml: 2, textTransform: "none" }}
                >
                  Show all rules
                </Button>
              </Box>
            </Alert>
          </Box>
        )}

        {/*
         ** Categories
         **/}
        {categories.map((c) => {
          if (locationHashContext.hash !== "") {
            if (
              // location.hash is not category id
              locationHashContext.hash !== c.object.id &&
              // location.hash is not file id
              c.files.find((f) => locationHashContext.hash === f.id) ===
                undefined
            ) {
              return undefined;
            }
          }

          return (
            <Box sx={{ mt: 4 }} id={c.object.id} key={c.object.id}>
              <CategoryBox category={c}></CategoryBox>
            </Box>
          );
        })}
      </Container>

      <JsonModal />
      <Snackbar />
    </React.Fragment>
  );
};

export default App;
