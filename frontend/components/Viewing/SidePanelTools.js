import {
  faCloudDownloadAlt,
  faDatabase,
  faQuoteRight,
  faTrashAlt,
  faCopy,
  faShare,
  faPlus,
  faSearch,
  faGlobeAmericas
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { useState } from "react";
import Link from 'next/link';

import DeleteModal from "./Modals/DeleteModal";
import ShareModal from "./Modals/ShareModal";
import DownloadModal from "./Modals/DownloadModal";
import AddToCollectionModal from "./Modals/AddToCollectionModal";
import ReactDOM from 'react-dom';
import PublishModal from '../Submission/PublishModal';
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
  const [processUnderway, setProcessUnderway] = useState(false);

  const username = useSelector(state => state.user.username);
  const loggedIn = useSelector(state => state.user.loggedIn);

  const handleDeletionComplete = () => {
    dispatch(restoreBasket());
  };

  const publishInfo = {
    displayId: properties.displayId,
    name: properties.name,
    uri: properties.uri,
    type: properties.type,
    url: properties.url,
    description: properties.description,
    version: properties.version
  }


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
              :
              modal === "MakePublic" ?
              ReactDOM.createPortal(
                <PublishModal
                  toPublish={[publishInfo]}
                  showPublishModal={true}
                  setShowPublishModal={setModal}
                  setProcessUnderway={setProcessUnderway}
                  inCollectionPage={true}
                />,
                typeof window !== "undefined" ? document.body : null
              )
                : null
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
          icon={faSearch}
          size="1x"
          className={styles.actionicon}
          onClick={() => {
            setModal("AddToCollection");
          }}
          title="Search Options" // Placeholder for add to collection button description
        />
        <FontAwesomeIcon
          icon={faShare}
          size="1x"
          className={styles.actionicon}
          onClick={() => {
            setModal("Share");
          }}
          title="Share Item" // Placeholder for share button description
        />
        <FontAwesomeIcon
          icon={faCloudDownloadAlt}
          size="1x"
          className={styles.actionicon}
          onClick={() => {
            setModal("Download");
          }}
          title="Download Item" // placeholder for download button description
        />
        <FontAwesomeIcon
          icon={faQuoteRight}
          size="1x"
          className={styles.actionicon}
          onClick={() => {
            copyToast("Citation Copied!");
            copyToClipboard();
          }}
          title="Copy Citation" // placeholder for copy button description
        />
        <FontAwesomeIcon
          icon={faGlobeAmericas}
          size="1x"
          className={styles.actionicon}
          onClick={() => {
            setModal("MakePublic");
          }}
          title="Make Public" // placeholder for unlock button description
        />
        {loggedIn && (
          <FontAwesomeIcon
            icon={faPlus}
            size="1x"
            className={styles.actionicon}
            onClick={() => {
              setModal("AddToCollection");
            }}
            title="Add to Collection" // placeholder for add to collection button description
          />
        )}
        {isOwner && (
          <FontAwesomeIcon
            icon={faTrashAlt}
            size="1x"
            className={styles.actionicon}
            onClick={() => setModal("Delete")}
            title="Delete Item" // placeholder for delete button description
          />
        )}
      </div>
    </div>
  );
}