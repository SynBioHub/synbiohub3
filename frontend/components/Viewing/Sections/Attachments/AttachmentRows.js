import React, { useState } from 'react';
import Link from 'next/link';

import deleteAttachment from '../../../../sparql/deleteAttachment';
import getSource from '../../../../sparql/getSource.js';

import getQueryResponse from '../../../../sparql/tools/getQueryResponse';
import edam from './edam.json';

import { useDispatch, useSelector } from 'react-redux';
import { downloadFiles } from '../../../../redux/actions';

import { faDownload, faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { getAfterThirdSlash } from '../../ViewHeader.js';

// const { publicRuntimeConfig } = getConfig();
import backendUrl from '../../../GetUrl/GetBackend';
import getConfig from 'next/config';

import styles from '../../../../styles/view.module.css';

/**
 * Renders the rows that contain any attachments that are returned from the query.
 *
 * @param {Any} properties Information passed down from the parent component.
 * @returns The rows the contains the information about the attachments.
 */
export default function AttachmentRows(properties) {
  const dispatch = useDispatch();
  const token = useSelector(state => state.user.token);
  const [attachmentInfo, setStateAttachments] = useState();
  const [attachments, setAttachments] = useState(properties.attachments.map(attachment => ({
    ...attachment,
    processedTopLevel: attachment.topLevel // Initialize with topLevel
  })));

  //There are attachments from the parent but they haven't been added to the state yet.
  if (attachmentInfo === undefined && properties.attachments.length > 0)
    setStateAttachments(properties.attachments);

  //There are no attachments to get.
  if (properties.attachments.length === 0) return null;

  // useEffect(() => {
  //   async function processAttachments() {
  //     const processedAttachments = await Promise.all(attachments.map(async attachment => {
  //       if (!attachment.processedTopLevel) {
  //         const result = await processUrl(attachment.topLevel, localStorage.getItem('registries'));
  //         return { ...attachment, processedTopLevel: result.urlRemovedForLink };
  //       }
  //       return attachment;
  //     }));
  //     setAttachments(processedAttachments);
  //   }
  //   processAttachments();
  // }, [attachments, token, dispatch]);

  /**
   * @param {Number} bytes The number of bytes.
   * @returns The correct unit and formatted number of bytes.
   */
  const bytesToSize = bytes => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes == 0) return '0';
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + sizes[i];
  };

  const removeUrl = urlLink => {
    return getAfterThirdSlash(urlLink);
  }

  /**
   * @param {String} type The URL from edamontology.org that has what format the file is.
   * @returns The corresponding name of extension from the edam.json file.
   */
  const edamTypeConverter = type => edam[`${type}`];

  return attachments.map((attachment, key) => {
    if (attachment.processedTopLevel.startsWith("http")) {
      attachment.processedTopLevel = removeUrl(attachment.processedTopLevel);
    }
    return (
      <tr key={key}>
        <td>
          {attachment.format.includes('format_')
            ? edamTypeConverter(attachment.format)
            : attachment.format.split('/').pop()}
        </td>
        <td>
          <Link href={attachment.processedTopLevel}>
            <a className={styles.link}>{attachment.title}</a>
          </Link>
        </td>
        <td>{attachment.size === '' ? '' : bytesToSize(attachment.size)}</td>
        <td className={styles.downloadbutton}>
          <div
            type="button"
            onClick={() => {
              //The attachment was uploaded from a URL so it must be handled differently.
              if (attachment.size === '') {
                getQueryResponse(dispatch, getSource, {
                  uri: attachment.topLevel
                }).then(source => {
                  window.open(source[0].source, '_blank');
                });
              } else {
                const item = {
                  url: `${backendUrl
                    }/${attachment.processedTopLevel}/download`,
                  name: attachment.title.substring(
                    0,
                    attachment.title.lastIndexOf('.')
                  ),
                  displayId: attachment.title.substring(
                    0,
                    attachment.title.lastIndexOf('.')
                  ),
                  type: attachment.format.split('/').pop(),
                  status: 'downloading'
                };
                dispatch(downloadFiles([item]));
              }
            }}
          >
            <FontAwesomeIcon
              icon={faDownload}
              size="1x"
              color="#465875"
              className={styles.downloadicon}
            />{' '}
            Download
          </div>
        </td>
        <td className={styles.removebutton}>
          {properties.owner && (
            <div
              type="button"
              onClick={async () => {
                const copy = [...attachments];
                const deletedAttachment = copy.splice(key, 1);
                setAttachments(copy);
                await getQueryResponse(
                  dispatch,
                  deleteAttachment,
                  { uri: deletedAttachment[0].topLevel },
                  token,
                  true
                );
                window.location.reload();
              }}
            >
              <FontAwesomeIcon
                icon={faTrashAlt}
                size="1x"
                color="#465875"
                className={styles.deleteicon}
              />
            </div>
          )}
        </td>
      </tr>
    );
  });
}
