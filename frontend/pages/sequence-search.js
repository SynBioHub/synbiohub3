import { faDna } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useRouter } from 'next/router';
import { useState } from 'react';

import SearchHeader from '../components/Search/SearchHeader/SearchHeader';
import Options from '../components/Search/SequenceSearch/Options';
import UploadFile from '../components/Search/SequenceSearch/UploadFile';
import InputField from '../components/Submit/ReusableComponents/InputField';
import TopLevel from '../components/TopLevel';
import styles from '../styles/sequencesearch.module.css';

export default function SequenceSearch() {
  const [sequence, setSequence] = useState('');
  const [needsVerification, setNeedsVerification] = useState('');
  const [files, setFiles] = useState([]);
  const [searchMethod, setSearchMethod] = useState('globalsequence');
  const [pairwiseIdentity, setPairwiseIdentity] = useState(2);
  const [numberResults, setNumberResults] = useState();
  const [minSeqLength, setMinSeqLength] = useState();
  const [maxSeqLength, setMaxSeqLength] = useState();
  const [maxRejects, setMaxRejects] = useState();
  const [percentMatch, setPercentMatch] = useState();

  const router = useRouter();

  const constructSearch = () => {
    let search = `${searchMethod}=${sequence}`;
    if (files.length > 0) search = `file_search=${files[0].path}`;

    const url = `/search/${search}&${getUrl(
      numberResults,
      'maxaccepts'
    )}${getUrl(minSeqLength, 'minseqlength')}${getUrl(
      maxSeqLength,
      'maxseqlength'
    )}${getUrl(maxRejects, 'maxrejects')}${getUrl(
      percentMatch / 100,
      'id'
    )}${getUrl(pairwiseIdentity, 'idddef', true)}`;
    router.push(url);
  };

  const getUrl = (value, term, isIddef = false) => {
    if (value && (!isIddef || value !== 2))
      return `${term}=${encodeURIComponent(value)}&`;
    return '';
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
