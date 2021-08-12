import { faAlignLeft } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import axios from 'axios';
import Loader from 'react-loader-spinner';
import { useSelector } from 'react-redux';
import useSWR from 'swr';

import Basket from '../components/Basket';
import ResultTable from '../components/SearchComponents/StandardSearch/ResultTable/ResultTable';
import TopLevel from '../components/TopLevel';
import styles from '../styles/submissions.module.css';

export default function Submissions() {
  const token = useSelector(state => state.user.token);
  const { submissions, isMySubmissionsLoading, isMySubmissionsError } =
    useMySubmissions(token);
  const { shared, isSharedLoading, isSharedError } =
    useSharedSubmissions(token);

  var content = null;
  if (isMySubmissionsLoading || isSharedLoading) {
    content = (
      <div className={styles.loadercontainer}>
        <div className={styles.loaderanimation}>
          <Loader color="#D25627" type="ThreeDots" />
        </div>
      </div>
    );
  } else if (isMySubmissionsError || isSharedError) {
    content = (
      <div className={styles.error}>
        Errors were encountered while fetching your submissions
      </div>
    );
  } else {
    content = (
      <ResultTable
        count={submissions.length}
        data={[...submissions, ...shared]}
        overrideType="Collection"
        submissionsPage={true}
      />
    );
  }
  return (
    <TopLevel>
      <div className={styles.container}>
        <div className={styles.pageheader}>
          <FontAwesomeIcon icon={faAlignLeft} size="2x" color="#00A1E4" />{' '}
          <h2 className={styles.pagetitle}>My Submissions</h2>
        </div>
        <Basket />
        {content}
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

const useSharedSubmissions = token => {
  const { data, error } = useSWR(
    [`${process.env.backendUrl}/shared`, token],
    fetcher
  );

  return {
    shared: data,
    isSharedLoading: !error && !data,
    isSharedError: error
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
