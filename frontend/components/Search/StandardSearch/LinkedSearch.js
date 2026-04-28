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
  const token = useSelector(state => state.user.token);
  const offset = useSelector(state => state.search.offset);
  const limit = useSelector(state => state.search.limit);

  const totalCount = router.query.count ? Number(router.query.count) : 0;

  useEffect(() => {
    // reset page when switching between twins/uses/similar
    dispatch(setOffset(0));
  }, [properties.url]);

  useEffect(() => {
    // Legacy SynBioHub only attaches twins/uses/similar SPARQL when the URL path ends with
    // `/twins`, `/uses`, or `/similar`. Query strings such as `?offset=0&limit=50` break that
    // detection (`endsWith('/twins')` fails), so we request the bare URL and paginate below.
    let cancelled = false;
    setError(null);
    setData(null);

    const headers = {
      "Content-Type": "application/json; charset=UTF-8",
      "Accept": "application/json"
    };
    if (token) {
      headers["X-authorization"] = token;
    }

    axios.get(properties.url, { headers })
    .then(response => {
      if (!cancelled) {
        const raw = response.data;
        setData(Array.isArray(raw) ? raw : []);
      }
    })
    .catch(err => {
      if (!cancelled) {
        console.error("Error fetching linked search:", err);
        setError(err);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [properties.url, token]);

  const fullResults = Array.isArray(Data) ? Data : [];
  const pageRows = fullResults.slice(offset, offset + limit);

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
        <ResultTable count={totalCount || fullResults.length} data={pageRows} />
      </div>
    </TopLevel>
  );
}
