import axios from 'axios';
import getConfig from 'next/config';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import useSWR from 'swr';
const { publicRuntimeConfig } = getConfig();

import Basket from '../components/Basket/Basket';
import Table from '../components/Reusable/Table/Table';
import SubmissionDisplay from '../components/Submission/SubmissionDisplay';
import TableButtons from '../components/Submission/TableButtons';
import TopLevel from '../components/TopLevel';
import styles from '../styles/submissions.module.css';

const searchable = ['name', 'displayId', 'type', 'description', 'privacy'];

function Submissions() {
  const token = useSelector(state => state.user.token);
  const { submissions, isMySubmissionsLoading } = useMySubmissions(token);
  const { shared, isSharedLoading } = useSharedSubmissions(token);
  const [processedData, setProcessedData] = useState([]);
  const [selected, setSelected] = useState(new Map());
  const [selectAll, setSelectAll] = useState(false);
  const [buttonEnabled, setButtonEnabled] = useState(false);
  const [processUnderway, setProcessUnderway] = useState(false);

  useEffect(() => {
    if (processedData) {
      let checklist = new Map();
      for (const submission of processedData)
        checklist.set(submission.displayId, false);
      setSelected(checklist);
    }
  }, [processedData]);

  useEffect(() => {
    if (selected && selected.size > 0) {
      let allSelected = true;
      let oneSelected = false;
      for (const checked of selected.values()) {
        if (!checked) {
          allSelected = false;
        } else {
          oneSelected = true;
        }
      }
      setSelectAll(allSelected);
      setButtonEnabled(oneSelected);
    }
  }, [selected, processedData]);

  useEffect(() => {
    if (submissions && shared) {
      for (const element of shared) {
        element.privacy = 'shared';
      }
      setProcessedData(processSubmissions([...submissions, ...shared]));
    }
  }, [shared, submissions]);

  return (
    <div className={styles.container}>
      <Basket />
      <div className={styles.content}>
        <TableButtons
          buttonEnabled={buttonEnabled}
          selected={selected}
          setSelected={setSelected}
          processedData={processedData}
          token={token}
          setProcessUnderway={setProcessUnderway}
        />
        <div className={styles.submissiontablecontainer}>
          <Table
            data={processedData}
            loading={
              isMySubmissionsLoading || isSharedLoading || processUnderway
            }
            title="My Submissions"
            searchable={searchable}
            headers={[
              <input
                key={0}
                checked={selectAll}
                onChange={event => {
                  let checklist = new Map();
                  for (const submission of processedData)
                    checklist.set(submission.displayId, event.target.checked);
                  setSelected(checklist);
                  setSelectAll(event.target.checked);
                }}
                type="checkbox"
              />,
              'Name',
              'Display ID',
              'Description',
              'Type',
              'Privacy'
            ]}
            sortOptions={options}
            defaultSortOption={options[0]}
            sortMethods={sortMethods}
            numberShownLabel=" "
            updateRowsWhen={selected}
            dataRowDisplay={submission => (
              <SubmissionDisplay
                key={submission.displayId}
                submission={submission}
                selected={selected}
                setSelected={setSelected}
              />
            )}
          />
        </div>
      </div>
    </div>
  );
}

const options = [
  { value: 'name', label: 'Name' },
  { value: 'displayId', label: 'Display ID' },
  { value: 'type', label: 'Type' },
  { value: 'privacy', label: 'Privacy' }
];

const compareStrings = (string1, string2) => {
  return (string1.toLowerCase() > string2.toLowerCase() && 1) || -1;
};

const sortMethods = {
  name: (submission1, submission2) =>
    compareStrings(submission1.name, submission2.name),
  displayId: (submission1, submission2) =>
    compareStrings(submission1.displayId, submission2.displayId),
  type: (submission1, submission2) =>
    compareStrings(submission1.type, submission2.type),
  privacy: (submission1, submission2) =>
    compareStrings(submission1.privacy, submission2.privacy)
};

const useMySubmissions = token => {
  const { data, error } = useSWR(
    [`${publicRuntimeConfig.backend}/manage`, token],
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
    [`${publicRuntimeConfig.backend}/shared`, token],
    fetcher
  );

  return {
    shared: data,
    isSharedLoading: !error && !data,
    isSharedError: error
  };
};

const processSubmissions = submissions => {
  for (const submission of submissions) {
    const potentialType = submission.type.toLowerCase();

    // Identify what type of object the search result is from type url
    if (potentialType.includes('component')) {
      submission.type = 'Component';
    }
    if (potentialType.includes('sequence')) {
      submission.type = 'Sequence';
    }
    if (potentialType.includes('module')) {
      submission.type = 'Module';
    }
    if (potentialType.includes('collection')) {
      submission.type = 'Collection';
    }

    if (submission.privacy !== 'shared') {
      submission.privacy = 'public';
      if (!submission.uri.includes('/public/')) submission.privacy = 'private';
    }
  }

  return submissions;
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
