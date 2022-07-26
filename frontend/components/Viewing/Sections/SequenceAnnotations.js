import React, { useEffect, useState } from 'react';
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import getLocation from '../../../sparql/getLocation';
import getQueryResponse from '../../../sparql/tools/getQueryResponse';
import Loading from '../../Reusable/Loading';
import Link from 'next/link';

import styles from '../../../styles/view.module.css';

/**
 * Shows the information about the sequence annotations.
 * 
 * @param {Any} properties Information passed in from the parent component.
 */
export default function SequenceAnnotations(properties) {
  const [annotations, setAnnotations] = useState();

  //Sets the information from virtuoso into a state variable.
  useEffect(() => {
    console.log(annotations)
    if (annotations == undefined)
      getQueryResponse(getLocation, { uri: properties.uri }).then(props => {
        if (props.length > 0) setAnnotations(props);
      });
  }, [annotations]);

  if (!annotations) return <Loading />;

  //Generates the table headers with their corresponding links.
  const header = createHeader([
    {
      text: "Sequence Annotation",
      link: "http://sbols.org/v2#SequenceAnnotation",
      title: "Learn more about Sequence Annotations"
    },
    {
      text: "Location",
      link: "http://sbols.org/v2#Location",
      title: "Learn more about Locations"
    },
    {
      text: ["Component", "Role(s)"],
      link: ["http://sbols.org/v2#component", "http://sbols.org/v2#role"],
      title: ["Learn more about components", "Learn more about roles"]
    }
  ]);

  return (
    <div>
      <table className={styles.table}>
        <thead>
          <tr>{header}</tr>
        </thead>
        <tbody>
          {generateRows()}
        </tbody>
      </table>
    </div>
  );

  /**
   * @param {Array} headers An array of strings that are the headers that are to be generated.
   * @returns Table headers with the specified headers.
   */
  function createHeader(headers) {
    return headers.map(header => {
      return (Array.isArray(header.text) ? (
        <th key={header.text[0]}>
          {header.text[0]}
          <Link href={header.link[0]}>
            <a target="_blank" title={header.title[0]}>
              <FontAwesomeIcon
                icon={faInfoCircle}
                size="1x"
                color="#465875"
                className={styles.searchicon}
              />
            </a>
          </Link>
          &nbsp; / {header.text[1]}
          <Link href={header.link[1]}>
            <a target="_blank" title={header.title[1]}>
              <FontAwesomeIcon
                icon={faInfoCircle}
                size="1x"
                color="#465875"
                className={styles.searchicon}
              />
            </a>
          </Link>
        </th>
      ) : (
        <th key={header.text}>
          {header.text}
          <Link href={header.link}>
            <a target="_blank" title={header.title}>
              <FontAwesomeIcon
                icon={faInfoCircle}
                size="1x"
                color="#465875"
                className={styles.searchicon}
              />
            </a>
          </Link>
        </th>
      )
      );
    });
  }

  /**
   * @returns The rows with the corresponding parameters passed in.
   */
  function generateRows() {
    return annotations.map((obj, key) => {
      if(obj.start === "") return null;
      const definitionIndex = annotations.length / 2 + key;
      
      return getRow(
        key,
        { text: obj.title, link: obj.persistentIdentity },
        { text: `${obj.start}, ${obj.end}`, link: obj.location },
        { text: annotations[definitionIndex].definition, link: annotations[definitionIndex].def },
      );
    });
  }

  /**
   * Generates the rows with the corresponding information.
   * 
   * @param {String} key The unique key.
   * @param {String} sequence The sequence.
   * @param {String} location The location of the object.
   * @param {String} componentRoles The component/roles of the object.
   */
  function getRow(key, sequence, location, componentRoles) {
    return (
      <tr className={styles.componentsinfo} key={key}>
        <td>
        <Link href={sequence.link}>
            <a target="_blank">
              <span>
                {sequence.text}
              </span>
            </a>
          </Link>
        </td>
        <td>
          <Link href={location.link}>
            <a target="_blank">
              <span>
                {location.text}
              </span>
            </a>
          </Link>
        </td>
        <td>
          <Link href={componentRoles.link}>
            <a target="_blank">
              <span>
                {componentRoles.text}
              </span>
            </a>
          </Link>
        </td>
      </tr>
    );
  }
}
