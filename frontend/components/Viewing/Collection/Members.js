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
    graphs: '',
    graphPrefix: 'https://synbiohub.org/',
    collection: properties.uri,
    sort: sort,
    search: preparedSearch,
    offset: offset ? ` OFFSET ${offset}` : '',
    limit: ' LIMIT 10000 '
  };
  
  if (token) {
    parameters.graphs = privateGraph
  }

  const searchQuery = preparedSearch || typeFilter !== 'Show Only Root Objects';

  let query = searchQuery ? getCollectionMembersSearch : getCollectionMembers;

  const { members, mutate } = useMembers(query, parameters, token, dispatch);
  const { count: totalMemberCount } = useCount(
    CountMembersTotal,
    { ...parameters, search: '' },
    token,
    dispatch
  );
  const { count: currentMemberCount } = useCount(
    searchQuery ? CountMembersTotal : CountMembers,
    parameters,
    token,
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
      data={properties.members}
      loading={!properties.members}
      title="Members"
      count={count}
      customCount={properties.currMembers}
      customBounds={properties.customBounds}
      outOfBoundsHandle={properties.outOfBoundsHandle}
      customSearch={properties.customSearch}
      hideFilter={true}
      searchable={[]}
      headers={['Name', 'Identifier', 'Type', 'Description']}
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
        

        return (
          <tr key={member.displayId + member.description}>
            <td>
              <Link href={member.uri.replace('https://synbiohub.org', '')}>
                <a className={styles.membername}>
                  <code>{textArea.value}</code>
                </a>
              </Link>
            </td>
            <td>
              <Link href={member.uri.replace('https://synbiohub.org', '')}>
                <a className={styles.memberid}>{member.displayId}</a>
              </Link>
            </td>
            <td>{getType(member)}</td>
            <td>{member.description}</td>
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

function replaceBeginning(original, oldBeginning, newBeginning) {
  if (original.startsWith(oldBeginning)) {
    return newBeginning + original.slice(oldBeginning.length);
  }
  return original;
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
