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

import { useEffect, useState } from "react";
import { useDispatch } from 'react-redux';
import Link from 'next/link';

import DeleteModal from "./Modals/DeleteModal";
import ShareModal from "./Modals/ShareModal";
import DownloadModal from "./Modals/DownloadModal";
import AddToCollectionModal from "./Modals/AddToCollectionModal";
import { isUriOwner } from './Shell';
import { useSelector } from 'react-redux';

import styles from '../../styles/view.module.css';

import getConfig from "next/config";
const { publicRuntimeConfig } = getConfig();

import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import CurationModal from './Modals/CurationModal';
import axios from 'axios';

/**
 * The side panel buttons and their interactions.
 * 
 * @param {Any} properties Information passed down from the parent component.
 */
export default function SidePanelTools(properties) {
  const [modal, setModal] = useState();

  const username = useSelector(state => state.user.username);

  const handleDeletionComplete = () => {
    dispatch(restoreBasket()); // Replace with your actual dispatch action
  };

  /*
  const [curationAvailable, setCurationAvailable] = useState(false);

  useEffect(() => {
    /*
    const checkCurateAvailability = async () => {
      const available = await checkCuration(pluginData);
      setCurationAvailable(available);
    }
    checkCurateAvailability();
    
  })
  


  const pluginData = {
    complete_sbol: '',
    shallow_sbol: '',
    genbank: '',
    top_level: '',
    instanceUrl: '',
    size: 0,
    type: properties.type,
    submit_link: ''
  }
  */

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
        />
        <FontAwesomeIcon
          icon={faCloudDownloadAlt}
          size="1x"
          className={styles.actionicon}
          onClick={() => {
            setModal("Download");
          }}
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
        />
        <FontAwesomeIcon
          icon={faLink}
          size="1x"
          className={styles.actionicon}
          onClick={() => {
            setModal("AddToCollection");
          }}
        />
        {isOwner && (
          <FontAwesomeIcon
            icon={faTrashAlt}
            size="1x"
            className={styles.actionicon}
            onClick={() => setModal("Delete")}
          />
        )}
      </div>
    </div>
  );
}

/*
async function checkCuration(pluginData) {
  return await axios({
    method: 'GET',
    url: `${publicRuntimeConfig.backend}/admin/plugins`,
    responseType: 'application/json',
    params: {
      category: 'curation'
    }
  }).then(async function (response) {
    const curatePlugins = response.data;
    let pluginPromises = [];

    const buildPromises = async () => {
        for(let plugin of curatePlugins) {
        pluginPromises.push(axios({
          method: 'POST',
          url: `${publicRuntimeConfig.backend}/call`,
          params: {
            name: plugin.name,
            endpoint: 'evaluate',
            data: pluginData
          }
        }).then(response => {
          return response.status === 200;
        }).catch(error => {return false;}))
      }
    }

    await buildPromises();

    return Promise.all(pluginPromises).then(values => {
      for(let value of values) {
        if(value) return true;
      }
      return false;
    })
    
  }).catch(error => {return false;});

}
*/