import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import { useSelector, useDispatch } from 'react-redux';
import { setOffset } from '../../../redux/actions';
import SearchHeader from '../SearchHeader/SearchHeader';
import ResultTable from './ResultTable/ResultTable';
import styles from '../../../styles/view.module.css';
import TopLevel from '../../TopLevel';
import NavbarSearch from '../NavbarSearch/NavbarSearch';

export default function LinkedSearch(properties) {
  const [Data, setData] = useState(null);
  const [error, setError] = useState(null);
  const router = useRouter();
  const dispatch = useDispatch();
  const offset = useSelector(state => state.search.offset);
  const limit = useSelector(state => state.search.limit);

  const totalCount = router.query.count ? Number(router.query.count) : 0;

  useEffect(() => {
    // reset page when switching between twins/uses/similar
    dispatch(setOffset(0));
  }, [properties.url]);

  useEffect(() => {
    const paginatedUrl = `${properties.url}?offset=${offset}&limit=${limit}`;
    axios.get(paginatedUrl, {
      headers: {
        "Content-Type": "application/json; charset=UTF-8",
        "Accept": "application/json"
      }
    })
    .then(response => {
      setData(response.data);
    })
    .catch(err => {
      console.error("Error fetching linked search:", err);
      setError(err);
    });
  }, [properties.url, offset, limit]);

  if (error) return <div>Error loading linked data.</div>;
  if (!Data) return <div>Loading...</div>;

  return (
    <TopLevel
      doNotTrack={true}
      navbar={<NavbarSearch
                value={properties.uri}
                placeholder="Search SynBioHub"
                />}
      hideFooter={true}
      publicPage={true}
    >
      <div className={styles.searchContent}>
        <SearchHeader selected="Standard Search" />
        <ResultTable count={totalCount || Data.length} data={Data} />
      </div>
    </TopLevel>
  );
}
