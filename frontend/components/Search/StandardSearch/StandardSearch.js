import axios from 'axios';
import { useEffect, useState } from 'react';
import Loader from 'react-loader-spinner';
import { useDispatch, useSelector } from 'react-redux';
import { setOffset } from '../../../redux/actions'
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

  const [url, setUrl] = useState('');
  const [translation, setTranslation] = useState(0);
  const router = useRouter();

  useEffect(() => {
    if (theme.requireLogin && !loggedIn) {
      router.push('/login'); // Redirect to the login page
    }
  }, [theme.requireLogin, router]);


  const constructSearch = () => {
    const collectionUrls =
      collections.length > 0
        ? `collection=${encodeURIComponent(
            `VALUES ?collectionMatch { ${collections
              .map(collection => `<${collection.value}>`)
              .join(' ')} } ?collectionMatch`
          )}&`
        : '';
    const url = `${getUrl(objectType, 'objectType')}${getUrl(
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
    console.log(url);
    setUrl(url);
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
    let url = '';
    for (const filter of extraFilters) {
      if (filter.filter && filter.value){
        url += getUrl(filter.value, filter.filter);        
      }
    }
    return url;
  };

  const getUrl = (value, term, isDate = false) => {
    if (value) {
      if (isDate) return `${term}=${encodeURIComponent(value.toISOString().slice(0, 10))}&`;
      if (isValidURI(value)) {
        return `${term}=<${encodeURIComponent(value)}>&`;
      } 
      return `${term}='${encodeURIComponent(value)}'&`;
    }
    return '';
  };

  // get search count
  const { newCount, isCountLoading, isCountError } = useSearchCount(
    encodeURIComponent(query),
    url,
    token,
    dispatch
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
    encodeURIComponent(query),
    url,
    offset,
    limit,
    token,
    dispatch
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
const useSearchResults = (query, url, offset, limit, token, dispatch) => {
  query = url + query;
  const { data, error } = useSWR(
    [
      `${publicRuntimeConfig.backend}/search/${query}?offset=${offset}&limit=${limit}`,
      token,
      dispatch
    ],
    fetcher
  );
  return {
    results: data,
    isLoading: !error && !data,
    isError: error
  };
};

const useSearchCount = (query, url, token, dispatch) => {
  query = url + query;
  const { data, error } = useSWR(
    [`${publicRuntimeConfig.backend}/searchCount/${query}`, token, dispatch],
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
