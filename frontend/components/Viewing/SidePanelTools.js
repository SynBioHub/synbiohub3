import {
  faCloudDownloadAlt,
  faDatabase,
  faQuoteRight,
  faTrashAlt,
  faCopy,
  faLink,
  faShareAlt,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { useState } from "react";
import Link from 'next/link';

import DeleteModal from "./Modals/DeleteModal";
import ShareModal from "./Modals/ShareModal";
import DownloadModal from "./Modals/DownloadModal";
import AddToCollectionModal from "./Modals/AddToCollectionModal";
import { isUriOwner } from './Shell';
import { useSelector } from 'react-redux';

import styles from '../../styles/view.module.css';
import getConfig from 'next/config';
const { publicRuntimeConfig } = getConfig();

import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

/**
 * The side panel buttons and their interactions.
 * 
 * @param {Any} properties Information passed down from the parent component.
 */
export default function SidePanelTools(properties) {
  const [modal, setModal] = useState();

  const username = useSelector(state => state.user.username);
  const loggedIn = useSelector(state => state.user.loggedIn);

  const handleDeletionComplete = () => {
    dispatch(restoreBasket());
  };


  //The styles for the toast saying the citation has been copied.
  const copyToast = (message) => toast(
    <div>
      <FontAwesomeIcon
        icon={faCopy}
        size="1x"
        className={styles.toastcopyicon}
      />
      {message}
    </div>,
    {
      position: "top-right",
      autoClose: 500,
      hideProgressBar: true,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      className: styles.modaltoast
    }
  );

  var isOwner = isUriOwner(properties.uri, username);

  /**
   * Copies the link to the users clipboard.
   */
  const copyToClipboard = () => {
    navigator.clipboard.writeText(
      `${properties.name} was a gift from ${properties.creator === "" ? "undefined" : properties.creator} ; ${publicRuntimeConfig.backend}${properties.url}`
    );
  }
  var displayTitle = properties.type;
  if (properties.type.includes('#')) {
    displayTitle = properties.type.split('#')[1];
  }
  if (properties.type.includes('http://') || properties.type.includes('https://')) {
    const parts = properties.type.split('/');
    displayTitle = parts[parts.length - 1];
  }
  var displayLink = properties.type;
  if (!properties.type.includes('http')) {
    displayLink = `http://sbols.org/v2#${properties.type}`;
  }
  return (
    <div className={styles.subheader}>
      {modal === "Delete" ?
        (
          <DeleteModal
            url={properties.url}
            setModal={setModal}
            onDeletionComplete={handleDeletionComplete}
          />
        ) :
        modal === "Share" ?
          (
            <ShareModal
              url={properties.url}
              setModal={setModal}
            />
          ) :
          modal === "Download" ?
            <DownloadModal
              type={properties.type}
              name={properties.name}
              displayId={properties.displayId}
              url={properties.url}
              setModal={setModal}
              uri={properties.uri}
            />
            :
            modal === "AddToCollection" ?
              <AddToCollectionModal
                url={properties.url}
                setModal={setModal}
              />
              : null
        /*
        modal === "Curation" ?
          <CurationModal
            setModal={setModal}
            type={properties.type}
          />
          : null
          */
      }
      <div className={styles.id}>
        <Link href={displayLink}>
          <a title="Learn more about this RDF type" target="_blank">
            <FontAwesomeIcon
              icon={faDatabase}
              size="1x"
              className={styles.contentinfoicon}
            />
            {displayTitle}
          </a>
        </Link>
      </div>
      <div className={styles.actionicons}>
        <FontAwesomeIcon
          icon={faShareAlt}
          size="1x"
          className={styles.actionicon}
          onClick={() => {
            setModal("Share");
          }}
          title="Share this item" // Placeholder for share button description
        />
        <FontAwesomeIcon
          icon={faCloudDownloadAlt}
          size="1x"
          className={styles.actionicon}
          onClick={() => {
            setModal("Download");
          }}
          title="Download this item" // placeholder for download button description
        />
        {/*curationAvailable ?
        <FontAwesomeIcon
          icon={faFunnelDollar}
          size="1x"
          className={styles.actionicon}
          onClick={() => {
            setModal("Curation");
          }}
        /> : null */}
        <FontAwesomeIcon
          icon={faQuoteRight}
          size="1x"
          className={styles.actionicon}
          onClick={() => {
            copyToast("Copied!");
            copyToClipboard();
          }}
          title="Copy this item" // placeholder for copy button description
        />
        {loggedIn && (
          <FontAwesomeIcon
            icon={faLink}
            size="1x"
            className={styles.actionicon}
            onClick={() => {
              setModal("AddToCollection");
            }}
            title="Add to collection" // placeholder for add to collection button description
          />
        )}
        {isOwner && (
          <FontAwesomeIcon
            icon={faTrashAlt}
            size="1x"
            className={styles.actionicon}
            onClick={() => setModal("Delete")}
            title="Delete this item" // placeholder for delete button description
          />
        )}
      </div>
    </div>
  );
}