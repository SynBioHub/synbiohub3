import styles from '../../../styles/submit.module.css';
import { faCloudUploadAlt } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import JSZip from 'jszip';

import React, { useEffect, useState } from "react";

import CustomModal from "./CustomModal";

import { useDispatch, useSelector } from 'react-redux';
import SubmissionHandler from "../../Submit/ReusableComponents/SubmissionHandler";
import { submit } from '../../../redux/actions';







export default function ConfigureModal(properties) {

    const initializeMap = new Map();

    for (let file of properties.files) {
        initializeMap.set(file, {value: 'default', label: 'Default Handler'})
    }

    const [submitted, setSubmitted] = useState(false);
    const [fileMap, setFileMap] = useState(initializeMap);
    const dispatch = useDispatch();

    const selectedCollection = useSelector(
        state => state.submit.selectedCollection
      );


    useEffect(() => {
        if(submitted) {
            const pluginBundles = new Map();
            fileMap.forEach((value, key) => {
                if(value.value !== 'null') {
                    if(pluginBundles.has(value)) {
                        pluginBundles.get(value).push(key)
                    }
                    else {
                        const fileList = [];
                        fileList.push(key)
                        pluginBundles.set(value, fileList)
                    }
                }
            })

            if(pluginBundles.size !== 0) {
                const pluginObject = {
                    value: 'configure',
                    pluginBundles: pluginBundles
                }
    
                dispatch(
                    submit(
                      selectedCollection.uri,
                      properties.files,
                      properties.overwriteCollection ? 1 : 0,
                      properties.addingToCollection ? true : false,
                      pluginObject,
                      properties.failed
                    )
                  );
            }

            
        }
    },[submitted])



    const filesDisplay = properties.files.map(file => (
        <div key={file.name} className={styles.configurefile}>
            <p className={styles.configurefilename}>{file.name}</p>
            <SubmissionHandler 
                selectedHandler={fileMap.get(file)}
                setSelectedHandler={(e) => {
                    setFileMap(new Map(fileMap.set(file, e)));
                }}
                configureOption={false}
                failed={properties.failed}
            
            />
        </div>
    ));

    return (
        <CustomModal
        buttonText={["Cancel","Submit"]}
        setModal={properties.setModal}
        setSubmitted={setSubmitted}
        submittable={true}
        error={"Choose a file format."}
        header={
            <React.Fragment>
            <FontAwesomeIcon
                icon={faCloudUploadAlt}
                size="1x"
                className={styles.modalicon}
            />
            <h1>Configure Submission</h1>
            </React.Fragment>
        }
        content={
            <React.Fragment>
            <div className={styles.configuremodalcontainer}>
                <h5>Select a submission handler for each file:</h5>
                {filesDisplay}
            </div>
            </React.Fragment>
        }
        />
    )

}