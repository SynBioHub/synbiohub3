import React, { useState } from 'react';

import styles from '../../../../styles/view.module.css';

import { useDispatch, useSelector } from 'react-redux';
import { setAttachments, setUploadStatus } from '../../../../redux/actions';

import getAttachments from '../../../../sparql/getAttachments';
import getQueryResponse from '../../../../sparql/tools/getQueryResponse';
import edam from './edam.json';

import Select from 'react-select';
import options from './SelectOptions';

const { publicRuntimeConfig } = getConfig();
import getConfig from 'next/config';

/**
 * @param {Any} properties Information passed in from parent component.
 * @returns A section where the owner can upload attachments or lookup attachments.
 */
export default function UploadAttachments(properties) {
  const [filledFieldsCount, setFilledFieldsCount] = useState([]);
  const [selectedOption, setSelectedOption] = useState('Attachment type...');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const dispatch = useDispatch();
  const token = useSelector(state => state.user.token);
  const uploadStatus = useSelector(state => state.attachments.uploadStatus);

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
    const url = `${attachment.uri}/attachURL`;
    var headers = {
      Accept: 'text/plain; charset=UTF-8',
      'X-authorization': token
    };

    const parameters = new URLSearchParams();
    parameters.append('url', attachment.url);
    parameters.append('name', attachment.name);
    parameters.append('type', attachment.type);

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: parameters
    });

    if (response.status !== 200) console.error(response.status);
    else properties.setRefreshMembers(true);
  };

  /**
   * Uses the /attach endpoint to post the new attachment.
   * @param {Array} files An array of objects that contain the information about the files.
   * @param {String} uri The URI of the collection.
   */
  const attachFromFile = async (files, uri) => {
    const url = `${uri}/attach`;
    var headers = {
      Accept: 'text/plain; charset=UTF-8',
      'X-authorization': token
    };

    dispatch(setUploadStatus('Uploading'));

    for (let fileIndex = 0; fileIndex < files.length; fileIndex++) {
      const form = new FormData();
      form.append('file', files[fileIndex].file);

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: form
      });

      if (response.status !== 200) console.error(response.status);
      else properties.setRefreshMembers(true);
    }
  };

  return (
    <React.Fragment>
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
            />
            <label className={styles.selectfile}>
              Select file(s)
              <input
                type="file"
                multiple
                onChange={e => {
                  const files = e.target.files;

                  //Handles if the user clicks the cancel button.
                  if (files.length === 0) {
                    document.getElementById('attached-file-input').value = '';
                    setSelectedFiles([]);
                  } else {
                    if (files.length > 1)
                      document.getElementById(
                        'attached-file-input'
                      ).value = `${files.length} files selected`;
                    else
                      document.getElementById('attached-file-input').value =
                        e.target.files[0].name;

                    const currentlySelectedFiles = [];
                    for (const file of files) {
                      currentlySelectedFiles.push({
                        file: file
                      });
                    }

                    setSelectedFiles(currentlySelectedFiles);
                  }
                }}
              ></input>
            </label>
          </div>
        </td>
        <td className={styles.attachtd} colSpan={2}>
          <div
            type="button"
            className={
              selectedFiles.length > 0
                ? styles.attachbutton
                : styles.attachbuttondisabled
            }
            onClick={() => {
              if (selectedFiles.length > 0) {
                //Resets everything.
                document.getElementById('attached-file-input').value = '';
                setSelectedFiles([]);

                attachFromFile(
                  selectedFiles,
                  properties.uri.replace(
                    'https://synbiohub.org',
                    publicRuntimeConfig.backend
                  )
                ).then(() => {
                  dispatch(setUploadStatus(''));

                  //Query all the attachments so the store can be updated.
                  getQueryResponse(getAttachments, {
                    uri: properties.uri
                  }).then(allAttachments => {
                    dispatch(setAttachments(allAttachments));
                  });
                });
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
            onClick={() => {
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
                  const attachment = {
                    name: nameInput,
                    url: urlInput,
                    type: typeInput,
                    uri: uri.replace(
                      'https://synbiohub.org',
                      publicRuntimeConfig.backend
                    )
                  };

                  attachFromURL(attachment);

                  const convertedUrl = uri.slice(
                    0,
                    uri.slice(0, uri.lastIndexOf('/')).lastIndexOf('/') + 1
                  );
                  const version = '1';
                  const newAttachment = {
                    format: typeInput,
                    size: '',
                    title: nameInput,
                    topLevel: `${convertedUrl}${nameInput}/${version}`
                  };

                  //Updates the attachments in the store so AttachmentRows can reflex the new attachment.
                  dispatch(
                    setAttachments([...properties.attachments, newAttachment])
                  );

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
