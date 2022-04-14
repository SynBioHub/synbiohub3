import { useEffect, useState } from 'react';

import CountMembers from '../../../sparql/CountMembers';
import CountMembersTotal from '../../../sparql/CountMembersSearch';
import getCollectionMembers from '../../../sparql/getCollectionMembers';
import getCollectionMembersSearch from '../../../sparql/getCollectionMembersSearch';
import getQueryResponse from '../../../sparql/tools/getQueryResponse';
import styles from '../../../styles/view.module.css';
import MiniLoading from '../../Reusable/MiniLoading';
import Table from '../../Reusable/Table/Table';
import Section from '../Sections/Section';

/* eslint sonarjs/cognitive-complexity: "off" */

export default function Members(properties) {
  const [members, setMembers] = useState();
  const [totalMemberCount, setTotalMemberCount] = useState();
  const [currentMemberCount, setCurrentMemberCount] = useState();
  const [search, setSearch] = useState('');
  const [offset, setOffset] = useState(0);
  const startBound = [0, 10000];
  const [customBounds, setCustomBounds] = useState(startBound);

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

  // ' LIMIT 10'

  useEffect(() => {
    if (!members) {
      if (search)
        getQueryResponse(getCollectionMembersSearch, parameters).then(
          newMembers => {
            if (newMembers) setMembers(newMembers);
          }
        );
      else
        getQueryResponse(getCollectionMembers, parameters).then(newMembers => {
          if (newMembers) setMembers(newMembers);
        });
    }

    if (totalMemberCount == undefined) {
      const temporarySearch = parameters.search;
      if (search) parameters.search = '';
      getQueryResponse(CountMembersTotal, parameters).then(memberCount => {
        if (memberCount) setTotalMemberCount(memberCount[0].count);
        else setTotalMemberCount('error');
      });
      parameters.search = temporarySearch;
    }

    if (currentMemberCount == undefined) {
      let query = CountMembers;
      if (search) query = CountMembersTotal;
      getQueryResponse(query, parameters).then(memberCount => {
        if (memberCount) setCurrentMemberCount(memberCount[0].count);
        else setCurrentMemberCount('error');
      });
    }
  }, [members, totalMemberCount, currentMemberCount, search, offset]);

  const outOfBoundsHandle = (offset) => {
      const newBounds = getNewBounds(offset, currentMemberCount);
      setCustomBounds(newBounds);
      setOffset(newBounds[0]);
      setMembers(undefined);
  }

  return (
    <Section title="Members">
      <SearchHeader
        search={search}
        setSearch={setSearch}
        setMembers={setMembers}
        setCurrMemberCount={setCurrentMemberCount}
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
    properties.setSearch(search);
    properties.outOfBoundsHandle(0);
    properties.setCurrMemberCount();
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


function getNewBounds(offset, memberCount) {
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
