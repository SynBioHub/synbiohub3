import { faCloudUploadAlt } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useDispatch } from 'react-redux';

import ChooseCollection from '../components/Submit/ChooseCollection/ChooseCollection';
import UploadFileSection from '../components/Submit/FileComponents/UploadFileSection';
import OverwriteObjects from '../components/Submit/OverwriteObjects';
import SubmitHeader from '../components/Submit/ReusableComponents/SubmitHeader';
import SubmissionStatusPanel from '../components/Submit/SubmissionStatusPanel';
import SubmitButton from '../components/Submit/SubmitButton';
import TopLevel from '../components/TopLevel';
import { getCanSubmitTo } from '../redux/actions';
import styles from '../styles/submit.module.css';

import ConfigureModal from '../components/Viewing/Modals/ConfigureModal';
import SubmissionHandler from '../components/Submit/ReusableComponents/SubmissionHandler';

function Submit() {
  const [files, setFiles] = useState([]);
  const [overwriteCollection, setOverwriteCollection] = useState(false);
  const [selectedHandler, setSelectedHandler] = useState({value: 'default', label: 'Default Handler'});
  const [modal, setModal] = useState();

  const showSubmitProgress = useSelector(
    state => state.submit.showSubmitProgress
  );

  const dispatch = useDispatch();
  dispatch(getCanSubmitTo());

  const handleClick = () => {
    if(selectedHandler.value === 'configure') {
      setModal('configure')
    }
  }

  if (showSubmitProgress) {
    return <SubmissionStatusPanel />;
  }
  return (
    <div className={styles.container}>
      {modal === 'configure' ?
        (
          <ConfigureModal
            setModal={setModal}
            files={files}
            overwriteCollection={overwriteCollection}
            failed={false}
          />
        )
      : null}
      <div className={styles.submitpanel}>
        <SubmitHeader
          icon={
            <FontAwesomeIcon
              icon={faCloudUploadAlt}
              size="3x"
              color="#00A1E4"
            />
          }
          title="Tell us about your submission"
          description="SynBioHub organizes your uploads into collections. Parts can be
            uploaded into an existing or new collection."
        />
        <UploadFileSection files={files} setFiles={setFiles} />
          <SubmissionHandler 
            selectedHandler={selectedHandler}
            setSelectedHandler={setSelectedHandler}
            configureOption={true}
            failed={false}
          
          />
        <ChooseCollection label="Select Destination Collection" />
        <OverwriteObjects
          checked={overwriteCollection}
          setChecked={setOverwriteCollection}
        />
        <SubmitButton files={files} overwriteCollection={overwriteCollection} submitHandler={selectedHandler} configure={handleClick} />
        
      </div>
    </div>
  );
}

export default function SubmitWrapped() {
  return (
    <TopLevel>
      <Submit />
    </TopLevel>
  );
}
