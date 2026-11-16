import { useEffect, useState } from 'react';

import { setLimit, setOffset, setSearchQuery } from '../../../redux/actions';

const restoreCollections = (urlCollections, setCollections) => {
  if (!urlCollections) return;
  const uris = Array.isArray(urlCollections)
    ? urlCollections
    : [urlCollections];
  setCollections(uris.map(uri => ({ value: uri, label: uri })));
};

const restoreExtraFilters = (encoded, setExtraFilters) => {
  if (!encoded) return;
  try {
    const parsed = JSON.parse(encoded);
    if (Array.isArray(parsed)) {
      setExtraFilters(
        parsed.filter(
          item =>
            item &&
            typeof item.filter === 'string' &&
            typeof item.value === 'string'
        )
      );
    }
  } catch {
    // malformed extraFilters in the URL - ignore and keep defaults
  }
};

/**
 * Keeps the search query and filters in sync with the URL: restores them
 * from the URL once on mount (so a browser refresh, or navigating back from
 * a result's detail page, lands on the same search), then writes any change
 * back to the URL via a shallow route replace.
 */
export default function useSearchUrlSync({
  dispatch,
  router,
  query,
  offset,
  limit,
  stringFilters,
  collections,
  setCollections,
  extraFilters,
  setExtraFilters
}) {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const urlQuery = router.query;

    if (urlQuery.q) dispatch(setSearchQuery(urlQuery.q));
    if (urlQuery.offset)
      dispatch(setOffset(Number.parseInt(urlQuery.offset, 10)));
    if (urlQuery.limit) dispatch(setLimit(Number.parseInt(urlQuery.limit, 10)));

    for (const [key, [, setValue]] of Object.entries(stringFilters)) {
      if (urlQuery[key]) setValue(urlQuery[key]);
    }
    restoreCollections(urlQuery.collections, setCollections);
    restoreExtraFilters(urlQuery.extraFilters, setExtraFilters);

    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    const queryParameters = {};
    if (query) queryParameters.q = query;
    if (offset) queryParameters.offset = String(offset);
    if (limit && limit !== 50) queryParameters.limit = String(limit);

    for (const [key, [value]] of Object.entries(stringFilters)) {
      if (value) queryParameters[key] = value;
    }
    if (collections.length > 0)
      queryParameters.collections = collections.map(c => c.value);

    const validExtraFilters = extraFilters.filter(f => f.filter && f.value);
    if (validExtraFilters.length > 0)
      queryParameters.extraFilters = JSON.stringify(validExtraFilters);

    router.replace(
      { pathname: router.pathname, query: queryParameters },
      undefined,
      { shallow: true }
    );
  }, [
    hydrated,
    query,
    offset,
    limit,
    collections,
    extraFilters,
    ...Object.values(stringFilters).map(([value]) => value)
  ]);
}
