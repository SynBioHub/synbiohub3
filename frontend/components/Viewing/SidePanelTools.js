import {
  faCloudDownloadAlt,
  faDatabase,
  faQuoteRight,
  faTrashAlt,
  faCopy,
  faLink,
  faShareAlt,
  faFunnelDollar
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { useState } from "react";
import Link from 'next/link';

import DeleteModal from "./Modals/DeleteModal";
import ShareModal from "./Modals/ShareModal";
import DownloadModal from "./Modals/DownloadModal";
import AddToCollectionModal from "./Modals/AddToCollectionModal";

import styles from '../../styles/view.module.css';

import getConfig from "next/config";
const { publicRuntimeConfig } = getConfig();

import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import CurationModal from './Modals/CurationModal';

/**
 * The side panel buttons and their interactions.
 * 
 * @param {Any} properties Information passed down from the parent component.
 */
export default function SidePanelTools(properties) {
  const [modal, setModal] = useState();

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

  /**
   * Copies the link to the users clipboard.
   */
  const copyToClipboard = () => {
    navigator.clipboard.writeText(
      `${properties.name} was a gift from ${properties.creator === "" ? "undefined" : properties.creator} ; ${publicRuntimeConfig.backend}${properties.url}`
    );
  }

  return (
    <div className={styles.subheader}>
      {modal === "Delete" ?
        (
          <DeleteModal
            url={properties.url}
            setModal={setModal}
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
            />
            :
            modal === "AddToCollection" ?
              <AddToCollectionModal
                url={properties.url}
                setModal={setModal}
              />
              : 
              modal === "Curation" ?
                <CurationModal
                  setModal={setModal}
                  type={properties.type}
                />
                : null
      }
      <div className={styles.id}>
        <Link href={`http://sbols.org/v2#${properties.type}`}>
          <a title="Learn more about this RDF type" target="_blank">
            <FontAwesomeIcon
              icon={faDatabase}
              size="1x"
              className={styles.contentinfoicon}
            />
            {properties.type}
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
        />
        <FontAwesomeIcon
          icon={faCloudDownloadAlt}
          size="1x"
          className={styles.actionicon}
          onClick={() => {
            setModal("Download");
          }}
        />
        <FontAwesomeIcon
          icon={faFunnelDollar}
          size="1x"
          className={styles.actionicon}
          onClick={() => {
            setModal("Curation");
          }}
        />
        <FontAwesomeIcon
          icon={faQuoteRight}
          size="1x"
          className={styles.actionicon}
          onClick={() => {
            copyToast("Copied!");
            copyToClipboard();
          }}
        />
        <FontAwesomeIcon
          icon={faLink}
          size="1x"
          className={styles.actionicon}
          onClick={() => {
            setModal("AddToCollection");
          }}
        />
        <FontAwesomeIcon
          icon={faTrashAlt}
          size="1x"
          className={styles.actionicon}
          onClick={() => {
            setModal("Delete");
          }}
        />
      </div>
    </div>
  );
}
