import React, { useEffect, useState } from 'react';
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import getComponents from '../../../sparql/getComponents';
import getQueryResponse from '../../../sparql/tools/getQueryResponse';
import Loading from '../../Reusable/Loading';
import Link from 'next/link';

import styles from '../../../styles/view.module.css';

/**
 * Shows the information about the components.
 * 
 * @param {Any} properties Information passed in from the parent component.
 */
export default function Components(properties) {
  const [components, setComponents] = useState();

  //Sets the information from virtuoso into a state variable.
  useEffect(() => {
    if (components == undefined)
      getQueryResponse(getComponents, { uri: properties.uri }).then(props => {
        if (props.length > 0) setComponents(props);
      });
  }, [components]);

  if (!components) return <Loading />;

  //Generates the table headers with their corresponding links.
  const header = createHeader([
    {
      text: "Access",
      link: "http://sbols.org/v2#access",
      title: "Learn more about access"
    },
    {
      text: "Instance",
      link: "http://sbols.org/v2#Component",
      title: "Learn more about components"
    },
    {
      text: "Definition",
      link: "http://sbols.org/v2#definition",
      title: "Learn more about definitions"
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
      return (
        <th key={header.text}>{header.text}
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
      );
    });
  }

  /**
   * @returns The rows with the corresponding parameters passed in.
   */
  function generateRows() {
    return components.map((obj, key) => {
      return getRow(
        key,
        { text: obj.access.replace("http://sbols.org/v2#", ""), link: obj.access },
        { text: obj.title, link: obj.component },
        { text: obj.definition, link: obj.def },
      );
    });
  }

  /**
   * Generates the rows with the corresponding information.
   * 
   * @param {String} key The unique key.
   * @param {String} access The access variable.
   * @param {String} title The title of the component.
   * @param {String} definition The definition of the component.
   */
  function getRow(key, access, title, definition) {
    return (
      <tr className={styles.componentsinfo} key={key}>
        <td>
          <Link href={access.link}>
            <a target="_blank">
              <span>
                {access.text}
              </span>
            </a>
          </Link>
        </td>
        <td>
          <Link href={title.link}>
            <a target="_blank">
              <span>
                {title.text}
              </span>
            </a>
          </Link>
        </td>
        <td>
          <Link href={definition.link}>
            <a target="_blank">
              <span>
                {definition.text}
              </span>
            </a>
          </Link>
        </td>
      </tr>
    );
  }
}
