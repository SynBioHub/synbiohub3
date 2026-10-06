import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import useSWR from 'swr';
import axios from 'axios';
import Select from 'react-select';
import showdown from 'showdown';

import getConfig from 'next/config';
const { publicRuntimeConfig } = getConfig();

import CountMembers from '../../../sparql/CountMembers';
import CountMembersTotal from '../../../sparql/CountMembersSearch';
import getCollectionMembers from '../../../sparql/getCollectionMembers';
import getCollectionMembersSearch from '../../../sparql/getCollectionMembersSearch';
import getTypesRoles from '../../../sparql/getTypesRoles';
import styles from '../../../styles/view.module.css';
import tableStyles from '../../../styles/resulttable.module.css';
import MiniLoading from '../../Reusable/MiniLoading';
import { numberDisplayOptions } from '../../Reusable/Table/TableConfig';
import loadTemplate from '../../../sparql/tools/loadTemplate';
import { shortName } from '../../../namespace/namespace';
import lookupRole from '../../../namespace/lookupRole';
import { getTypeColor } from '../../../utilities/typeColor';
import { condenseLabel } from '../../../utilities/condenseLabel';
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

const sdconverter = new showdown.Converter();

export default function Members(properties) {
  const token = useSelector(state => state.user.token);
  const privateGraph = useSelector(state => state.user.graphUri);
  const [search, setSearch] = useState('');
  const [offset, setOffset] = useState(0);
  const [sort, setSort] = useState(sortMethods.displayId);
  const [defaultSortOption, setDefaultSortOption] = useState(sortOptions[0]);
  const [customBounds, setCustomBounds] = useState([0, 10000]);
  const [typeFilter, setTypeFilter] = useState('Show Only Root Objects');
  const [numberEntries, setNumberEntries] = useState(numberDisplayOptions[0].value);
  const [displayOffset, setDisplayOffset] = useState(0);
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

  const usesAllObjectsQuery =
    typeFilter === 'Show All Objects' ||
    typeFilter.startsWith('http://www.biopax.org/release/biopax-level3.owl#') ||
    typeFilter.startsWith('http://identifiers.org/so/');

  const query = usesAllObjectsQuery ? getCollectionMembersSearch : getCollectionMembers;
  const countQuery = usesAllObjectsQuery ? CountMembersTotal : CountMembers;

  const { members, mutate } = token
    ? useMembers(query, parameters, dispatch, token)
    : useMembers(query, parameters, dispatch);

  const { count: totalMemberCount } = isOwner
    ? useCount(
      CountMembersTotal,
      { ...parameters, search: '' },
      dispatch,
      token ? token : undefined
    )
    : useCount(
      CountMembersTotal,
      { ...parameters, search: '' },
      dispatch,
      token ? token : undefined);

  const { count: currentMemberCount } = isOwner
    ? useCount(
      countQuery,
      parameters,
      dispatch,
      token ? token : undefined
    )
    : useCount(
      countQuery,
      parameters,
      dispatch,
      token ? token : undefined
    );

  useEffect(() => {
    if (properties.refreshMembers) {
      mutate();
      properties.setRefreshMembers(false);
    }
  }, [properties.refreshMembers, mutate]);

  const publicPrefix =  theme.uriPrefix + 'public/';


  const { filters } = useFilters(
    getTypesRoles,
    { uri: properties.uri },
    dispatch,
    token ? token : undefined,
    !properties.uri.includes(publicPrefix) ? privateGraph : undefined
  );

  const outOfBoundsHandle = offset => {
    const newBounds = getNewBounds(offset, currentMemberCount);
    setCustomBounds(newBounds);
    setOffset(newBounds[0]);
  };

  useEffect(() => {
    if (displayOffset < customBounds[0] || displayOffset > customBounds[1]) {
      outOfBoundsHandle(displayOffset);
    }
  }, [displayOffset, customBounds]);

  useEffect(() => {
    setDisplayOffset(0);
  }, [search, sort, typeFilter]);

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

  const [processedMembers, setProcessedMembers] = useState([]);

  useEffect(() => {
    async function processMembers() {
      if (members) {
        const updatedMembers = await Promise.all(members.map(async member => {
          const processed = await processUrl(member.uri, registries);
          return {
            ...member,
            uri: processed.urlRemovedForLink
          };
        }));
        setProcessedMembers(updatedMembers);
      }
    }

    processMembers();
  }, [members]);

  const additionalOffset = customBounds[0];
  const pageStart = Math.max(0, displayOffset - additionalOffset);
  const pageEnd =
    numberEntries === 'all'
      ? processedMembers.length
      : Math.min(processedMembers.length, pageStart + numberEntries);
  const pageMembers = processedMembers.slice(pageStart, pageEnd);

  useEffect(() => {
    if (
      displayOffset > 0 &&
      processedMembers.length > 0 &&
      pageStart >= processedMembers.length
    ) {
      const limit = numberEntries === 'all' ? processedMembers.length : numberEntries;
      setDisplayOffset(previous => Math.max(0, previous - limit));
    }
  }, [processedMembers, pageStart]);

  return (
    <div className={tableStyles.resultcontainer}>
      <div className={tableStyles.tablemeta}>
        <MembersFilterBar
          filters={filters}
          setTypeFilter={setTypeFilter}
          search={search}
          setSearch={setSearch}
        />

        <MembersMeta
          curr={currentMemberCount}
          total={totalMemberCount}
          sortOption={defaultSortOption}
          setSortOption={option => {
            setDefaultSortOption(option);
            setSort(sortMethods[option.value]);
          }}
          numberEntries={numberEntries}
          setNumberEntries={value => {
            setNumberEntries(value);
            setDisplayOffset(0);
          }}
        />
      </div>

      <MemberTable
        members={pageMembers}
        loading={!members}
        isPublicCollection={properties.uri.includes("/public/")}
        uri={properties.uri}
        processedUri={processedUri}
        mutate={mutate}
      />

      <MembersPagination
        displayOffset={displayOffset}
        setDisplayOffset={setDisplayOffset}
        numberEntries={numberEntries}
        total={currentMemberCount}
      />
    </div>
  );
}

function MembersFilterBar(properties) {
  const [filters, setFilters] = useState(undefined);
  const [inputValue, setInputValue] = useState(properties.search);

  useEffect(() => {
    if (properties.filters) {
      const newFilters = properties.filters.map(filter => {
        const shortNamedFilter = shortName(filter.uri);
        return { value: filter.uri, label: condenseLabel(shortNamedFilter) };
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

  const runSearch = () => properties.setSearch(inputValue.toLowerCase());

  return (
    <div className={styles.membercontrols}>
      <div className={styles.membersearchbox}>
        <input
          className={styles.membersearchboxinput}
          value={inputValue}
          type="text"
          placeholder="Search for collection members"
          onChange={event => setInputValue(event.target.value)}
          onKeyPress={event => {
            if (event.key === 'Enter') runSearch();
          }}
        />
        <button className={styles.membersearchboxbutton} onClick={runSearch}>
          Search
        </button>
      </div>

      <div className={styles.memberfiltergroup}>
        <span className={styles.memberfilterlabel}>Show</span>
        {filters ? (
          <Select
            options={filters}
            menuPortalTarget={document.body}
            styles={selectStyles}
            className={styles.memberfilterselect}
            onChange={option => properties.setTypeFilter(option.value)}
          />
        ) : (
          <MiniLoading height={10} />
        )}
      </div>
    </div>
  );
}

function MembersMeta(properties) {
  let count = (
    <div className={styles.loadinginline}>
      <MiniLoading height={10} />
    </div>
  );
  if (properties.curr !== undefined && properties.total !== undefined) {
    count =
      'Showing ' +
      Number(properties.curr).toLocaleString() +
      ' (filtered from ' +
      Number(properties.total).toLocaleString() +
      ')';
  }

  return (
    <div className={tableStyles.pagemeta}>
      <div className={tableStyles.count}>{count}</div>

      <div className={tableStyles.limitgroup}>
        <label htmlFor="member-sort">Sort by:</label>
        <Select
          inputId="member-sort"
          options={sortOptions}
          value={properties.sortOption}
          styles={selectStyles}
          className={styles.memberfilterselect}
          menuPortalTarget={document.body}
          onChange={properties.setSortOption}
        />
      </div>

      <div className={tableStyles.limitgroup}>
        <label htmlFor="member-limit">Results per page:</label>
        <select
          id="member-limit"
          value={properties.numberEntries}
          onChange={event => {
            const value = event.target.value === 'all' ? 'all' : Number(event.target.value);
            properties.setNumberEntries(value);
          }}
          className={tableStyles.limitselect}
        >
          {numberDisplayOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

function MembersPagination(properties) {
  const limit = properties.numberEntries === 'all' ? properties.total || 1 : properties.numberEntries;
  const totalPages = Math.max(1, Math.ceil((properties.total || 0) / limit));
  const currentPage = Math.floor(properties.displayOffset / limit) + 1;

  const goToPage = pageNum => {
    properties.setDisplayOffset((pageNum - 1) * limit);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (totalPages <= 1) return null;

  const maxPagesToShow = 10;
  let startPage, endPage;
  if (currentPage <= 5) {
    startPage = 1;
    endPage = Math.min(totalPages, 5);
  } else {
    startPage = Math.max(1, currentPage - 5);
    endPage = Math.min(totalPages, currentPage + 4);
    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
  }

  const pageNumbers = [];
  for (let index = startPage; index <= endPage; index++) pageNumbers.push(index);

  const previousEnabled = currentPage > 1;
  const nextEnabled = currentPage < totalPages;

  return (
    <div className={tableStyles.navigation}>
      <div className={tableStyles.pagecluster}>
        <div
          role="button"
          className={`${tableStyles.pagebubble} ${previousEnabled ? tableStyles.enabled : tableStyles.disabled}`}
          onClick={() => previousEnabled && goToPage(currentPage - 1)}
        >
          «
        </div>

        <div className={tableStyles.pagenumbers}>
          {pageNumbers.map(num => (
            <div
              key={num}
              role="button"
              onClick={() => goToPage(num)}
              className={`${tableStyles.pagebubble} ${num === currentPage ? tableStyles.pagebubbleactive : ''}`}
            >
              {num}
            </div>
          ))}
        </div>

        <div
          role="button"
          className={`${tableStyles.pagebubble} ${nextEnabled ? tableStyles.enabled : tableStyles.disabled}`}
          onClick={() => nextEnabled && goToPage(currentPage + 1)}
        >
          »
        </div>
      </div>
    </div>
  );
}

function MemberTable(properties) {
  const isPublicCollection = properties.isPublicCollection;
  const token = useSelector(state => state.user.token);

  if (properties.loading) {
    return (
      <div className={tableStyles.tablecontainer2}>
        <MiniLoading height={20} />
      </div>
    );
  }

  if (properties.members.length === 0) {
    return <div className={tableStyles.tablecontainer2}>No members found</div>;
  }

  const handleDelete = async member => {
    if (member.uri && window.confirm("Would you like to remove this item from the collection?")) {
      try {
        await axios.get(`${publicRuntimeConfig.backend}${member.uri}/remove`, {
          headers: {
            "Accept": "text/plain; charset=UTF-8",
            "X-authorization": token
          }
        });
        properties.mutate();
      } catch (error) {
        console.error('Error removing item:', error);
      }
    }
  };

  const handleUnlink = async (member, processedUriPrefix) => {
    const objectUriParts = getAfterThirdSlash(properties.uri);
    const objectUri = `${publicRuntimeConfig.backend}/${objectUriParts}`;
    if (member.uri && window.confirm("Would you like to unlink this item from the collection?")) {
      try {
        await axios.post(`${objectUri}/removeMembership`, {
          "member": `${processedUriPrefix}${member.uri}`
        }, {
          headers: {
            "Accept": "text/plain; charset=UTF-8",
            "X-authorization": token
          }
        });
        properties.mutate();
      } catch (error) {
        console.error('Error unlinking item:', error);
      }
    }
  };

  const removeTrailingSlash = url => (url.endsWith('/') ? url.slice(0, -1) : url);

  return (
    <table className={`${tableStyles.table} ${styles.memberstable}`}>
      <thead>
        <tr>
          <th className={styles.membernamecolumn}>ID / Name</th>
          <th>Description</th>
          <th className={styles.membertypecolumn}>Type</th>
          {!isPublicCollection && <th className={styles.memberremovecolumn}>Remove</th>}
        </tr>
      </thead>

      <tbody>
        {properties.members.map(member => {
          const objectUriParts = getAfterThirdSlash(properties.uri);
          const parts = properties.uri.split('/');

          const icon = compareUri(member.uri, `/${objectUriParts}`);

          const handleIconClick = () => {
            if (icon === faTrash) {
              handleDelete(member);
            } else if (icon === faUnlink) {
              handleUnlink(member, removeTrailingSlash(properties.processedUri));
            }
          };

          const isShareLink = properties.uri.endsWith('/share');
          const customSuffix = isShareLink ? `/${parts.slice(-2).join('/')}` : '';
          const displayType = getType(member);
          const typeColor = getTypeColor(displayType);

          return (
            <tr key={member.displayId + member.description}>
              <td className={tableStyles.nameCell}>
                <Link href={`${member.uri}${customSuffix}`}>
                  <a>
                    <div className={tableStyles.displayId}>{member.displayId}</div>
                    <div className={tableStyles.name}>
                      {member.name || member.displayId}
                    </div>
                  </a>
                </Link>
              </td>
              <td>
                <div
                  className={tableStyles.markdownContent}
                  dangerouslySetInnerHTML={{ __html: sdconverter.makeHtml(member.description || '') }}
                />
              </td>
              <td>
                {displayType && (
                  <span
                    className={tableStyles.typeBadge}
                    style={{
                      backgroundColor: typeColor.background,
                      borderColor: typeColor.border,
                      color: typeColor.color
                    }}
                  >
                    {displayType}
                  </span>
                )}
              </td>
              {!isPublicCollection && (icon === faTrash || icon === faUnlink) && (
                <td
                  className={`${styles.memberactionicon} ${styles.memberremovecolumn}`}
                  onClick={handleIconClick}
                  title={icon === faTrash ? 'Delete Member' : 'Remove member from collection'}
                >
                  <FontAwesomeIcon icon={icon} />
                </td>
              )}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

const selectStyles = {
  menuPortal: base => ({ ...base, zIndex: 9999 }),
  control: base => ({
    ...base,
    minHeight: '2.1rem',
    borderRadius: '0.4rem',
    borderColor: '#d5d9e0',
    boxShadow: 'none',
    fontSize: '0.85rem'
  })
};

function getType(member) {
  var memberType = member.type
    ? member.type.slice(member.type.lastIndexOf('#') + 1)
    : 'Unknown';
  if (member.sbolType) {
    memberType = member.sbolType.slice(member.sbolType.lastIndexOf('#') + 1);
  }
  if (member.role) {
    const role = lookupRole(member.role);
    memberType = role.description?.name || role.term || memberType;
  }
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

const useCount = (query, options, dispatch, token=null) => {
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

    ({ data, error } = useSWR([finalUrl, token, dispatch], fetcher));

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

const useMembers = (query, options, dispatch, token=null) => {
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

    ({ data, error, mutate } = useSWR([finalUrl, token, dispatch], fetcher));

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
    members: processedData,
    mutate
  };
};

const useFilters = (query, options, dispatch, token=null, privateGraph=null) => {
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

    ({ data, error, mutate } = useSWR([finalUrl, token, dispatch], fetcher));

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
  const localUriPrefix = (JSON.parse(localStorage.getItem('theme')) || {}).uriPrefix || '';
  const headers = results.head.vars;
  return Promise.all(results.results.bindings.map(async (result) => {
    const resultObject = {};
    const currentUri = result.uri ? result.uri.value : '';
    const registriesArray = Array.isArray(registries)
      ? registries
      : Object.values(registries).filter(r => r && typeof r === 'object');
    let isExternalRegistry = currentUri && registriesArray.some(registry =>
      registry.uri && currentUri.startsWith(registry.uri)
    );
    if (currentUri && currentUri.startsWith(localUriPrefix)) {
      isExternalRegistry = false;
    }
    let externalMetadata = null;
    if (isExternalRegistry) {
      externalMetadata = await fetchExternalMetadata(currentUri);
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
    return resultObject;
  }));
};

const fetchExternalMetadata = async (uri) => {
  const url = `${uri}/metadata`;
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
