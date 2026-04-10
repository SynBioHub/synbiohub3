import styles from "../../../styles/view.module.css";
import { faCamera } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import React, { useEffect, useState } from "react";

import CustomModal from "./CustomModal";

import getConfig from 'next/config';
const { publicRuntimeConfig } = getConfig();

import axios from "axios";
import { useSelector } from "react-redux";

/**
 * A modal that lets the user upload an icon image for a public collection.
 * 
 * @param {Any} properties Information passed in from the parent component.
 */
export default function CollectionIconModal(properties) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [submittable, setSubmittable] = useState(false);
  const token = useSelector(state => state.user.token);

  //Checks if the modal has been submitted and uploads the selected icon.
  useEffect(() => {
    if (submitted && selectedFile) {
        uploadIcon(selectedFile);
    }
  }, [submitted]);

  /**
   * Uploads the selected icon file to the collection.
   * 
   * @param {File} file The image file to upload.
   */
  const uploadIcon = async (file) => {
    try {
      // Extract the path from the URI (same logic as in SidePanel.js)
      let iconPath = '';
      try {
        const uriObj = new URL(properties.uri);
        iconPath = uriObj.pathname;
      } catch (e) {
        // If URI parsing fails, try to extract path manually
        const publicIndex = properties.uri.indexOf('/public/');
        if (publicIndex !== -1) {
          iconPath = properties.uri.substring(publicIndex);
        }
      }

      if (!iconPath) {
        console.error('Could not extract icon path from URI');
        return;
      }

      // Construct the icon URL (same as GET request)
      const iconUrl = `${publicRuntimeConfig.backend}${iconPath}/icon`;

      // Create FormData with the file
      const formData = new FormData();
      formData.append('collectionIcon', file);

      // Make POST request
      const response = await axios.post(iconUrl, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'X-authorization': token
        }
      });

      if (response.status === 200 || response.status === 201) {
        // Success - close modal and refresh the page to show new icon
        properties.setModal(null);
        setTimeout(() => {
          window.location.reload();
        }, 100);
      }
    } catch (error) {
      console.error('Error uploading icon:', error);
    }
  };

  return (
    <CustomModal
      buttonText={["Cancel", "Update"]}
      setModal={properties.setModal}
      setSubmitted={setSubmitted}
      submittable={submittable}
      error={"Please select an image file."}
      header={
        <React.Fragment>
          <FontAwesomeIcon
            icon={faCamera}
            size="1x"
            className={styles.modalicon}
          />
          <h1>Change Collection Icon</h1>
        </React.Fragment>
      }
      content={
        <React.Fragment>
          <div className={styles.downloadmodalcontainer}>
            <h5>Select icon (image files only)</h5>
            <label
              style={{
                display: 'block',
                width: '100%',
                padding: '0.5rem',
                marginTop: '0.5rem',
                border: '1px solid #ccc',
                borderRadius: '0.4rem',
                cursor: 'pointer',
                backgroundColor: '#fff',
                color: selectedFile ? '#465775' : '#888'
              }}
            >
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    setSelectedFile(file);
                    setSubmittable(true);
                  }
                }}
                style={{
                  display: 'none'
                }}
              />
              {selectedFile ? selectedFile.name : 'Select file'}
            </label>
          </div>
        </React.Fragment>
      }
    />
  );
}