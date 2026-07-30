import axios from 'axios';
import { useEffect, useState } from 'react';
import Loader from 'react-loader-spinner';
import { useDispatch, useSelector } from 'react-redux';
import { setOffset, addError } from '../../../redux/actions'
import useSWR from 'swr';
import { faHatWizard, faBars } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useRouter } from 'next/router';
import Options from '../AdvancedSearch/Options';
import SelectedFilters from './SelectedFilters';
import getConfig from 'next/config';
const { publicRuntimeConfig } = getConfig();
import SearchHeader from '../SearchHeader/SearchHeader';
import { processUrl } from '../../Admin/Registries';
import { isValidURI } from '../../Viewing/Shell';
import lookupRole from '../../../namespace/lookupRole';


import {
  standarderror,
  standardresultsloading,
  standardcontainer
} from '../../../styles/standardsearch.module.css';

import viewStyles from '../../../styles/view.module.css';
import ResultTable from './ResultTable/ResultTable';
import { filter } from 'jszip';

/**
 * This component handles a basic 'string search' from users on sbh,
 * otherwise known as a standard search
 */


export default function StandardSearch() {
  const theme = JSON.parse(localStorage.getItem('theme')) || {};
  const query = useSelector(state => state.search.query);
  const offset = useSelector(state => state.search.offset);
  const limit = useSelector(state => state.search.limit);
  const token = useSelector(state => state.user.token);
  const loggedIn = useSelector(state => state.user.loggedIn);
  const registries = JSON.parse(localStorage.getItem("registries")) || {};
  const [count, setCount] = useState();
  const dispatch = useDispatch();
  const [creator, setCreator] = useState('');
  const [created, setCreated] = useState([
    {
      startDate: null,
      endDate: null,
      key: 'selection'
    }
  ]);
  const [modifed, setModified] = useState([
    {
      startDate: null,
      endDate: null,
      key: 'selection'
    }
  ]);
  const [objectType, setObjectType] = useState('');
  const [role, setRole] = useState('');
  const [sbolType, setSbolType] = useState('');
  const [collections, setCollections] = useState([]);
  const [extraFilters, setExtraFilters] = useState([]);

  const [url, setUrl] = useState(''); // v1: path filter blob
  const [searchParams, setSearchParams] = useState(''); // v3: query string without '?'
  const [translation, setTranslation] = useState(0);
  const router = useRouter();

  const [sbhVersion, setSbhVersion] = useState(1); // 1 or 3
  useEffect(() => {
    axios
      .get(`${publicRuntimeConfig.backend}/getSynBioHubVersion`, {
        headers: {
          Accept: 'application/json',
          'X-authorization': token
        }
      })
      .then(response => {
        const version = Number(
          typeof response.data === 'object'
            ? response.data.version
            : response.data
        );
        setSbhVersion(version === 3 ? 3 : 1);
      })
      .catch(() => {
        setSbhVersion(1); // keep default if endpoint missing / errors
      });
  }, [token]);

  useEffect(() => {
    if (theme.requireLogin && !loggedIn) {
      router.push('/login'); // Redirect to the login page
    }
  }, [theme.requireLogin, router]);

  const normalizeFilterValue = (value, isDate = false) => {
    if (!value) return null;
    if (isDate) return value.toISOString().slice(0, 10);
    // Query params can carry the full URI (domain + path + hash)
    return value;
  };

  const constructSearch = () => {
    if (sbhVersion === 3) {
      const params = new URLSearchParams();
      const add = (term, value, isDate = false) => {
        const v = normalizeFilterValue(value, isDate);
        if (v != null && v !== '') params.append(term, v);
      };

      add('objectType', objectType);
      add('dc:creator', creator);
      add('sbol2:role', role);
      add('sbol2:type', sbolType);
      collections.forEach(c => add('collection', c.value));
      add('createdAfter', created[0].startDate, true);
      add('createdBefore', created[0].endDate, true);
      add('modifiedAfter', modifed[0].startDate, true);
      add('modifiedBefore', modifed[0].endDate, true);
      extraFilters.forEach(f => {
        if (f.filter && f.value) add(f.filter, f.value);
      });

      setSearchParams(params.toString());
      return;
    }

    // SynBioHub 1 (existing path filter string)
    let collectionUrls = '';
    for (const collection of collections) {
      collectionUrls += getUrl(collection.value, 'collection');
    }
    const nextUrl = `${getUrl(objectType, 'objectType')}${getUrl(
      creator,
      'dc:creator'
    )}${getUrl(role, 'sbol2:role')}${getUrl(
      sbolType,
      'sbol2:type'
    )}${collectionUrls}${getUrl(
      created[0].startDate,
      'createdAfter',
      true
    )}${getUrl(created[0].endDate, 'createdBefore', true)}${getUrl(
      modifed[0].startDate,
      'modifedAfter',
      true
    )}${getUrl(
      modifed[0].endDate,
      'modifedBefore',
      true
    )}${constructExtraFilters()}`;
    setUrl(nextUrl);
  };

  // automatically re-run the search whenever a filter selection changes,
  // so selecting a facet doesn't require clicking the Search button
  useEffect(() => {
    dispatch(setOffset(0));
    constructSearch();
  }, [
    creator,
    role,
    sbolType,
    objectType,
    collections,
    extraFilters,
    created,
    modifed
  ]);

  const handleDelete = (delFilterIndex) => {
    setExtraFilters(prevFilters => {
      return prevFilters.filter((_, index) => index !== delFilterIndex);
    });
  };

  const handleClearAllFilters = () => {
    setCreator('');
    setSbolType('');
    setRole('');
    setObjectType('');
    setCollections([]);
    setExtraFilters([]);
  };


  const addFilter = filters => {
    return [
      ...filters,
      {
        filter: '',
        value: ''
      }
    ];
  };

  const constructExtraFilters = () => {
    let filterUrl = '';
    for (const filter of extraFilters) {
      if (filter.filter && filter.value) {
        filterUrl += getUrl(filter.value, filter.filter);
      }
    }
    return filterUrl;
  };

  // SynBioHub 1 only: build path filter fragments
  const getUrl = (value, term, isDate = false) => {
    if (!value) return '';
    if (isDate) return `${term}=${encodeURIComponent(value.toISOString().slice(0, 10))}&`;
    if (isValidURI(value)) {
      return `${term}=<${encodeURIComponent(value)}>&`;
    }
    return `${term}='${encodeURIComponent(value)}'&`;
  };

  const filterString = sbhVersion === 3 ? searchParams : url;

  // get search count
  const { newCount, isCountLoading, isCountError } = useSearchCount(
    query,
    filterString,
    token,
    dispatch,
    sbhVersion
  );

  // update search count display, keeping the last known count visible
  // while a new one is loading instead of blanking it out
  useEffect(() => {
    if (isCountError) {
      setCount('Error');
    } else if (!isCountLoading) {
      setCount(newCount);
    }
  }, [isCountLoading, isCountError, newCount, query, extraFilters]);

  // get search results
  const { results, isLoading, isError } = useSearchResults(
    query,
    filterString,
    offset,
    limit,
    token,
    dispatch,
    sbhVersion
  );

  if (!isLoading && !isError) {
    for (const result of results) {
      getTypeAndUrl(result, registries);
    }
  }

  // keep showing the last successful results (dimmed via isLoading) while a
  // new search runs, instead of unmounting the whole table on every filter
  // change
  const [displayResults, setDisplayResults] = useState([]);
  useEffect(() => {
    if (!isLoading && !isError && results) {
      setDisplayResults(results);
    }
  }, [results, isLoading, isError]);

  let resultsContent;
  if (isError) {
    resultsContent = (
      <div className={standarderror}>
        Errors were encountered while fetching the data
      </div>
    );
  } else if (isLoading && displayResults.length === 0) {
    resultsContent = (
      <div className={standardresultsloading}>
        <Loader color="#D25627" type="ThreeDots" />
      </div>
    );
  } else {
    resultsContent = (
      <ResultTable count={count} data={displayResults} isLoading={isLoading}>
        <SelectedFilters
          creator={creator}
          setCreator={setCreator}
          sbolType={sbolType}
          setSbolType={setSbolType}
          role={role}
          setRole={setRole}
          objectType={objectType}
          setObjectType={setObjectType}
          collections={collections}
          setCollections={setCollections}
          extraFilters={extraFilters}
          onRemoveExtraFilter={handleDelete}
          onClearAll={handleClearAllFilters}
        />
      </ResultTable>
    );
  }

  return (
  <div className={viewStyles.container}>
    <div
      className={viewStyles.panelbutton}
      role="button"
      onClick={() => {
        translation == 14 ? setTranslation(0) : setTranslation(14);
      }}
    >
      <FontAwesomeIcon icon={faBars} size="1x" />
    </div>
    <div
      className={
        translation === 0
          ? viewStyles.searchSidepanelcontaineropen
          : viewStyles.searchSidepanelcontainercollapse
      }
    >
      <div
        className={`${viewStyles.sidepanel} ${viewStyles.searchSidepanelHeight}`}
        style={{
          transform: `translateX(-${translation}rem)`,
          transition: 'transform 0.3s'
        }}
      >
        <div className={viewStyles.headercontainer}>
          <div className={viewStyles.emptySpace}></div>
        </div>

          <div className={viewStyles.searchBoundedheightforsidepanel}
            style={{
              transform: `translateX(-${translation === 14 ? 2.5 : 0}rem)`,
              transition: 'transform 0.3s'
            }}
          >
            <div>
              <Options
                creator={creator}
                setCreator={setCreator}

                objectType={objectType}
                setObjectType={setObjectType}

                sbolType={sbolType}
                setSbolType={setSbolType}

                role={role}
                setRole={setRole}

                collections={collections}
                setCollections={setCollections}

                modified={modifed}
                setModified={setModified}

                extraFilters={extraFilters}
                setExtraFilters={setExtraFilters}

              addFilter={addFilter}
              handleDelete={handleDelete}
            />
        </div>

          </div>
        </div>
      </div>
      <div className={viewStyles.searchContent}>
        <SearchHeader selected="Standard Search" />
        {resultsContent}
      </div>
    </div>
  );
}
const useSearchResults = (query, filterString, offset, limit, token, dispatch, sbhVersion) => {
  let requestUrl;
  if (sbhVersion === 3) {
    const params = new URLSearchParams(filterString);
    if (query) params.set('keyword', query);
    params.set('offset', String(offset));
    params.set('limit', String(limit));
    requestUrl = `${publicRuntimeConfig.backend}/search?${params.toString()}`;
  } else {
    requestUrl = `${publicRuntimeConfig.backend}/search/${filterString}${encodeURIComponent(
      query
    )}?offset=${offset}&limit=${limit}`;
  }

  const { data, error } = useSWR(
    [requestUrl, token, dispatch],
    fetcher
  );
  return {
    results: data,
    isLoading: !error && !data,
    isError: error
  };
};

const useSearchCount = (query, filterString, token, dispatch, sbhVersion) => {
  let requestUrl;
  if (sbhVersion === 3) {
    const params = new URLSearchParams(filterString);
    if (query) params.set('keyword', query);
    requestUrl = `${publicRuntimeConfig.backend}/searchCount?${params.toString()}`;
  } else {
    requestUrl = `${publicRuntimeConfig.backend}/searchCount/${filterString}${encodeURIComponent(
      query
    )}`;
  }

  const { data, error } = useSWR(
    [requestUrl, token, dispatch],
    fetcher
  );
  return {
    newCount: data,
    isCountLoading: !error && !data,
    isCountError: error
  };
};

function getType(member) {
  var memberType = member.type
    ? member.type.slice(member.type.lastIndexOf('#') + 1)
    : 'Unknown';
  if (member.sbolType) {
    memberType = member.sbolType.slice(member.sbolType.lastIndexOf('#') + 1);
  }
  if (member.role) {
    memberType = lookupRole(member.role).description.name;
  }
  return memberType;
}


const getTypeAndUrl = async (result, registries) => {
  let type = '';
  const potentialType = result.type.toLowerCase();

  // Identify what type of object the search result is from type url
  if (potentialType.includes('component')) {
    type = 'Component';
  }
  if (potentialType.includes('sequence')) {
    type = 'Sequence';
  }
  if (potentialType.includes('module')) {
    type = 'Module';
  }
  if (potentialType.includes('collection')) {
    type = 'Collection';
  }

  result.type = type;
  result.derivedType = getType(result);

  const processed = await processUrl(result.uri, registries);
  result.url = processed.urlRemovedForLink || processed.original;

  // let newUrl = result.uri.replace('https://synbiohub.org', '');
  // newUrl = newUrl.replace('https://dev.synbiohub.org', '');
  // result.url = newUrl;
};


const fetcher = (url, token, dispatch) =>
  axios
    .get(url, {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/plain',
        'X-authorization': token
      }
    })
    .then(response => response.data)
    .catch(error => {
      error.customMessage =
        'Request failed while fetching search result-related data';
      error.fullUrl = url;
      dispatch(addError(error));
    });
