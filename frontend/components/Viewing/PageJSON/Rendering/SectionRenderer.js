import styles from '../../../../styles/view.module.css';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';
import { useDispatch, useSelector } from 'react-redux';
import useRegistries from '../Fetching/useRegistries';
import getConfig from 'next/config';
import axios from 'axios';
import { useEffect } from 'react';
import { useState } from 'react';
import { addError } from '../../../../redux/actions';
import sequenceOntology from '../../../../namespace/sequence-ontology';
import systemsBiologyOntology from '../../../../namespace/systems-biology-ontology';
import edamOntology from '../../../../namespace/edam-ontology';
const { publicRuntimeConfig } = getConfig();

import { processUrl } from '../../../Admin/Registries';
import edam from '../../../../namespace/edam-ontology';

function loadText(template, args) {
  for (const key of Object.keys(args)) {
    template = template.replace(new RegExp(`\\$<${key}>`, 'g'), args[key]);
  }
  return template;
}

export default function SectionRenderer({ section, metadata }) {
  const dispatch = useDispatch();
  const url = `${publicRuntimeConfig.backend}/admin/registries`;

  const [data, setData] = useState(null);
  const [processedLink, setProcessedLink] = useState(null);
  const token = useSelector(state => state.user.token);

  useEffect(() => {
    let isMounted = true;

    async function fetchDataAndProcessLink() {
      //... your existing code fetching the data

      // After you set the data, process the link
      if (isMounted && section.link) {
        const processed = await processUrl(section.link, localStorage.getItem('registries')); // Assuming you have token available
        setProcessedLink(processed);
      }
    }

    fetchDataAndProcessLink();

    return () => {
      isMounted = false;
    };
  }, []);


  useEffect(() => {
    let isMounted = true; // <-- add this line

    axios
      .get(url, { headers: { accept: 'text/plain' } })
      .then(res => res.data.registries)
      .then((registries) => {
        if (isMounted) {  // <-- check this condition before setting state
          setData(registries);
        }
      })
      .catch(error => {
        error.customMessage = 'Request failed for GET /admin/registries';
        error.fullUrl = url;
        dispatch(addError(error))
      });

    return () => {  // <-- cleanup function
      isMounted = false;  // <-- set the flag to false when the component unmounts
    };
  }, []);
  if (data) {
    if (section.link) {
      data.forEach(registry => {
        if (section.link.startsWith(registry.uri) && processedLink && processedLink.urlRemovedForLink) {
          section.link = processedLink.urlRemovedForLink;
        }
      })
    }
    if (/SO:\s*(\d{7})/.test(section.text)) {
      for (let key in sequenceOntology) {
        if (section.text === key) {
          section.text = sequenceOntology[key].name;
          break;
        }
      }
    }
    if (/SBO:\s*(\d{7})/.test(section.text)) {
      for (let key in systemsBiologyOntology) {
        if (section.text === key) {
          section.text = systemsBiologyOntology[key].name;
          break;
        }
      }
    }
    if (/http:\/\/edamontology\.org\/format_\d{4}/.test(section.text)) {
      for (let key in edamOntology) {
        if (section.text === key) {
          section.text = edamOntology[key];
        }
      }
    }

    if (section.grouped) {
      const items = section.text.split(', ');
      const content = items.map((item, index) => {
        if (section.link && item) {
          return (
            <ColumnLink
              link={loadText(section.link, { This: item })}
              text={`${item}${index === items.length - 1 ||
                (section.linkType !== 'default' && section.linkType !== undefined)
                ? ''
                : ', '
                }`}
              linkType={section.linkType}
              key={index}
            />
          );
        }
        return (
          <span key={index}>
            "{item}"
            {index === items.length - 1 ? '' : ', '}
          </span>
        );
      });
      if (metadata) {
        return <td className={`${styles.preventoverflowmetadata}`}>{content}</td>;
      }
      return <td >{content}</td>;
    }
    return (
      <td>
        {section.id === "Sequence" && section.link == null ? (
          section.text.map((line, index) => (
            <div
              key={index}
              className={metadata ? styles.preventoverflowmetadata : undefined}
              style={{ fontFamily: 'Courier', fontSize: '1.0rem' }}
            >
              {line}
            </div>
          ))
        ) : section.link ? (
          <ColumnLink
            link={section.link}
            text={section.text}
            linkType={section.linkType}
          />
        ) : (
          <div className={metadata ? styles.preventoverflowmetadata : undefined}>
            {section.text}
          </div>
        )}
      </td>
    );

  } else {
    return <td>
      Loading...
    </td>
  }
}

function ColumnLink({ text, link, linkType }) {
  if (!link) {
    return <span>{text}</span>;
  }
  if (linkType === 'search') {
    const searchStart = link.indexOf('=');
    link =
      link.substring(0, searchStart) +
      encodeURIComponent(link.substring(searchStart));
    return (
      <div style={{ display: 'inline-block' }}>
        <span>{text}</span>
        {text && (
          <Link href={link}>
            <a target="_blank">
              <FontAwesomeIcon
                icon={faSearch}
                size="sm"
                className={styles.searchicon}
              />
            </a>
          </Link>
        )}
      </div>
    );
  }
  return (
    <Link href={link}>
      <a target="_blank" className={styles.customlink}>
        <span>{text}</span>
      </a>
    </Link>
  );
}
