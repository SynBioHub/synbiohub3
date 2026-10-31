import axios from 'axios';
import { useMemo } from 'react';
import Loader from 'react-loader-spinner';
import { useDispatch, useSelector } from 'react-redux';
import useSWR from 'swr';
import getConfig from 'next/config';

import { addError } from '../../../redux/actions';
import useDebouncedValue from '../../../utilities/useDebouncedValue';
import ResultTable from '../StandardSearch/ResultTable/ResultTable';
import { getTypeAndUrl } from '../StandardSearch/StandardSearch';
import {
  standarderror,
  standardresultsloading,
  standardhint
} from '../../../styles/standardsearch.module.css';

const { publicRuntimeConfig } = getConfig();

/**
 * Results of SBOLExplorer's /vector_search: the parts closest in meaning to
 * the query, shown in the same table as Standard Search, without the facets
 */
export default function SemanticSearch() {
  const inputQuery = useSelector(state => state.search.query);
  const query = useDebouncedValue(inputQuery, 500);
  const offset = useSelector(state => state.search.offset);
  const limit = useSelector(state => state.search.limit);
  const token = useSelector(state => state.user.token);
  const registries = JSON.parse(localStorage.getItem('registries')) || {};
  const dispatch = useDispatch();

  const requestUrl = query
    ? `${publicRuntimeConfig.backend}/vector_search?${new URLSearchParams({
      query,
      size: String(limit),
      offset: String(offset)
    }).toString()}`
    : null;

  const { data, error } = useSWR(
    requestUrl ? [requestUrl, token, dispatch] : null,
    fetcher
  );
  const unavailable = Boolean(data?.unavailable);

  const results = useMemo(() => {
    if (!data || unavailable) return undefined;
    const rows = data.hits.map(hitToRow);
    for (const row of rows) getTypeAndUrl(row, registries);
    return rows;
  }, [data, unavailable]);

  if (!query) {
    return <div className={standardhint}>Type a query to find parts by meaning</div>;
  }
  if (unavailable) {
    return (
      <div className={standarderror}>
        Semantic search is unavailable: SBOLExplorer&apos;s vector search is not
        enabled on this SynBioHub.
      </div>
    );
  }
  if (error) {
    return <div className={standarderror}>Errors were encountered while fetching the data</div>;
  }
  if (!results) {
    return (
      <div className={standardresultsloading}>
        <Loader color="#D25627" type="ThreeDots" />
      </div>
    );
  }
  // An older SBOLExplorer sends no count; show what has been fetched so far
  const count = data.count ?? offset + results.length;
  return <ResultTable count={count} data={results} isLoading={false} />;
}

// Maps a /vector_search hit onto the row shape that /search returns
const hitToRow = hit => {
  const part = hit._source;
  return {
    uri: part.subject,
    displayId: part.displayId,
    name: part.name,
    description: part.description,
    version: part.version,
    type: String(part.type || ''),
    sbolType: part.sboltype,
    role: part.role
  };
};

// Search by meaning is off when SBOLExplorer is disabled (SynBioHub answers
// 501) or its vector search is off (503). That is a state to show, not an error.
const fetcher = (url, token, dispatch) =>
  axios
    .get(url, {
      headers: {
        Accept: 'application/json',
        'X-authorization': token
      }
    })
    .then(response => response.data)
    .catch(error => {
      if (error.response && [501, 503].includes(error.response.status)) {
        return { unavailable: true };
      }
      error.customMessage = 'Request failed while fetching semantic search results';
      error.fullUrl = url;
      dispatch(addError(error));
      throw error;
    });
