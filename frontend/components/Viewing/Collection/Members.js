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
import { addError } from '../../../redux/actions';
import { processUrl, processUrlReverse } from '../../Admin/Registries';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faUnlink } from '@fortawesome/free-solid-svg-icons';
import { getAfterThirdSlash } from '../ViewHeader';
import Status, { useStatus } from '../../Admin/Status';

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
    graphPrefix: 'https://synbiohub.org/', // TODO: Maybe get this from somewhere? 
    collection: properties.uri,
    sort: sort,
    search: preparedSearch,
    offset: offset ? ` OFFSET ${offset}` : '',
    limit: ' LIMIT 10000 '
  };

  if (token) {
    parameters.from = "FROM <" + privateGraph + ">";
  } else {
  }

  const searchQuery = preparedSearch || typeFilter !== 'Show Only Root Objects';

  let query = searchQuery ? getCollectionMembersSearch : getCollectionMembers;

  const { members, mutate } = privateGraph
    ? useMembers(query, parameters, token, dispatch)
    : useMembers(query, parameters, dispatch);

  const { count: totalMemberCount } = useCount(
    CountMembersTotal,
    { ...parameters, search: '' },
    privateGraph ? token : undefined, // Pass token only if privateGraph is true
    dispatch
  );

  const { count: currentMemberCount } = useCount(
    searchQuery ? CountMembersTotal : CountMembers,
    parameters,
    privateGraph ? token : undefined, // Pass token only if privateGraph is true
    dispatch
  );

  useEffect(() => {
    if (properties.refreshMembers) {
      mutate();
      properties.setRefreshMembers(false);
    }
  }, [properties.refreshMembers, mutate]);

  const { filters } = useFilters(
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
      const result = await processUrlReverse(publicRuntimeConfig.backend, token, dispatch);
      if (isMounted) {
        setProcessedUri(result.uriReplacedForBackend);
      }
    }

    processUri();
    return () => { isMounted = false };
  }, [token, dispatch]);

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

  const token = useSelector(state => state.user.token);
  const dispatch = useDispatch();
  useEffect(() => {
    async function processMembers() {
      if (properties.members) {
        const updatedMembers = await Promise.all(properties.members.map(async member => {
          const processed = await processUrl(member.uri, token, dispatch);
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
      headers={['Name', 'Identifier', 'Type', 'Description', 'Remove']}
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

        const icon = compareUri(member.uri, `/${objectUriParts}`);

        const handleIconClick = (member) => {
          if (icon && icon === faTrash) {
            handleDelete(member);
          } else if (icon && icon === faUnlink) {
            handleUnlink(member, properties.processedUri);  // Use processedUri from props
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

        return (
          <tr key={member.displayId + member.description}>
            <td>
              <Link href={member.uri}>
                <a className={styles.membername}>
                  <code>{textArea.value}</code>
                </a>
              </Link>
            </td>
            <td>
              <Link href={member.uri}>
                <a className={styles.memberid}>{member.displayId}</a>
              </Link>
            </td>
            <td>{getType(member)}</td>
            <td>{member.description}</td>
            <td onClick={() => handleIconClick(member)}>
              <FontAwesomeIcon icon={icon} />
            </td>
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

  if (memberUri.startsWith(userUriPrefix)) {
    // Check if member.uri matches properties.uri for the first 3 slashes
    const matchUri = baseUri.split('/').slice(0, 4).join('/');
    if (memberUri.startsWith(matchUri)) {
      return faTrash;
    }
  } else if (memberUri.startsWith(publicUriPrefix)) {
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
  const { data, error } = useSWR([url, token, dispatch], fetcher);

  let processedData = data ? processResults(data)[0].count : undefined;
  return {
    count: processedData
  };
};

const useMembers = (query, options, token, dispatch) => {
  const url = createUrl(query, options);
  const { data, error, mutate } = useSWR([url, token, dispatch], fetcher);

  let processedData = data ? processResults(data) : undefined;

  return {
    members: processedData,
    mutate
  };
};

const useFilters = (query, options, token, dispatch) => {
  const url = createUrl(query, options);
  const { data, error } = useSWR([url, token, dispatch], fetcher);

  let processedData = data ? processResults(data) : undefined;

  return {
    filters: processedData
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
    .then(response => response.data)
    .catch(error => {
      error.customMessage =
        'Request failed while getting collection members info';
      error.fullUrl = url;
      // Check if the error is 401 Unauthorized or 400 Bad Request
      if (error.response && (error.response.status === 401 || error.response.status === 400)) {
        // Check if the user is logged in by looking for 'userToken' in local storage
        if (!localStorage.getItem('userToken')) {
          // User is not logged in, redirect to the login page
          // window.location.href = '/login';
        }
      }

      // Dispatch the error regardless of whether the user is logged in
      dispatch(addError(error));
    });

const processResults = results => {
  const headers = results.head.vars;
  return results.results.bindings.map(result => {
    const resultObject = {};
    for (const header of headers) {
      if (result[header]) resultObject[header] = result[header].value;
      else resultObject[header] = '';
    }
    return resultObject;
  });
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
