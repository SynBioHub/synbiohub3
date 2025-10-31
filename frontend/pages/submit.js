import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useDispatch } from 'react-redux';

import ChooseCollection from '../components/Submit/ChooseCollection/ChooseCollection';
import UploadFileSection from '../components/Submit/FileComponents/UploadFileSection';
import OverwriteObjects from '../components/Submit/OverwriteObjects';
import SubmissionStatusPanel from '../components/Submit/SubmissionStatusPanel';
import SubmitButton from '../components/Submit/SubmitButton';
import TopLevel from '../components/TopLevel';
import { getCanSubmitTo, setPromptNewCollection } from '../redux/actions';
import styles from '../styles/submit.module.css';

import ConfigureModal from '../components/Viewing/Modals/ConfigureModal';
import SubmissionHandler from '../components/Submit/ReusableComponents/SubmissionHandler';

function Submit() {
  const [files, setFiles] = useState([]);
  const [overwriteCollection, setOverwriteCollection] = useState(false);
  const [selectedHandler, setSelectedHandler] = useState({value: 'default', label: 'Default Handler'});
  const [modal, setModal] = useState();
  const [activeTab, setActiveTab] = useState('select'); // 'select' or 'create'

  const showSubmitProgress = useSelector(
    state => state.submit.showSubmitProgress
  );

  const dispatch = useDispatch();
  dispatch(getCanSubmitTo());

  // Handle tab switching and update Redux state accordingly
  useEffect(() => {
    if (activeTab === 'select') {
      dispatch(setPromptNewCollection(false));
    } else if (activeTab === 'create') {
      dispatch(setPromptNewCollection(true));
    }
  }, [activeTab, dispatch]);

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
        {/* File Upload Section - Top */}
        <UploadFileSection files={files} setFiles={setFiles} />
        
        {/* Submission Handler */}
        <SubmissionHandler 
          selectedHandler={selectedHandler}
          setSelectedHandler={setSelectedHandler}
          configureOption={true}
          failed={false}
        />
        
        {/* Tab Layout for Collection Selection */}
        <div className={styles.collectionTabsContainer}>
          <div className={styles.tabs}>
            <div 
              className={`${styles.tab} ${activeTab === 'select' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('select')}
            >
              Select Existing Collection
            </div>
            <div 
              className={`${styles.tab} ${activeTab === 'create' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('create')}
            >
              Create New Collection
            </div>
          </div>
          
          <div className={styles.tabContent}>
            {activeTab === 'select' ? (
              <>
                {/* Overwrite Option - Fixed at the top */}
                <OverwriteObjects
                  checked={overwriteCollection}
                  setChecked={setOverwriteCollection}
                />
                {/* Scrollable collection list */}
                <div className={styles.collectionScrollArea}>
                  <ChooseCollection label="" showCreateButton={false} />
                </div>
              </>
            ) : (
              <ChooseCollection label="" forceNewCollection={true} hideCancel={true} />
            )}
          </div>
        </div>
        
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
