import lunr from "lunr";

const unicodeTrimmer = (token: lunr.Token) =>
  token.update((value) =>
    value.replace(/^[^\p{L}\p{M}\p{N}_]+|[^\p{L}\p{M}\p{N}_]+$/gu, ""),
  );

lunr.Pipeline.registerFunction(unicodeTrimmer, "unicodeTrimmer");

export const getDocumentPriority = ({
  author,
  maintainers,
  extraDescriptionPath,
}: {
  author?: string;
  maintainers?: readonly string[];
  extraDescriptionPath?: string;
}) => {
  const attributed = Boolean(author) || (maintainers?.length ?? 0) > 0;
  const documented = Boolean(extraDescriptionPath);

  if (attributed && documented) return 3;
  if (attributed) return 2;
  if (documented) return 1;
  return 0;
};

export const titleIncludesSearchQuery = (
  title: string,
  searchQuery: string,
) => {
  const normalizedTitle = title.toLowerCase();
  const tokens = lunr.tokenizer(searchQuery.toLowerCase());
  return (
    tokens.length > 0 &&
    tokens.every((token) => normalizedTitle.includes(token.toString()))
  );
};

type SearchResultMetadata = {
  readonly title?: string;
  readonly author?: string;
  readonly maintainers?: readonly string[];
  readonly extraDescriptionPath?: string;
  readonly extraDescriptionText?: string;
};

export const sortSearchResults = (
  results: readonly lunr.Index.Result[],
  metadataById: ReadonlyMap<string, SearchResultMetadata>,
  searchQuery: string,
) => {
  const rankingsById = new Map(
    Array.from(metadataById, ([id, metadata]) => [
      id,
      {
        priority: getDocumentPriority(metadata),
        titleMatches: titleIncludesSearchQuery(
          metadata.title ?? "",
          searchQuery,
        ),
        extraDescriptionLength: metadata.extraDescriptionPath
          ? (metadata.extraDescriptionText?.length ?? 0)
          : 0,
      },
    ]),
  );

  // Search result order (highest priority first):
  // 1. Metadata tier: author/maintainers + extra description,
  //    author/maintainers, extra description, neither.
  // 2. The title contains every search token.
  // 3. The extra description is longer.
  // 4. The Lunr relevance score is higher.
  return results.toSorted((a, b) => {
    const aRanking = rankingsById.get(a.ref) ?? {
      priority: 0,
      titleMatches: false,
      extraDescriptionLength: 0,
    };
    const bRanking = rankingsById.get(b.ref) ?? {
      priority: 0,
      titleMatches: false,
      extraDescriptionLength: 0,
    };

    return (
      bRanking.priority - aRanking.priority ||
      Number(bRanking.titleMatches) - Number(aRanking.titleMatches) ||
      bRanking.extraDescriptionLength - aRanking.extraDescriptionLength ||
      b.score - a.score
    );
  });
};

export const configureUnicodeTrimmer = (builder: lunr.Builder) => {
  builder.pipeline.before(lunr.stopWordFilter, unicodeTrimmer);
  builder.pipeline.remove(lunr.trimmer);
};

export const getEditDistance = (query: string): 0 | 1 | 2 => {
  if (query.length <= 4) return 0;
  if (query.length <= 7) return 1;
  return 2;
};

const searchToken = (index: lunr.Index, queryString: string) =>
  index.query((query) => {
    const editDistance = getEditDistance(queryString);
    const isAscii = Array.from(queryString).every(
      (character) => character.charCodeAt(0) <= 0x7f,
    );
    const wildcard = isAscii
      ? lunr.Query.wildcard.TRAILING
      : lunr.Query.wildcard.LEADING | lunr.Query.wildcard.TRAILING;
    query.term(queryString, {
      boost: 100,
    });
    query.term(queryString, {
      wildcard,
      boost: 10,
    });
    if (editDistance > 0) {
      query.term(queryString, {
        editDistance,
        usePipeline: false,
      });
    }
  });

export const searchIndex = (index: lunr.Index, searchQuery: string) => {
  const tokens = lunr
    .tokenizer(searchQuery.toLowerCase())
    .map((token) => token.toString());
  if (tokens.length === 0) return [];

  const [firstToken, ...remainingTokens] = tokens;
  const matches = new Map(
    searchToken(index, firstToken).map((result) => [result.ref, { ...result }]),
  );

  remainingTokens.forEach((token) => {
    const tokenMatches = new Map(
      searchToken(index, token).map((result) => [result.ref, result]),
    );

    matches.forEach((result, ref) => {
      const tokenMatch = tokenMatches.get(ref);
      if (tokenMatch === undefined) {
        matches.delete(ref);
      } else {
        result.score += tokenMatch.score;
      }
    });
  });

  return Array.from(matches.values()).sort((a, b) => b.score - a.score);
};
