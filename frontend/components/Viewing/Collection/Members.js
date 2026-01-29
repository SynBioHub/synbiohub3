import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import useSWR from 'swr';
import axios from 'axios';
import Select from 'react-select';

import getConfig from 'next/config';
const { publicRuntimeConfig } = getConfig();

import CountMembers from '../../../sparql/CountMembers';
import CountMembersTotal from '../../../sparql/CountMembersSearch';
import getCollectionMembers from '../../../sparql/getCollectionMembers';
import getCollectionMembersSearch from '../../../sparql/getCollectionMembersSearch';
import getTypesRoles from '../../../sparql/getTypesRoles';
import styles from '../../../styles/view.module.css';
import MiniLoading from '../../Reusable/MiniLoading';
import Table from '../../Reusable/Table/Table';
import loadTemplate from '../../../sparql/tools/loadTemplate';
import { shortName } from '../../../namespace/namespace';
import lookupRole from '../../../namespace/lookupRole';
import Link from 'next/link';
import { addError, logoutUser } from '../../../redux/actions';
import { processUrl } from '../../Admin/Registries';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faUnlink } from '@fortawesome/free-solid-svg-icons';
import { getAfterThirdSlash } from '../ViewHeader';

/* eslint sonarjs/cognitive-complexity: "off" */

const sortMethods = {
  default: ' ORDER BY ASC(concat(lcase(str(?name)),lcase(str(?displayId)))) ',
  name: ' ORDER BY ASC(concat(lcase(str(?name)))) ',
  displayId: ' ORDER BY ASC(concat(lcase(str(?displayId)))) '
};

const sortOptions = [
  { value: 'default', label: 'Default' },
  { value: 'name', label: 'Name' },
  { value: 'displayId', label: 'Identifier' }
];

export default function Members(properties) {
  const token = useSelector(state => state.user.token);
  const privateGraph = useSelector(state => state.user.graphUri);
  const [search, setSearch] = useState('');
  const [offset, setOffset] = useState(0);
  const [sort, setSort] = useState(sortMethods.displayId);
  const [defaultSortOption, setDefaultSortOption] = useState(sortOptions[0]);
  const [customBounds, setCustomBounds] = useState([0, 10000]);
  const [typeFilter, setTypeFilter] = useState('Show Only Root Objects');
  const dispatch = useDispatch();
  const [processedUri, setProcessedUri] = useState(publicRuntimeConfig.backend);
  const theme = JSON.parse(localStorage.getItem('theme')) || {};
  const registries = JSON.parse(localStorage.getItem("registries")) || {};
  const persistRoot = JSON.parse(localStorage.getItem("persist:root"));
  const rootUser = JSON.parse(persistRoot.username);
  const parts = properties.uri.split('/');
  const urlUsername = parts[4];
  const isOwner = urlUsername === rootUser;
  const currentURL = window.location.href;
  const isPublic = currentURL.includes('/public/');

  let preparedSearch =
    search !== ''
      ? `FILTER(CONTAINS(lcase(str(?uri)), lcase("${search}"))||CONTAINS(lcase(?displayId), lcase("${search}"))||CONTAINS(lcase(?name), lcase("${search}"))||CONTAINS(lcase(?description), lcase("${search}")))`
      : '';

  if (
    typeFilter !== 'Show Only Root Objects' &&
    typeFilter !== 'Show All Objects'
  ) {
    if (
      typeFilter.startsWith('http://www.biopax.org/release/biopax-level3.owl#')
    ) {
      preparedSearch += '\n FILTER(?sbolType = <' + typeFilter + '>)';
    } else if (typeFilter.startsWith('http://identifiers.org/so/')) {
      preparedSearch += '\n FILTER(?role = <' + typeFilter + '>)';
    } else {
      preparedSearch += '\n FILTER(?type = <' + typeFilter + '>)';
    }
  }

  const parameters = {
    from: '',
    graphPrefix: `${theme.uriPrefix}`, // TODO: Maybe get this from somewhere? 
    collection: properties.uri,
    sort: sort,
    search: preparedSearch,
    offset: offset ? ` OFFSET ${offset}` : '',
    limit: ' LIMIT 10000 '
  };

  if (token && !isPublic && !properties.uri.endsWith("/share")) {
    parameters.from = "FROM <" + privateGraph + ">";
  } else if (properties.uri.endsWith("/share")) {
    const parts = properties.uri.split('/');
    const fromPart = parts.slice(0, 5).join('/');
    parameters.from = "FROM <" + fromPart + ">";
    const collectionPart = parts.slice(0, 8).join('/');
    parameters.collection = collectionPart;
  }

  const searchQuery = typeFilter !== 'Show Only Root Objects';

  let query = getCollectionMembers;

  if (typeFilter === 'Show All Objects') {
    query = getCollectionMembersSearch;
  }

  const { members, mutate } = isOwner
    ? useMembers(query, parameters, token, dispatch)
    : useMembers(query, parameters, dispatch);

  const { count: totalMemberCount } = isOwner
    ? useCount(
      CountMembersTotal,
      { ...parameters, search: '' },
      privateGraph ? token : undefined, // Pass token only if privateGraph is true
      dispatch
    )
    : useCount(
      CountMembersTotal,
      { ...parameters, search: '' },
      dispatch);

  const { count: currentMemberCount } = isOwner
    ? useCount(
      searchQuery ? CountMembersTotal : CountMembers,
      parameters,
      privateGraph ? token : undefined, // Pass token only if privateGraph is true
      dispatch
    )
    : useCount(
      searchQuery ? CountMembersTotal : CountMembers,
      parameters,
      dispatch
    );

  useEffect(() => {
    if (properties.refreshMembers) {
      mutate();
      properties.setRefreshMembers(false);
    }
  }, [properties.refreshMembers, mutate]);

  const publicPrefix =  theme.uriPrefix + 'public/';

  const { filters } = !properties.uri.includes(publicPrefix)
    ? useFilters(
      getTypesRoles,
      { uri: properties.uri },
      token,
      dispatch,
      privateGraph
    )
    : useFilters(
      getTypesRoles,
      { uri: properties.uri },
      token,
      dispatch
    );

  const outOfBoundsHandle = offset => {
    const newBounds = getNewBounds(offset, currentMemberCount);
    setCustomBounds(newBounds);
    setOffset(newBounds[0]);
  };

  useEffect(() => {
    let isMounted = true;
    async function processUri() {
      if (isMounted) {
        setProcessedUri(theme.uriPrefix);
      }
    }
    processUri();
    return () => { isMounted = false };
  }, [dispatch]);
  return (
    <React.Fragment>
      <FilterHeader filters={filters} setTypeFilter={setTypeFilter} />
      <SearchHeader
        search={search}
        setSearch={setSearch}
        outOfBoundsHandle={outOfBoundsHandle}
      />
      <MemberTable
        members={members}
        totalMembers={totalMemberCount}
        currMembers={currentMemberCount}
        outOfBoundsHandle={outOfBoundsHandle}
        customBounds={customBounds}
        customSearch={search}
        setSort={setSort}
        defaultSortOption={defaultSortOption}
        setDefaultSortOption={setDefaultSortOption}
        uri={properties.uri}
        processedUri={processedUri}
        mutate={mutate}
        registries={registries}
      />
    </React.Fragment>
  );
}

function SearchHeader(properties) {
  const [search, setSearch] = useState('');

  const runSearch = () => {
    properties.setSearch(search.toLowerCase());
    properties.outOfBoundsHandle(0);
  };

  return (
    <div className={styles.memberheadercontainer}>
      <input
        className={styles.membersearchinput}
        value={search}
        type="text"
        placeholder="Search for collection members"
        onChange={event => {
          setSearch(event.target.value);
        }}
        onKeyPress={event => {
          if (event.key === 'Enter') {
            runSearch();
          }
        }}
      />
      <button
        onClick={() => {
          runSearch();
        }}
      >
        Search
      </button>
    </div>
  );
}

function FilterHeader(properties) {
  const [filters, setFilters] = useState(undefined);

  useEffect(() => {
    if (properties.filters) {
      const newFilters = properties.filters.map(filter => {
        const shortNamedFilter = shortName(filter.uri);
        return { value: filter.uri, label: shortNamedFilter };
      });
      newFilters.sort((a, b) => (a.label > b.label ? 1 : -1));
      newFilters.unshift({
        value: 'Show All Objects',
        label: 'Show All Objects'
      });
      newFilters.unshift({
        value: 'Show Only Root Objects',
        label: 'Show Only Root Objects'
      });
      setFilters(newFilters);
    }
  }, [properties.filters]);

  return (
    <div className={styles.filtercontainer}>
      Show
      {filters ? (
        <Select
          options={filters}
          menuPortalTarget={document.body}
          styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
          className={styles.filterSelect}
          onChange={option => properties.setTypeFilter(option.value)}
        />
      ) : (
        <MiniLoading height={10} />
      )}
    </div>
  );
}

function MemberTable(properties) {
  const [processedMembers, setProcessedMembers] = useState([]);
  const isPublicCollection = properties.uri.includes("/public/");
  const token = useSelector(state => state.user.token);
  const dispatch = useDispatch();

  useEffect(() => {
    async function processMembers() {
      if (properties.members) {
        const updatedMembers = await Promise.all(properties.members.map(async member => {
          const processed = await processUrl(member.uri, properties.registries);
          return {
            ...member,
            uri: processed.urlRemovedForLink
          };
        }));
        setProcessedMembers(updatedMembers);
      }
    }

    processMembers();
  }, [properties.members]);

  let count = (
    <div className={styles.loadinginline}>
      <MiniLoading height={10} />
    </div>
  );
  if (properties.currMembers && properties.totalMembers) {
    count =
      'showing ' +
      Number(properties.currMembers).toLocaleString() +
      ' (filtered from ' +
      Number(properties.totalMembers).toLocaleString() +
      ')';
  }

  const headers = ['Name', 'Identifier', 'Type', 'Description'];
  if (!isPublicCollection) {
    headers.push('Remove');
  }

  return (
    <Table
      data={processedMembers}
      loading={!properties.members}
      title="Members"
      count={count}
      customCount={properties.currMembers}
      customBounds={properties.customBounds}
      outOfBoundsHandle={properties.outOfBoundsHandle}
      customSearch={properties.customSearch}
      hideFilter={true}
      searchable={[]}
      headers={headers}
      customIcon={properties.customIcon}
      sortOptions={sortOptions}
      sortMethods={sortMethods}
      defaultSortOption={properties.defaultSortOption}
      customSortBehavior={(sortMethod, sortOption) => {
        properties.setSort(sortMethod);
        properties.setDefaultSortOption(sortOption);
      }}
      dataRowDisplay={member => {
        var textArea = document.createElement('textarea');
        if (member.name.length > 0) {
          textArea.innerHTML = member.name;
        } else {
          textArea.innerHTML = member.displayId;
        }

        const objectUriParts = getAfterThirdSlash(properties.uri);
        const objectUri = `${publicRuntimeConfig.backend}/${objectUriParts}`;
        const parts = properties.uri.split('/');

        const icon = compareUri(member.uri, `/${objectUriParts}`);

        const removeTrailingSlash = (url) => {
          return url.endsWith('/') ? url.slice(0, -1) : url;
        };

        const handleIconClick = (member) => {
          if (icon && icon === faTrash) {
            handleDelete(member);
          } else if (icon && icon === faUnlink) {
            const processedUriPrefix = removeTrailingSlash(properties.processedUri);
            handleUnlink(member, processedUriPrefix);  // Use processedUri from props
          }
        };

        const handleDelete = async (member) => {
          if (member.uri && window.confirm("Would you like to remove this item from the collection?")) {
            try {
              await axios.get(`${publicRuntimeConfig.backend}${member.uri}/remove`, {
                headers: {
                  "Accept": "text/plain; charset=UTF-8",
                  "X-authorization": token
                }
              });
              // After successful deletion, update the state
              properties.mutate(); // This will re-fetch the members
            } catch (error) {
              console.error('Error removing item:', error);
              // Handle error appropriately
            }
          }
        };

        const handleUnlink = async (member, processedUri) => {
          if (member.uri && window.confirm("Would you like to unlink this item from the collection?")) {
            try {
              await axios.post(`${objectUri}/removeMembership`, {
                "member": `${processedUri}${member.uri}`
              }, {
                headers: {
                  "Accept": "text/plain; charset=UTF-8",
                  "X-authorization": token
                }
              });
              // After successful unlinking, update the state
              properties.mutate(); // This will re-fetch the members
            } catch (error) {
              console.error('Error unlinking item:', error);
              // Handle error appropriately
            }
          }
        };

        const isShareLink = properties.uri.endsWith('/share');
        const customSuffix = isShareLink ? `/${parts.slice(-2).join('/')}` : '';

        return (
          <tr key={member.displayId + member.description}>
            <td>
              <Link href={`${member.uri}${customSuffix}`}>
                <a className={styles.membername}>
                  <code>{textArea.value}</code>
                </a>
              </Link>
            </td>
            <td>
              <Link href={`${member.uri}${customSuffix}`}>
                <a className={styles.memberid}>{member.displayId}</a>
              </Link>
            </td>
            <td>{getType(member)}</td>
            <td>{member.description}</td>
            {!isPublicCollection && icon === faTrash && (
              <td onClick={() => handleIconClick(member)} className={styles.modalicon} title="Delete Member">
                <FontAwesomeIcon icon={faTrash} />
              </td>
            )}
            {!isPublicCollection && icon === faUnlink && (
              <td onClick={() => handleIconClick(member)} className={styles.modalicon} title="Remove member from collection">
                <FontAwesomeIcon icon={faUnlink} />
              </td>
            )}
          </tr>
        );
      }}

    />
  );
}

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
  // if (memberType === 'ComponentDefinition') memberType = 'Component';
  // else if (memberType === 'ModuleDefinition') memberType = 'Module';

  return memberType;
}

function compareUri(memberUri, baseUri) {
  const userUriPrefix = '/user/';
  const publicUriPrefix = '/public/';

  if (memberUri && memberUri.startsWith(userUriPrefix)) {
    // Check if member.uri matches properties.uri for the first 3 slashes
    const matchUri = baseUri.split('/').slice(0, 4).join('/');
    if (memberUri.startsWith(matchUri)) {
      return faTrash;
    }
  } else if (memberUri && memberUri.startsWith(publicUriPrefix)) {
    // Check if member.uri matches properties.uri for the first 2 slashes
    const matchUri = baseUri.split('/').slice(0, 3).join('/');
    if (memberUri.startsWith(matchUri)) {
      return faTrash;
    }
  }
  return faUnlink;
}

const createUrl = (query, options) => {
  query = loadTemplate(query, options);
  return `${publicRuntimeConfig.backend}/sparql?query=${encodeURIComponent(
    query
  )}`;
};

const useCount = (query, options, token, dispatch) => {
  const url = createUrl(query, options, token);
  const currentURL = window.location.href;
  let finalUrl = url;

  if (currentURL.endsWith('/share')) {
    const currentURLObj = new URL(currentURL);
    const urlObj = new URL(url);

    // Replace base (protocol + host + port) of `url` with that of current page
    finalUrl = `${publicRuntimeConfig.backend}${currentURLObj.pathname}${urlObj.pathname}${urlObj.search}`;
  }
  let data, error;

  if (typeof token === 'string') {
    ({ data, error } = useSWR([finalUrl, token, dispatch], fetcher));
  } else {
    ({ data, error } = useSWR([finalUrl, dispatch], fetcher));
  }

  const [processedData, setProcessedData] = useState(undefined);
  
  useEffect(() => {
    if (data) {
      processResults(data).then(result => {
        setProcessedData(result[0]?.count);
      });
    } else {
      setProcessedData(undefined);
    }
  }, [data]);

  return {
    count: processedData
  };
};

const useMembers = (query, options, token, dispatch) => {
  const url = createUrl(query, options);
  const currentURL = window.location.href;
  let finalUrl = url;

  if (currentURL.endsWith('/share')) {
    const currentURLObj = new URL(currentURL);
    const urlObj = new URL(url);

    // Replace base (protocol + host + port) of `url` with that of current page
    finalUrl = `${publicRuntimeConfig.backend}${currentURLObj.pathname}${urlObj.pathname}${urlObj.search}`;
  }
  let data, error, mutate;

  if (typeof token === 'string') {
    ({ data, error, mutate } = useSWR([finalUrl, token, dispatch], fetcher));
  } else {
    ({ data, error, mutate } = useSWR([finalUrl, dispatch], fetcher));
  }
  
  const [processedData, setProcessedData] = useState(undefined);
  
  useEffect(() => {
    if (data) {
      processResults(data).then(result => {
        setProcessedData(result);
      });
    } else {
      setProcessedData(undefined);
    }
  }, [data]);
  
  console.log('processedData', processedData);
  return {
    members: processedData,
    mutate
  };
};

const useFilters = (query, options, token, dispatch, privateGraph=null) => {
  let url = createUrl(query, options);
  if (privateGraph) {
    url += `&default-graph-uri=${privateGraph}`;
  }
  const currentURL = window.location.href;
  let finalUrl = url;
  if (currentURL.endsWith('/share')) {
    const currentURLObj = new URL(currentURL);
    const urlObj = new URL(url);

    // Replace base (protocol + host + port) of `url` with that of current page
    finalUrl = `${publicRuntimeConfig.backend}${currentURLObj.pathname}${urlObj.pathname}${urlObj.search}`;
  }
  let data, error, mutate;

  if (typeof token === 'string') {
    ({ data, error, mutate } = useSWR([finalUrl, token, dispatch], fetcher));
  } else {
    ({ data, error, mutate } = useSWR([finalUrl, dispatch], fetcher));
  }

  const [processedData, setProcessedData] = useState(undefined);
  
  useEffect(() => {
    if (data) {
      processResults(data).then(result => {
        setProcessedData(result);
      });
    } else {
      setProcessedData(undefined);
    }
  }, [data]);

  return {
    filters: processedData,
    mutate
  };
};

const fetcher = (url, token, dispatch) =>
  axios
    .get(url, {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-authorization': token
      }
    })
    .then(response => {
      return response.data;
    })
    .catch(error => {
      error.customMessage =
        'Request failed while getting collection members info';
      error.fullUrl = url;
      console.log(error.response.status);
      // Check if the error is 401 Unauthorized or 400 Bad Request
      if (error.response && (error.response.status === 401 || error.response.status === 400)) {
        // Token is invalid (either missing or expired/invalidated by backend restart)
        // Always clear the token and log out the user
        console.log('Token invalid or expired, logging out user');
        dispatch(logoutUser());
        window.location.href = '/login';
      } else {
        // For other errors, just dispatch the error
        dispatch(addError(error));
      }
    });

const processResults = async (results) => {
  const registries = JSON.parse(localStorage.getItem("registries")) || {};
  console.log('registries', registries);
  const localUriPrefix = (JSON.parse(localStorage.getItem('theme')) || {}).uriPrefix || '';
  const headers = results.head.vars;
  return Promise.all(results.results.bindings.map(async (result) => {
    const resultObject = {};
    const currentUri = result.uri ? result.uri.value : '';
    console.log('currentUri', currentUri);
    const registriesArray = Array.isArray(registries) 
      ? registries 
      : Object.values(registries).filter(r => r && typeof r === 'object');
    let isExternalRegistry = currentUri && registriesArray.some(registry => 
      registry.uri && currentUri.startsWith(registry.uri)
    );
    if (currentUri && currentUri.startsWith(localUriPrefix)) {
      isExternalRegistry = false;
    }
    console.log('isExternalRegistry', isExternalRegistry);
    let externalMetadata = null;
    if (isExternalRegistry) {
      externalMetadata = await fetchExternalMetadata(currentUri);
      console.log('externalMetadata response.data:', externalMetadata);
    }
    for (const header of headers) {
      if (result[header]) resultObject[header] = result[header].value;
      else resultObject[header] = '';
    }
    // Merge external metadata if it exists
    if (externalMetadata && Array.isArray(externalMetadata) && externalMetadata.length > 0) {
      const metadataObj = externalMetadata[0];
      for (const header of headers) {
        if (metadataObj[header] !== null && metadataObj[header] !== undefined) {
          resultObject[header] = metadataObj[header];
        }
      }
    }
    // Replace name with displayId if name is blank, empty, or just whitespace
    if (!resultObject.name || resultObject.name.trim() === '') {
      resultObject.name = resultObject.displayId || '';
    }
    console.log(resultObject);
    return resultObject;
  }));
};

const fetchExternalMetadata = async (uri) => {
  // TODO: Fill in the URL for the GET request
  console.log('uri', uri);
  const url = `${uri}/metadata`;
  console.log('url', url);
  try {
    const response = await axios.get(url, {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching metadata for ${uri}:`, error);
    return null;
  }
};

const getNewBounds = (offset, memberCount) => {
  let low = Math.max(offset - 5000, 0);
  let high = Math.min(offset + 5000, memberCount);
  if (low == 0) {
    high = Math.min(memberCount, 10000);
  } else if (high == memberCount) {
    low = Math.max(0, memberCount - 10000);
  }
  return [low, high];
};
