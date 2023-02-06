import { faCloudUploadAlt } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import axios from 'axios';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useDispatch } from 'react-redux';
import Select from "react-select";

import ChooseCollection from '../components/Submit/ChooseCollection/ChooseCollection';
import UploadFileSection from '../components/Submit/FileComponents/UploadFileSection';
import OverwriteObjects from '../components/Submit/OverwriteObjects';
import SubmitHeader from '../components/Submit/ReusableComponents/SubmitHeader';
import SubmissionStatusPanel from '../components/Submit/SubmissionStatusPanel';
import SubmitButton from '../components/Submit/SubmitButton';
import TopLevel from '../components/TopLevel';
import { getCanSubmitTo } from '../redux/actions';
import styles from '../styles/submit.module.css';

import getConfig from "next/config";
const { publicRuntimeConfig } = getConfig();

function Submit() {
  const [files, setFiles] = useState([]);
  const [overwriteCollection, setOverwriteCollection] = useState(false);
  const [selectedHandlers, setSelectedHandlers] = useState([]);
  let pluginsAvailable = false;

  const showSubmitProgress = useSelector(
    state => state.submit.showSubmitProgress
  );

  const dispatch = useDispatch();
  dispatch(getCanSubmitTo());

  const getSelectOptions = () => {
    const selectOptions = [];

    axios({
      method: 'GET',
      url: `${publicRuntimeConfig.backend}/admin/plugins`,
      responseType: 'application/json',
      params: {
        category: 'submit'
      }
    }).then(response => {
      const submitPlugins = response.data;

      for(let plugin of submitPlugins) {
        axios({
          method: 'POST',
          url: `${publicRuntimeConfig.backend}/call`,
          params: {
            name: plugin.name,
            endpoint: 'status'
          }
        }).then(response => {
          if(response.status === 200) selectOptions.push({value: plugin.name, label: plugin.name});
          pluginsAvailable = true;
        }).catch(error => {return;});
      }

    }).catch(error => {return;});

    return selectOptions;
  }

  if (showSubmitProgress) {
    return <SubmissionStatusPanel />;
  }
  return (
    <div className={styles.container}>
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
          <Select 
            className={styles.ownerselectcontainer}
            value={selectedHandlers}
            onChange={(e) => {
                setSelectedHandlers(e);
            }}
            options={getSelectOptions()}
            isMulti={true}
            menuPortalTarget={document.body}
            styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
            getOptionValue={option => option.label}
            placeholder='Submit Handler...'
          />
        <ChooseCollection label="Select Destination Collection" />
        <OverwriteObjects
          checked={overwriteCollection}
          setChecked={setOverwriteCollection}
        />
        <SubmitButton files={files} overwriteCollection={overwriteCollection} submitHandlers={selectedHandlers} />
        
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
