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
  const [searchMethod, setSearchMethod] = useState('globalsequence');
  const [pairwiseIdentity, setPairwiseIdentity] = useState(2);
  const [numberResults, setNumberResults] = useState(50);
  const [minSeqLength, setMinSeqLength] = useState(20);
  const [maxSeqLength, setMaxSeqLength] = useState(5000);
  const [maxRejects, setMaxRejects] = useState(100);
  const [percentMatch, setPercentMatch] = useState(80);

  const router = useRouter();

  const constructSearch = () => {
    let search = `${searchMethod}=${sequence}`;
    if (files.length > 0) search = `file_search=${files[0].path}`;

    router.push(
      `/search/${search}&maxaccepts=${numberResults}&minseqlength=${minSeqLength}&maxseqlength=${maxSeqLength}&maxrejects=${maxRejects}&id=${
        percentMatch / 100
      }&idddef=${pairwiseIdentity}&`
    );
  };

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

            <Options
              setSearchMethod={setSearchMethod}
              setPairwiseIdentity={setPairwiseIdentity}
              numResults={numberResults}
              setNumResults={setNumberResults}
              minSeqLength={minSeqLength}
              setMinSeqLength={setMinSeqLength}
              maxSeqLength={maxSeqLength}
              setMaxSeqLength={setMaxSeqLength}
              maxRejects={maxRejects}
              setMaxRejects={setMaxRejects}
              percentMatch={percentMatch}
              setPercentMatch={setPercentMatch}
            />

            <div
              className={styles.searchbutton}
              role="button"
              onClick={() => {
                constructSearch();
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
