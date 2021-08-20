import axios from 'axios';
import { useSelector } from 'react-redux';
import useSWR from 'swr';

import Basket from '../components/Basket';
import Table from '../components/ReusableComponents/Table/Table';
import TopLevel from '../components/TopLevel';
import styles from '../styles/submissions.module.css';

const searchable = ['name', 'displayId', 'type', 'description'];
const headers = ['Name', 'Display ID', 'Description', 'Type'];

function Submissions() {
  const token = useSelector(state => state.user.token);
  const { submissions, isMySubmissionsLoading } = useMySubmissions(token);
  const { shared, isSharedLoading } = useSharedSubmissions(token);
  return (
    <div className={styles.container}>
      <div className={styles.pageheader}></div>
      <Basket />
      <div className={styles.content}>
        <SubmissionsTable
          token={token}
          title="Private"
          loading={isMySubmissionsLoading}
          data={submissions ? submissions : undefined}
        />
        <SubmissionsTable
          token={token}
          title="Shared With Me"
          loading={isSharedLoading}
          data={shared ? shared : undefined}
        />
      </div>
    </div>
  );
}

function SubmissionsTable(properties) {
  return (
    <div className={styles.submissiontable}>
      <Table
        data={properties.data}
        loading={properties.loading}
        title={properties.title}
        searchable={searchable}
        headers={headers}
        sortOptions={options}
        defaultSortOption={options[0]}
        sortMethods={sortMethods}
        hideFooter={true}
        dataRowDisplay={submission => (
          <tr key={submission.displayId}>
            <td>
              <code>{submission.name}</code>
            </td>
            <td>{submission.displayId}</td>
            <td>{submission.description}</td>
            <td>{submission.type}</td>
          </tr>
        )}
      />
    </div>
  );
}

const options = [
  { value: 'name', label: 'Name' },
  { value: 'displayId', label: 'Display ID' },
  { value: 'type', label: 'Type' }
];

const sortString = (plugin1, plugin2) => {
  return (plugin1.name > plugin2.name && 1) || -1;
};

const sortMethods = {
  name: sortString,
  displayId: sortString,
  type: sortString
};

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

export default function SubmissionsWrapped() {
  return (
    <TopLevel>
      <Submissions />
    </TopLevel>
  );
}

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
