import axios from 'axios';
import { useEffect, useState } from 'react';
import Loader from 'react-loader-spinner';
import { useDispatch, useSelector } from 'react-redux';
import useSWR from 'swr';
import { faHatWizard, faBars} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useRouter } from 'next/router';
import Options from '../AdvancedSearch/Options';
import getConfig from 'next/config';
const { publicRuntimeConfig } = getConfig();
import SearchHeader from '../SearchHeader/SearchHeader';
import { processUrl } from '../../Admin/Registries';

import {
  countloader,
  countloadercontainer,
  standarderror,
  standardresultsloading,
  standardcontainer
} from '../../../styles/standardsearch.module.css';

import viewStyles from '../../../styles/view.module.css';
import advStyles from '../../../styles/advancedsearch.module.css';
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
    let collectionUrls = '';
    for (const collection of collections) {
      collectionUrls += getUrl(collection.value, 'collection');
    }
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
    setUrl(url);
  };
  
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
      if (filter.filter && filter.value)
        url += getUrl(filter.value, filter.filter);
    }
    return url;
  };

  const getUrl = (value, term, isDate = false) => {
    if (value) {
      if (!isDate) return `${term}=<${encodeURIComponent(value)}>&`;
      return `${term}=${encodeURIComponent(value.toISOString().slice(0, 10))}&`;
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

  // update search count display
  useEffect(() => {
    if (isCountLoading) {
      setCount(
        <div className={countloadercontainer}>
          <Loader
            className={countloader}
            color="#D25627"
            height={10}
            type="ThreeDots"
            width={25}
          />
        </div>
      );
    }
    if (isCountError) {
      setCount('Error');
    } else {
      setCount(newCount);
    }
  }, [isCountLoading, isCountError, query, extraFilters]);

  // get search results
  const { results, isLoading, isError } = useSearchResults(
    encodeURIComponent(query),
    url,
    offset,
    limit,
    token,
    dispatch
  );

if (isError) {
    return (
      <div className={standarderror}>
        Errors were encountered while fetching the data
      </div>
    );
  }
  if (isLoading) {
    return (
        <div className={standardresultsloading}>
          <Loader color="#D25627" type="ThreeDots" />
        </div>
    );
  }
  for (const result of results) {
    getTypeAndUrl(result, registries);
  }
  return (
  <div className={viewStyles.container}>
    <div
      className={
        translation === 0
          ? viewStyles.searchSidepanelcontaineropen
          : viewStyles.searchSidepanelcontainercollapse
      }
    >
      <div className={viewStyles.sidepanel}
        style={{
          transform: `translateX(-${translation}rem)`,
          transition: 'transform 0.3s'
        }}
      >
        <div className={viewStyles.headercontainer}>
          <div className={viewStyles.emptySpace}>
          </div>
          <div
              className={viewStyles.panelbutton}
              role="button"
              onClick={() => {
                translation == 14 ? setTranslation(0) : setTranslation(14);
              }}
            >
            <FontAwesomeIcon icon={faBars} size="1x" />
          </div>
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
            <div
              className={advStyles.searchbutton}
              role="button"
              onClick={constructSearch}
              style={{
                backgroundColor: theme?.themeParameters?.[0]?.value || '#333', // Use theme color or default to #333
                color: theme?.themeParameters?.[1]?.value || '#fff', // Use text color from theme or default to #fff
              }}
            >
            <FontAwesomeIcon
              icon={faHatWizard}
              size="1x"
              className={advStyles.dnaicon}
              color="#F2E86D"
            />
            <div>Search</div>
          </div>
        </div>

        </div>
      </div>
    </div>
    <div className={viewStyles.searchContent}>
        <SearchHeader selected="Standard Search" />
        <ResultTable count={count} data={results} />
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
