import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
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
import { Category, SEARCH_RESULT_CATEGORY_ID } from "./models";
import { isDistResult } from "./utils/distResult";
import {
  configureUnicodeTrimmer,
  searchIndex,
  sortCategoryFiles,
  sortSearchResults,
} from "./utils/search";
import {
  clearHashTargetHighlight,
  highlightLocationHashTarget,
} from "./utils/hashTarget";
import {
  CategoryBox,
  JsonModal,
  SearchInput,
  SearchSuggestions,
  SharedRuleView,
  Snackbar,
  TableOfContents,
} from "./components";

const App = () => {
  const { query: searchQuery } = useSearchQuery();
  const tableOfContentsNavRef = useRef<HTMLElement>(null);
  const sharedRulePath = new URLSearchParams(window.location.search).get(
    "rule",
  );

  const [fetching, setFetching] = useState(true);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [revision, setRevision] = useState("");
  const [updatedAt, setUpdatedAt] = useState(0);
  const [fetchError, setFetchError] = useState("");

  useLayoutEffect(() => {
    const element = tableOfContentsNavRef.current;
    if (!element) return;

    let animationFrame: number | undefined;
    const updateAvailableHeight = () => {
      animationFrame = undefined;
      const top = Math.max(0, element.getBoundingClientRect().top);
      element.style.setProperty(
        "--toc-available-height",
        `${Math.max(0, window.innerHeight - top)}px`,
      );
    };
    const scheduleUpdate = () => {
      if (animationFrame === undefined) {
        animationFrame = window.requestAnimationFrame(updateAvailableHeight);
      }
    };

    updateAvailableHeight();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);

    return () => {
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      if (animationFrame !== undefined) {
        window.cancelAnimationFrame(animationFrame);
      }
    };
  }, [fetching, sharedRulePath]);

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
        setSearchSuggestions(result.search_suggestions);
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
    // Shared rule pages do not provide search. On the regular page, build the
    // index once per dist.json result and retain it when the query is cleared.
    if (allCategories.length === 0 || sharedRulePath !== null) {
      return undefined;
    }

    return lunr((l) => {
      configureUnicodeTrimmer(l);
      l.ref("fileId");
      l.field("title", { boost: 2 });
      l.field("text");

      allCategories.forEach((c) => {
        c.files.forEach((f) => {
          const { json } = f.object;
          let text = json.author ?? "";
          if (json.maintainers !== undefined) {
            json.maintainers.forEach((m) => {
              text = `${text} ${m ?? ""}`;
            });
          }
          json.rules?.forEach((r) => {
            text = `${text} ${r.description ?? ""}`;
            r.description_notes?.forEach((note) => {
              text = `${text} ${note}`;
            });
          });
          text = `${text} ${f.object.extra_description_text ?? ""}`;

          l.add({
            fileId: f.id,
            title: json.title ?? "",
            text: text.toLowerCase(),
          });
        });
      });
    });
  }, [allCategories, sharedRulePath]);

  //
  // Update categories
  //

  const sortedAllCategories = useMemo(
    () =>
      allCategories.map(
        (category) =>
          new Category({
            ...category.object,
            files: sortCategoryFiles(category.object.files),
          }),
      ),
    [allCategories],
  );

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
      return sortedAllCategories;
    }

    //
    // Filter categories by search query
    //

    if (lunrIndex === undefined) {
      return [];
    }

    const results = searchIndex(lunrIndex, searchQuery);

    const filesById = new Map(
      allCategories.flatMap((category) =>
        category.files.map((file) => [file.id, file.object] as const),
      ),
    );
    const sortedResults = sortSearchResults(results, filesById);
    const files = sortedResults.flatMap((result) => {
      const file = filesById.get(result.ref);
      return file === undefined ? [] : [file];
    });

    return [
      new Category({
        id: SEARCH_RESULT_CATEGORY_ID,
        name: "Search Result",
        files,
      }),
    ];
  }, [
    searchQuery,
    sharedRulePath,
    allCategories,
    sortedAllCategories,
    lunrIndex,
  ]);

  const searchSuggestionCounts = useMemo(() => {
    if (lunrIndex === undefined) return undefined;

    return new Map(
      searchSuggestions.map((suggestion) => [
        suggestion,
        searchIndex(lunrIndex, suggestion).length,
      ]),
    );
  }, [lunrIndex, searchSuggestions]);

  const sharedRule =
    sharedRulePath === null ? undefined : categories[0]?.files[0];

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Link href="./" color="inherit" underline="none">
            <Typography sx={{ fontWeight: "bold" }}>
              Karabiner-Elements complex_modifications rules
            </Typography>
          </Link>

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

      <Container maxWidth="xl">
        {fetchError !== "" && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {fetchError}
          </Alert>
        )}

        {sharedRulePath === null ? (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "minmax(0, 1fr)",
                md: "18rem minmax(0, 1fr)",
              },
              gap: 4,
              alignItems: "start",
            }}
          >
            {fetching ? (
              <Box
                role="status"
                aria-label="Loading rules"
                sx={{
                  gridColumn: "1 / -1",
                  minHeight: "50vh",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 2,
                  textAlign: "center",
                }}
              >
                <CircularProgress size={64} />
                <Typography color="text.secondary">Loading rules...</Typography>
              </Box>
            ) : (
              <>
                <Box
                  ref={tableOfContentsNavRef}
                  component="nav"
                  aria-label="Table of contents"
                  sx={{
                    mt: 2,
                    py: 2,
                    position: { md: "sticky" },
                    top: { md: 0 },
                    height: {
                      md: "var(--toc-available-height, 100vh)",
                    },
                    boxSizing: "border-box",
                    display: "flex",
                    flexDirection: "column",
                    order: { xs: 2, md: 1 },
                  }}
                >
                  <TableOfContents categories={categories} />
                </Box>

                <Box
                  sx={{
                    "--sticky-search-height": "88px",
                    order: { xs: 1, md: 2 },
                  }}
                >
                  <Box
                    sx={{
                      mt: 2,
                      py: 2,
                      textAlign: "center",
                      position: { md: "sticky" },
                      top: { md: 0 },
                      zIndex: 910,
                      bgcolor: "background.default",
                    }}
                  >
                    <SearchInput key={searchQuery} />
                  </Box>

                  {searchSuggestionCounts !== undefined && (
                    <Box sx={{ mb: 2 }}>
                      <SearchSuggestions
                        suggestions={searchSuggestions}
                        counts={searchSuggestionCounts}
                      />
                    </Box>
                  )}

                  {categories.map((category) => (
                    <Box
                      sx={{
                        mb: 4,
                        contentVisibility:
                          category.object.id === SEARCH_RESULT_CATEGORY_ID
                            ? "visible"
                            : "auto",
                        containIntrinsicSize: "auto 500px",
                        scrollMarginTop: {
                          xs: "16px",
                          md: "var(--sticky-search-height)",
                        },
                        '&[data-hash-highlighted="true"]': {
                          "--category-highlight-color": "#3DFC69",
                          "--category-highlight-text-color": "black",
                        },
                      }}
                      id={
                        category.object.id === SEARCH_RESULT_CATEGORY_ID
                          ? undefined
                          : category.object.id
                      }
                      key={category.object.id}
                    >
                      <CategoryBox category={category} />
                    </Box>
                  ))}
                </Box>
              </>
            )}
          </Box>
        ) : (
          <>
            <Box sx={{ mt: 4 }}>
              <Alert
                variant="outlined"
                severity={
                  sharedRule === undefined && !fetching ? "error" : "info"
                }
                action={
                  <Button
                    component={Link}
                    href="./"
                    variant="outlined"
                    sx={{ textTransform: "none" }}
                  >
                    Show all rules
                  </Button>
                }
              >
                {sharedRule !== undefined ? (
                  <>
                    Showing only the rule specified by this URL: &ldquo;
                    <strong>
                      {sharedRule.object.json.title ?? sharedRule.id}
                    </strong>
                    &rdquo;.
                  </>
                ) : fetching ? (
                  <Box
                    component="span"
                    sx={{ display: "flex", alignItems: "center", gap: 1 }}
                  >
                    <CircularProgress size={20} />
                    Loading the rule specified by this URL...
                  </Box>
                ) : (
                  "The rule was not found."
                )}
              </Alert>
            </Box>
            {sharedRule !== undefined && (
              <Box sx={{ mt: 2, mb: 4 }}>
                <SharedRuleView jsonFile={sharedRule} />
              </Box>
            )}
          </>
        )}
      </Container>

      <JsonModal />
      <Snackbar />
    </>
  );
};

export default App;
