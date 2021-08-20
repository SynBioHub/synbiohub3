import {
  faDownload,
  faGlobeAmericas,
  faPlus,
  faShareAlt,
  faTrashAlt,
  faUserLock
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import axios from 'axios';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import useSWR from 'swr';

import Basket from '../components/Basket';
import Table from '../components/ReusableComponents/Table/Table';
import TableButton from '../components/ReusableComponents/TableButton';
import TopLevel from '../components/TopLevel';
import styles from '../styles/submissions.module.css';
import { addToBasket } from '../redux/actions';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

const searchable = ['name', 'displayId', 'type', 'description', 'privacy'];

function Submissions() {
  const token = useSelector(state => state.user.token);
  const { submissions, isMySubmissionsLoading } = useMySubmissions(token);
  const { shared, isSharedLoading } = useSharedSubmissions(token);
  const [processedData, setProcessedData] = useState([]);
  const [selected, setSelected] = useState(new Map());
  const [selectAll, setSelectAll] = useState(false);
  const [buttonEnabled, setButtonEnabled] = useState(false);

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
        <TableButtons buttonEnabled={buttonEnabled} selected={selected} setSelected={setSelected} processedData={processedData} token={token} />
        <Table
          data={processedData}
          loading={isMySubmissionsLoading || isSharedLoading}
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
  );
}

function SubmissionDisplay(properties) {
  const router = useRouter();

  const [privacyDisplay, setPrivacyDisplay] = useState();

  useEffect(() => {
    if (properties.submission.privacy === 'public')
      setPrivacyDisplay(<FontAwesomeIcon icon={faGlobeAmericas} size="1x" />);
    else if (properties.submission.privacy === 'private')
      setPrivacyDisplay(
        <FontAwesomeIcon icon={faUserLock} color="#ff0000" size="1x" />
      );
    else setPrivacyDisplay(<FontAwesomeIcon icon={faShareAlt} size="1x" />);
  }, [properties.submission.privacy]);

  return (
    <tr
      key={properties.submission.displayId}
      className={styles.submission}
      onClick={() => {
        router.push(
          properties.submission.uri.replace(
            'https://synbiohub.org',
            process.env.backendUrl
          )
        );
      }}
    >
      <td>
        <input
          checked={properties.selected.get(properties.submission.displayId)}
          onChange={event => {
            properties.setSelected(
              new Map(
                properties.selected.set(
                  properties.submission.displayId,
                  event.target.checked
                )
              )
            );
          }}
          onClick={event => {
            event.stopPropagation();
          }}
          type="checkbox"
        />
      </td>
      <td>
        <code>{properties.submission.name}</code>
      </td>
      <td>{properties.submission.displayId}</td>
      <td>{properties.submission.description}</td>
      <td>{properties.submission.type}</td>
      <td>{privacyDisplay}</td>
    </tr>
  );
}


function TableButtons(properties) {

  const dispatch = useDispatch();

  const addCheckedItemsToBasket = () => {
    const itemsChecked = [];
    let checklist = new Map();
    for (const submission of properties.processedData) {
      checklist.set(submission.displayId, false);
      if (properties.selected.get(submission.displayId)) {
        itemsChecked.push({
          uri: submission.uri,
          name: submission.name
        });
      }
    }
    properties.setSelected(checklist);
    dispatch(addToBasket(itemsChecked));
  }

  const downloadCheckedItems = () => {
    let checklist = new Map();
    const itemsChecked = [];
    for (const submission of properties.processedData) {
      checklist.set(submission.displayId, false);
      if (properties.selected.get(submission.displayId)) {
        itemsChecked.push({
          url: `${process.env.backendUrl}${submission.url}/sbol`,
          name: submission.name,
          displayId: submission.displayId,
          type: 'xml'
        });
      }
    }
    properties.setSelected(checklist);
    downloadFiles(itemsChecked, properties.token);
  }

  return (
    <div className={styles.buttonscontainer}>
      <TableButton
        title="Add to Basket"
        enabled={properties.buttonEnabled}
        icon={faPlus}
        onClick={() => addCheckedItemsToBasket()}
      />
      <TableButton
        title="Download"
        enabled={properties.buttonEnabled}
        icon={faDownload}
        onClick={() => downloadCheckedItems()}
      />
      <TableButton
        title="Publish"
        enabled={properties.buttonEnabled}
        icon={faGlobeAmericas}
      />
      <TableButton
        title="Remove"
        enabled={properties.buttonEnabled}
        icon={faTrashAlt}
      />
    </div>
  );
}

const downloadFiles = (files, token) => {
  var count = 0;
  var zip = new JSZip();
  var zipFilename = "sbhdownload.zip";

  files.forEach((file) => {
    var filename = `${file.displayId}.${file.type}`;
    // loading a file and add it in a zip file
    axios({
      url: file.url,
      method: 'GET',
      responseType: 'blob',
      headers: {
        'X-authorization': token
      }
    }).then(response => {
        zip.file(filename, response.data);
        count++;
        console.log(count);
        console.log(files.length);
        console.log(file.displayId);
        if (count === files.length) {
          zip.generateAsync({type: "blob"})
          .then(function(content) {
            saveAs(content, zipFilename);
          })
        }
    });
  });
}

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

  /*
  let privacy = <FontAwesomeIcon icon={faGlobeAmericas} size="1x" />;
  if (!properties.uri.includes('/public/'))
    privacy = <FontAwesomeIcon icon={faUserLock} color="#ff0000" size="1x" />;

  */
};

const options = [
  { value: 'name', label: 'Name' },
  { value: 'displayId', label: 'Display ID' },
  { value: 'type', label: 'Type' },
  { value: 'privacy', label: 'Privacy' }
];

const sortString = (plugin1, plugin2) => {
  return (plugin1.name > plugin2.name && 1) || -1;
};

const sortMethods = {
  name: sortString,
  displayId: sortString,
  type: sortString,
  privacy: sortString
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
