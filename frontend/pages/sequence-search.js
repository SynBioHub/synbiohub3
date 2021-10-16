import { faDna } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useRouter } from 'next/router';
import { useState } from 'react';

import SearchHeader from '../components/SearchComponents/SearchHeader/SearchHeader';
import Options from '../components/SearchComponents/SequenceSearch/Options';
import UploadFile from '../components/SearchComponents/SequenceSearch/UploadFile';
import InputField from '../components/SubmitComponents/ReusableComponents/InputField';
import TopLevel from '../components/TopLevel';
import styles from '../styles/sequencesearch.module.css';

export default function SequenceSearch() {
  const [sequence, setSequence] = useState('');
  const [needsVerification, setNeedsVerification] = useState('');
  const [files, setFiles] = useState([]);

  const router = useRouter();

  return (
    <TopLevel doNotTrack={true} hideFooter={true} publicPage={true}>
      <div className={styles.container}>
        <SearchHeader selected="Sequence Search" />
        <div className={styles.standardcontainer}>
          <div className={styles.body}>
            <InputField
              labelText="Enter Sequence"
              inputName="sequence"
              placeholder="ATTC..."
              value={sequence}
              needsVerification={needsVerification}
              setNeedsVerification={setNeedsVerification}
              onChange={event => setSequence(event.target.value)}
              customInput="textarea"
            />

            <UploadFile files={files} setFiles={setFiles} />

            <Options />

            <div
              className={styles.searchbutton}
              role="button"
              onClick={() => {
                if (files.length > 0)
                  router.push(`/search/file_search=${files[0].path}&`);
                else router.push(`/search/globalsequence=${sequence}&`);
              }}
            >
              <FontAwesomeIcon
                icon={faDna}
                size="1x"
                className={styles.dnaicon}
                color="#F2E86D"
              />
              <div>Search</div>
            </div>
          </div>
        </div>
      </div>
    </TopLevel>
  );
}
