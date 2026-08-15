import { Fragment, useEffect, useMemo, useState } from "react";
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
import { OpenInNew as OpenInNewIcon } from "@mui/icons-material";
import lunr from "lunr";
import { useSearchQuery } from "./contexts";
import { Category } from "./models";
import { isDistResult } from "./utils/distResult";
import {
  clearHashTargetHighlight,
  highlightLocationHashTarget,
} from "./utils/hashTarget";
import {
  CategoryBox,
  JsonModal,
  TableOfContents,
  SearchInput,
  Snackbar,
} from "./components";

const App = () => {
  const { query: searchQuery } = useSearchQuery();
  const sharedRulePath = new URLSearchParams(window.location.search).get(
    "rule",
  );

  const [fetching, setFetching] = useState(true);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [revision, setRevision] = useState("");
  const [updatedAt, setUpdatedAt] = useState(0);
  const [fetchError, setFetchError] = useState("");
  const hasSearchQuery = searchQuery !== "";

  //
  // Fetch dist.json
  //

  useEffect(() => {
    const controller = new AbortController();

    const fetchCategories = async () => {
      try {
        const response = await fetch("dist.json", {
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(
            `Fetch failed: ${response.status} ${response.statusText}`,
          );
        }

        const result: unknown = await response.json();
        if (!isDistResult(result)) {
          throw new Error("dist.json has an invalid structure");
        }
        setAllCategories(
          result.index
            .map((category) => new Category(category))
            .concat(result.example.map((category) => new Category(category))),
        );
        setRevision(result.revision);
        setUpdatedAt(result.updatedAt);
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error(error);
        setFetchError("Failed to load rules. Please reload the page.");
      } finally {
        if (!controller.signal.aborted) {
          setFetching(false);
        }
      }
    };

    void fetchCategories();
    return () => controller.abort();
  }, []);

  // The initial hash target does not exist until dist.json has loaded. Mark
  // and scroll to it after rendering, then update the mark directly when the
  // hash changes so the rule list does not have to re-render.
  useEffect(() => {
    if (allCategories.length === 0) return;

    const target = highlightLocationHashTarget();
    const handleHashChange = () => highlightLocationHashTarget();
    window.addEventListener("hashchange", handleHashChange);

    const frame =
      target === null
        ? undefined
        : requestAnimationFrame(() => target.scrollIntoView?.());
    return () => {
      if (frame !== undefined) cancelAnimationFrame(frame);
      window.removeEventListener("hashchange", handleHashChange);
      clearHashTargetHighlight();
    };
  }, [allCategories]);

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
          const { json } = f.object;
          let text = "";
          if (json.maintainers !== undefined) {
            json.maintainers.forEach((m) => {
              text = `${text} ${m ?? ""}`;
            });
          }
          json.rules?.forEach((r) => {
            text = `${text} ${r.description ?? ""}`;
          });
          text = `${text} ${f.object.extra_description_text ?? ""}`;

          let boost = 1;
          if (json.maintainers || json.author) {
            boost *= 2;
          }

          l.add(
            {
              fileId: f.id,
              title: json.title ?? "",
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

    if (sharedRulePath !== null) {
      return allCategories.flatMap((category) => {
        const files = category.object.files.filter(
          (file) => file.path === sharedRulePath,
        );
        return files.length === 0
          ? []
          : [new Category({ ...category.object, files })];
      });
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

    const filesById = new Map(
      allCategories.flatMap((category) =>
        category.files.map((file) => [file.id, file.object] as const),
      ),
    );
    const files = results.flatMap((result) => {
      const file = filesById.get(result.ref);
      return file === undefined ? [] : [file];
    });

    return [
      new Category({
        id: "__search_result__",
        name: "Search Result",
        files,
      }),
    ];
  }, [searchQuery, sharedRulePath, allCategories, lunrIndex]);

  return (
    <Fragment>
      <AppBar position="static">
        <Toolbar>
          <Link href="./" color="inherit" underline="none">
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

      <Container sx={{ pb: 4 }}>
        {fetchError !== "" && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {fetchError}
          </Alert>
        )}

        {/*
         ** Search & Table of Contents
         **/}
        {sharedRulePath === null ? (
          <>
            <Box sx={{ mt: 4, textAlign: "center" }}>
              <SearchInput key={searchQuery} />
            </Box>

            {searchQuery === "" && (
              <Box sx={{ mt: 4 }}>
                <TableOfContents categories={categories} />
              </Box>
            )}
          </>
        ) : (
          <Box sx={{ mt: 2 }}>
            <Alert
              variant="outlined"
              severity={categories.length === 0 && !fetching ? "error" : "info"}
              action={
                <Button
                  component={Link}
                  href="./"
                  variant="contained"
                  sx={{ textTransform: "none" }}
                >
                  Show all rules
                </Button>
              }
            >
              {categories.length === 0 && !fetching
                ? "The shared rule was not found."
                : "Showing a shared rule."}
            </Alert>
          </Box>
        )}

        {/*
         ** Categories
         **/}
        {categories.map((category) => (
          <Box
            sx={{
              mt: 4,
              scrollMarginTop: 2,
              '&[data-hash-highlighted="true"]': {
                "--category-highlight-color": "#3DFC69",
                "--category-highlight-text-color": "black",
              },
            }}
            id={category.object.id}
            key={category.object.id}
          >
            <CategoryBox
              category={category}
              defaultExpanded={sharedRulePath !== null}
            />
          </Box>
        ))}
      </Container>

      <JsonModal />
      <Snackbar />
    </Fragment>
  );
};

export default App;
