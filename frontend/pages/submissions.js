import axios from 'axios';
import Loader from 'react-loader-spinner';
import { useSelector } from 'react-redux';
import useSWR from 'swr';

import TopLevel from '../components/TopLevel';
import styles from '../styles/submissions.module.css';

export default function Submissions() {
  const token = useSelector(state => state.user.token);
  const { submissions, isMySubmissionsLoading, isMySubmissionsError } =
    useMySubmissions(token);
  return (
    <TopLevel>
      <div className={styles.container}>
        {isMySubmissionsLoading && (
          <Loader color="#D25627" height={20} type="ThreeDots" width={50} />
        )}
        {isMySubmissionsLoading && (
          <Loader color="#D25627" height={20} type="ThreeDots" width={50} />
        )}
        {isMySubmissionsError && <div>Error in fetching submissions</div>}
        {submissions && <div>Submissions found</div>}
      </div>
    </TopLevel>
  );
}

const useMySubmissions = token => {
  const { data, error } = useSWR(
    [`${process.env.backendUrl}/manage`, token],
    fetcher
  );

  return {
    submissions: data,
    isMySubmissionsLoading: !error && !data,
    isMySubmissionsError: error
  };
};

const fetcher = (url, token) =>
  axios
    .get(url, {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/plain',
        'X-authorization': token
      }
    })
    .then(response => response.data);
