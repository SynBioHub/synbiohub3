import React, { useEffect, useRef, useState } from 'react';

import styles from '../../../../styles/view.module.css';

import { useDispatch, useSelector } from 'react-redux';
import { setUploadStatus } from '../../../../redux/actions';
import edam from './edam.json';

import Select from 'react-select';
import options from './SelectOptions';

import getConfig from 'next/config';
const { publicRuntimeConfig } = getConfig();

import axios from 'axios';

/**
 * @param {Any} properties Information passed in from parent component.
 * @returns A section where the owner can upload attachments or lookup attachments.
 */
export default function UploadAttachments(properties) {
  const [filledFieldsCount, setFilledFieldsCount] = useState([]);
  const [selectedOption, setSelectedOption] = useState('Attachment type...');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadError, setUploadError] = useState('');
  const fileInput = useRef(null);
  const uploadGeneration = useRef(0);
  const dispatch = useDispatch();
  const token = useSelector(state => state.user.token);
  const uploadStatus = useSelector(state => state.attachments.uploadStatus);
  useEffect(() => {
    uploadGeneration.current += 1;
    setSelectedFiles([]);
    setUploadError('');
    dispatch(setUploadStatus(''));
    if (fileInput.current) fileInput.current.value = '';
    return () => { uploadGeneration.current += 1; };
  }, [properties.uri, token, dispatch]);

  const errorMessage = error =>
    typeof error.response?.data === 'string' && error.response.data
      ? error.response.data
      : error.message || 'Attachment upload failed. Please try again.';

  /**
   * Handles a input value change and updates the filled inputs array.
   * @param {Object} e The event that is passed in from the onChange.
   */
  const handleAttachURLChange = e => {
    //Change is from the react-select component.
    if (e.value !== undefined) {
      setSelectedOption(e.label);
      updateFilledFields('type', e.value);
    } else updateFilledFields(e.target.name, e.target.value);

    /**
     * Adds/removes items from the filled fields state variable accordingly.
     * @param {String} name The name of the input to check filled fields against.
     * @param {String} value The value of the input.
     */
    function updateFilledFields(name, value) {
      if (value !== '' && !filledFieldsCount.includes(name)) {
        setFilledFieldsCount([...filledFieldsCount, name]);
      } else if (
        (value === '' || value === 'Attachment type...') &&
        filledFieldsCount.includes(e.target.name)
      ) {
        setFilledFieldsCount(filledFieldsCount.filter(item => item !== name));
      }
    }
  };

  /**
   * Uses the attachURL endpoint to post the new attachment.
   * @param {Object} attachment Contains information from the inputs about the attachment.
   */
  const attachFromURL = async attachment => {
    const url = `${publicRuntimeConfig.backend.replace(/\/$/, '')}${new URL(attachment.uri).pathname}/attachURL`;
    var headers = {
      Accept: 'text/plain; charset=UTF-8',
      'X-authorization': token
    };

    const parameters = new URLSearchParams();
    parameters.append('url', attachment.url);
    parameters.append('name', attachment.name);
    parameters.append('type', attachment.type);

    setUploadError('');
    try {
      await axios.post(url, parameters, { headers });
      properties.setRefreshMembers(true);
      return true;
    } catch (error) {
      setUploadError(errorMessage(error));
      return false;
    }
  };

  /**
   * Uses the /attach endpoint to post the new attachment.
   * @param {Array} files An array of objects that contain the information about the files.
   * @param {String} uri The URI of the collection.
   */
  const attachFromFile = async (files, uri) => {
    const url = `${publicRuntimeConfig.backend.replace(/\/$/, '')}${new URL(uri).pathname}/attach`;
    var headers = {
      Accept: 'text/plain; charset=UTF-8',
      'X-authorization': token
    };

    dispatch(setUploadStatus('Uploading'));
    setUploadError('');
    const generation = uploadGeneration.current;
    const pendingFiles = [...files];
    try {
      for (const file of files) {
        if (generation !== uploadGeneration.current) return;
        const form = new FormData();
        form.append('file', file.file);
        await axios.post(url, form, { headers });
        if (generation !== uploadGeneration.current) return;
        pendingFiles.shift();
        setSelectedFiles([...pendingFiles]);
        properties.setRefreshMembers(true);
      }
    } catch (error) {
      if (generation === uploadGeneration.current) setUploadError(errorMessage(error));
    } finally {
      if (generation === uploadGeneration.current) {
        dispatch(setUploadStatus(''));
        if (fileInput.current) fileInput.current.value = '';
      }
    }
  };

  return (
    <React.Fragment>
      {uploadError && <tr><td colSpan={6}><div role="alert">{uploadError}</div></td></tr>}
      <tr>
        <td>
          <strong>Upload Attachment</strong>
        </td>
        <td className={styles.attachtd} colSpan={2}>
          <div className={styles.attachelements}>
            <input
              id="attached-file-input"
              className={styles.fileattached}
              type="text"
              readOnly={true}
              value={selectedFiles.length > 1
                ? `${selectedFiles.length} files selected`
                : selectedFiles[0]?.file.name || ''}
            />
            <label className={styles.selectfile}>
              Select file(s)
              <input
                type="file"
                multiple
                ref={fileInput}
                disabled={uploadStatus !== ''}
                onChange={e => {
                  setSelectedFiles(Array.from(e.target.files || [], file => ({ file })));
                  setUploadError('');
                }}
              ></input>
            </label>
          </div>
        </td>
        <td className={styles.attachtd} colSpan={2}>
          <div
            type="button"
            className={
              selectedFiles.length > 0 && uploadStatus === ''
                ? styles.attachbutton
                : styles.attachbuttondisabled
            }
            onClick={() => {
              if (uploadStatus !== '') return;
              if (selectedFiles.length > 0) {
                attachFromFile(selectedFiles, properties.uri);
              } else {
                alert('You need to select at least 1 file.');
              }
            }}
          >
            {uploadStatus === '' ? (
              'Attach'
            ) : (
              <div className={styles.uploading}></div>
            )}
          </div>
        </td>
      </tr>
      <tr>
        <td>
          <strong>Lookup Attachment</strong>
        </td>
        <td colSpan={2}>
          <div className={styles.lookupurl}>
            <input
              onChange={e => handleAttachURLChange(e)}
              id="attach-url-url"
              className={styles.lookupinput}
              placeholder="URL"
              type="text"
              name="url"
              readOnly={false}
            />
          </div>
          <div className={styles.lookuprow}>
            <input
              onChange={e => handleAttachURLChange(e)}
              id="attach-url-name"
              className={styles.lookupinput}
              placeholder="Name"
              type="text"
              name="name"
              readOnly={false}
            />
            <Select
              className={styles.attachmentscustomselect}
              value={selectedOption}
              onChange={e => {
                handleAttachURLChange(e);
              }}
              options={options}
              menuPortalTarget={document.body}
              placeholder={selectedOption}
              styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
            />
          </div>
        </td>
        <td colSpan={2}>
          <div
            type="button"
            className={
              filledFieldsCount.length === 3
                ? styles.attachbutton
                : styles.attachbuttondisabled
            }
            onClick={async () => {
              if (filledFieldsCount.length === 3) {
                const nameInput = document
                  .getElementById('attach-url-name')
                  .value.replace(' ', '');
                const urlInput =
                  document.getElementById('attach-url-url').value;
                const typeInput = Object.keys(edam).find(
                  key => edam[key] === selectedOption
                );
                const uri = properties.uri;

                if (
                  properties.attachments.filter(
                    attachment => attachment.title === nameInput
                  ).length > 0
                ) {
                  alert('There is already an attachment with this name.');
                } else if (!urlInput.includes('http')) {
                  alert('The URL has to be a link');
                } else {
                  const uploaded = await attachFromURL({
                    name: nameInput, url: urlInput, type: typeInput, uri
                  });
                  if (!uploaded) return;

                  //Resets all the values to their default.
                  setSelectedOption('Attachment type...');
                  setFilledFieldsCount([]);
                  document.getElementById('attach-url-name').value = '';
                  document.getElementById('attach-url-url').value = '';
                }
              } else {
                alert(
                  'You must fill out all three fields in the Lookup Attachment row.'
                );
              }
            }}
          >
            Attach
          </div>
        </td>
      </tr>
    </React.Fragment>
  );
}
