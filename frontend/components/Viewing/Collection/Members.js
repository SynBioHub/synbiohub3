import { useState } from 'react';
import { useSelector } from 'react-redux';
import useSWR from 'swr';
import axios from 'axios';

import getConfig from 'next/config';
const { publicRuntimeConfig } = getConfig();

import CountMembers from '../../../sparql/CountMembers';
import CountMembersTotal from '../../../sparql/CountMembersSearch';
import getCollectionMembers from '../../../sparql/getCollectionMembers';
import getCollectionMembersSearch from '../../../sparql/getCollectionMembersSearch';
import styles from '../../../styles/view.module.css';
import MiniLoading from '../../Reusable/MiniLoading';
import Table from '../../Reusable/Table/Table';
import Section from '../Sections/Section';
import loadTemplate from '../../../sparql/tools/loadTemplate';

/* eslint sonarjs/cognitive-complexity: "off" */

export default function Members(properties) {
  const token = useSelector(state => state.user.token);
  const [search, setSearch] = useState('');
  const [offset, setOffset] = useState(0);
  const [customBounds, setCustomBounds] = useState([0, 10000]);

  const preparedSearch =
    search !== ''
      ? `FILTER(CONTAINS(lcase(str(?uri)), lcase("${search}"))||CONTAINS(lcase(?displayId), lcase("${search}"))||CONTAINS(lcase(?name), lcase("${search}"))||CONTAINS(lcase(?description), lcase("${search}")))`
      : '';

  const parameters = {
    graphs: '',
    graphPrefix: 'https://synbiohub.org/',
    collection: properties.uri,
    sort: ' ORDER BY ASC(concat(lcase(str(?name)),lcase(str(?displayId)))) ',
    search: preparedSearch,
    offset: offset ? ` OFFSET ${offset}`: '',
    limit: ' LIMIT 10000 '
  };

  let query = search ? getCollectionMembersSearch: getCollectionMembers;

  const { members, membersLoading } = useMembers(query, parameters, token);
  const { count: totalMemberCount, countLoading: totalMemberCountLoading } = useCount(CountMembersTotal, {...parameters, search: ''}, token);
  const { count: currentMemberCount, countLoading: currMembersLoading } = useCount(search ? CountMembersTotal : CountMembers, parameters, token);

  const outOfBoundsHandle = (offset) => {
      const newBounds = getNewBounds(offset, currentMemberCount);
      setCustomBounds(newBounds);
      setOffset(newBounds[0]);
  }

  return (
    <Section title="Members">
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
      />
    </Section>
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
      sortOptions={[]}
      defaultSortOption={undefined}
      sortMethods={[]}
      dataRowDisplay={member => {
         var textArea = document.createElement("textarea");
         textArea.innerHTML = member.name;
         return (
        <tr key={member.displayId + member.description}>
          <td>
            <code>{textArea.value}</code>
          </td>
          <td>{member.displayId}</td>
          <td>{member.type.replace('http://sbols.org/v2#', '')}</td>
          <td>{member.description}</td>
        </tr>
      )}}
    />
  );
}

const createUrl = (query, options) => {
   query = loadTemplate(query, options);
   return `${publicRuntimeConfig.backend}/sparql?query=${encodeURIComponent(
      query
   )}`;
}

const useCount = (query, options, token) => {
   const url = createUrl(query, options, token);
   const { data, error } = useSWR(
      [url, token],
      fetcher
   );

   let processedData = data ? processResults(data)[0].count : undefined

   return {
      count: processedData,
      countLoading: !processedData && !error
   }
}

const useMembers = (query, options, token) => {
   const url = createUrl(query, options);
   const { data, error } = useSWR(
      [url, token],
      fetcher
   );

   let processedData = data ? processResults(data) : undefined;
   
   return {
      members: processedData,
      membersLoading: !error && !processedData
   }
}

const fetcher = (url, token) =>
   axios
      .get(url, {
      headers: {
         'Content-Type': 'application/json',
         Accept: 'application/json',
         'X-authorization': token
      }
      })
      .then(response => response.data);


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
   }
   else if (high == memberCount) {
      low = Math.max(0, memberCount - 10000);
   }
   return [low, high];
}
