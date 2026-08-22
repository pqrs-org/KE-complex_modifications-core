import lunr from "lunr";
import type { KarabinerFileObject } from "../types";

const unicodeTrimmer = (token: lunr.Token) =>
  token.update((value) =>
    value.replace(/^[^\p{L}\p{M}\p{N}_]+|[^\p{L}\p{M}\p{N}_]+$/gu, ""),
  );

lunr.Pipeline.registerFunction(unicodeTrimmer, "unicodeTrimmer");

const searchQueryPipeline = new lunr.Pipeline();
searchQueryPipeline.add(unicodeTrimmer, lunr.stopWordFilter);

const tokenizeSearchQuery = (searchQuery: string) =>
  searchQueryPipeline.run(lunr.tokenizer(searchQuery.toLowerCase()));

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

const getFileRanking = (file: KarabinerFileObject) => {
  const attributed =
    Boolean(file.json.author) || (file.json.maintainers?.length ?? 0) > 0;
  const documented = Boolean(file.extra_description_path);

  return {
    attributed,
    documented,
    priority: getDocumentPriority({
      author: file.json.author,
      maintainers: file.json.maintainers,
      extraDescriptionPath: file.extra_description_path,
    }),
    extraDescriptionLength: documented
      ? (file.extra_description_text?.length ?? 0)
      : 0,
  };
};

export const sortCategoryFiles = (files: readonly KarabinerFileObject[]) =>
  files.toSorted((a, b) => {
    const aRanking = getFileRanking(a);
    const bRanking = getFileRanking(b);

    // Regular category order (highest priority first):
    // 1. Metadata tier: author/maintainers + extra description,
    //    author/maintainers, extra description, neither.
    // 2. The extra description is longer.
    return (
      bRanking.priority - aRanking.priority ||
      bRanking.extraDescriptionLength - aRanking.extraDescriptionLength
    );
  });

export const sortSearchResults = (
  results: readonly SearchResult[],
  filesById: ReadonlyMap<string, KarabinerFileObject>,
) => {
  const rankingsById = new Map(
    Array.from(filesById, ([id, file]) => [id, getFileRanking(file)]),
  );

  // Search result order (highest priority first):
  // 1. The rule has an author or at least one maintainer.
  // 2. Every search token matched the title.
  // 3. The rule has an extra description.
  // 4. The extra description is longer.
  // 5. The Lunr relevance score is higher.
  return results.toSorted((a, b) => {
    const aRanking = rankingsById.get(a.ref) ?? {
      attributed: false,
      documented: false,
      priority: 0,
      extraDescriptionLength: 0,
    };
    const bRanking = rankingsById.get(b.ref) ?? {
      attributed: false,
      documented: false,
      priority: 0,
      extraDescriptionLength: 0,
    };

    return (
      Number(bRanking.attributed) - Number(aRanking.attributed) ||
      Number(b.titleMatches) - Number(a.titleMatches) ||
      Number(bRanking.documented) - Number(aRanking.documented) ||
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

const resultMatchesField = (result: lunr.Index.Result, field: string) =>
  Object.values(
    result.matchData.metadata as Record<string, Record<string, unknown>>,
  ).some((fields) => Object.hasOwn(fields, field));

type SearchResult = lunr.Index.Result & { titleMatches: boolean };

export const searchIndex = (index: lunr.Index, searchQuery: string) => {
  const tokens = tokenizeSearchQuery(searchQuery)
    .map((token) => token.toString())
    // Punctuation-only tokens can become empty after trimming; an empty
    // trailing-wildcard query would match every term in the index.
    .filter((token) => token !== "");
  if (tokens.length === 0) return [];

  const [firstToken, ...remainingTokens] = tokens;
  const matches = new Map(
    searchToken(index, firstToken).map((result) => [
      result.ref,
      {
        ...result,
        titleMatches: resultMatchesField(result, "title"),
      } satisfies SearchResult,
    ]),
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
        result.titleMatches &&= resultMatchesField(tokenMatch, "title");
        result.matchData.combine(tokenMatch.matchData);
      }
    });
  });

  return Array.from(matches.values()).sort((a, b) => b.score - a.score);
};
