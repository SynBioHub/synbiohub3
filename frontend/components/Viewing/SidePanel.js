import {
  faBars,
  faCalendarPlus,
  faHammer,
  faQuoteLeft,
  faUserEdit,
  faCodeBranch,
  faCalendarMinus
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import Link from 'next/link';

import styles from '../../styles/view.module.css';

import SectionSelector from './SectionSelector';
import SidePanelTools from './SidePanelTools';

import { processUrl } from '../Admin/Registries';
import { useEffect } from 'react';
import axios from 'axios';
import getConfig from 'next/config';
const { publicRuntimeConfig } = getConfig();

import GenericContent from './PageJSON/Rendering/GenericContent';
import MetadataInfo from './MetadataInfo';

/**
 * The side panel that has information about the object.
 * Has buttons for downloading, sharing, citing and deleting along with page sections.
 *
 * @param {Any} properties Information from the parent component.
 */
export default function SidePanel({ metadata, type, json, uri, plugins, translation = 0, setTranslation = () => { } }) {
  const [processedUrl, setProcessedUrl] = useState({ original: uri });
  const [collectionIcon, setCollectionIcon] = useState(null);
  const dateCreated = metadata.createdDates.split(", ")[0].replace('T', ' ').replace('Z', '');
  const dateModified = metadata.modifiedDates.replace('T', ' ').replace('Z', '');
  const registries = JSON.parse(localStorage.getItem("registries")) || {};

  const token = useSelector(state => state.user.token);
  const dispatch = useDispatch();

  useEffect(() => {
    async function fetchAndProcessUrl() {
      const result = await processUrl(uri, registries);
      setProcessedUrl(result);
    }

    fetchAndProcessUrl();
  }, [uri]);

  useEffect(() => {
    // Check if it's a collection and if URI contains /public/
    const isCollection = type && type.toLowerCase().includes('collection');
    const isPublic = uri && uri.includes('/public/');

    if (isCollection && isPublic) {
      // Extract the path from the URI
      let iconPath = '';
      try {
        const uriObj = new URL(uri);
        iconPath = uriObj.pathname;
      } catch (e) {
        // If URI parsing fails, try to extract path manually
        const publicIndex = uri.indexOf('/public/');
        if (publicIndex !== -1) {
          iconPath = uri.substring(publicIndex);
        }
      }

      if (iconPath) {
        // Construct the icon URL with cache busting to ensure fresh image loads
        const iconUrl = `${publicRuntimeConfig.backend}${iconPath}/icon?t=${Date.now()}`;
        setCollectionIcon(iconUrl);
      }
    }
  }, [type, uri]);

  const pagesInfo = getPagesInfo(type, json, plugins);
  return (
    <div
      className={
        translation === 0
          ? styles.sidepanelcontaineropen
          : styles.sidepanelcontainercollapse
      }
    >
      <div
        className={styles.sidepanel}
        style={{
          transform: `translateX(-${translation}rem)`,
          transition: 'transform 0.3s'
        }}
      >
        <div className={styles.headercontainer}>
          <div className={styles.headeroverflowcontainer}>
            <div className={styles.titleHolder}>
              <div className={styles.titleRow}>
                <h2 className={styles.title}>{metadata.name}</h2>
                {collectionIcon && (
                  <img
                    src={collectionIcon}
                    alt="Collection icon"
                    className={styles.collectionIcon}
                    onError={(e) => {
                      // Hide the image if it fails to load
                      e.target.style.display = 'none';
                    }}
                  />
                )}
              </div>
              <Link
                href={`/search/displayId='${metadata.displayId}'&`}
              >
                <a
                  title="Find all records with the same identifier"
                  target="_blank"
                >
                  <div className={styles.displayId}>({metadata.displayId})</div>
                </a>
              </Link>
            </div>
          </div>
        </div>
        <div
          className={styles.boundedheightforsidepanel}
          style={{
            transform: `translateX(-${translation === 18 ? 2.5 : 0}rem)`,
            transition: 'transform 0.3s'
          }}
        >
          <SidePanelTools
            creator={metadata.creators}
            type={type}
            displayId={metadata.displayId}
            name={metadata.name}
            url={processedUrl.urlRemovedForLink || processedUrl.original}
            uri={uri}
            description={metadata.description}
            version={metadata.version}
          />
          <div className={styles.infocontainer}>
            <MetadataInfo
              icon={faCodeBranch}
              label="Version"
              title={metadata.version}
            />
            <MetadataInfo
              icon={faQuoteLeft}
              label="Source"
              title={metadata.wasDerivedFroms}
              link={metadata.wasDerivedFroms}
              uri={uri}
            />
            <MetadataInfo
              icon={faHammer}
              label="Generated By"
              title={metadata.wasGeneratedBys}
              link={metadata.wasGeneratedBys}
              uri={uri}
            />
            <MetadataInfo
              icon={faUserEdit}
              label="Creator"
              title={metadata.creators}
              link={`/user/${metadata.creators.replace(' ', '')}`}
            />
            <MetadataInfo
              icon={faCalendarPlus}
              label="Date Created"
              title={dateCreated}
              link={`/search/createdBefore=${dateCreated.substring(
                0,
                dateCreated.lastIndexOf('-') + 3
              )}&createdAfter=${dateCreated.substring(0, dateCreated.lastIndexOf('-') + 3)}&`}
            />
            <MetadataInfo
              icon={faCalendarMinus}
              label="Date Modified"
              title={dateModified}
              link={`/search/modifiedBefore=${dateModified.substring(
                0,
                dateModified.lastIndexOf('-') + 3
              )}&modifiedAfter=${dateModified.substring(0, dateModified.lastIndexOf('-') + 3)}&`}
            />
            {/* <MetadataInfo
              icon={faRunning}
              label="Persistent Identity"
              title={displayTitle}
              link={uri}
            /> */}
            <GenericContent json={json} uri={uri} metadata={true} />
          </div>
          <SectionSelector pagesInfo={pagesInfo} json={json} />
        </div>
      </div>
    </div>
  );
}

function getPagesInfo(type, json, plugins) {
  // If there is no metadata JSON or it doesn't define pages, return an empty order.
  if (!json || !json.pages) return { type: type, order: [] };

  if (json.pages && localStorage.getItem(type) === null) {
    const order = json.pages;

    if (plugins && plugins.rendering) {
      for (let plugin of plugins.rendering) {
        order.push('PLUGIN: ' + plugin.name);
      }
    }

    if(type === 'ComponentDefinition' || type === 'ModuleDefinition') {
      order.unshift('Visualization');
    }

    return { type: type, order: order };
  }

  const order = JSON.parse(localStorage.getItem(type)).order;

  const orderUpdated = order.filter(page => {
    if (page.startsWith('PLUGIN: ')) {
      if (plugins && plugins.rendering) {
        for (let plugin of plugins.rendering) {
          if (plugin.name === page.substring(8, page.length)) {
            return true;
          }
        }
      }
      return false;
    }
    return true;
  });

  if (plugins && plugins.rendering) {
    for (let plugin of plugins.rendering) {
      if (!orderUpdated.includes('PLUGIN: ' + plugin.name)) {
        orderUpdated.push('PLUGIN: ' + plugin.name);
      }
    }
  }

  if (type === 'ComponentDefinition' || type === 'ModuleDefinition') {
    if (!orderUpdated.includes('Visualization'))
    orderUpdated.unshift('Visualization');
  }

  return { type: type, order: orderUpdated };
}