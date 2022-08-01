import React, { useEffect, useState } from 'react';
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import getComponents from '../../../sparql/getComponents';
import getLocation from "../../../sparql/getLocation";
import getQueryResponse from '../../../sparql/tools/getQueryResponse';

import Loading from '../../Reusable/Loading';
import Link from 'next/link';

import componentJSON from "./Component.json";
import collectionJSON from "./Collection.json";

import styles from '../../../styles/view.module.css';

/**
 * A generic table that gets information from a JSON file.
 * 
 * @param {Any} properties Information passed in from the parent component.
 */
export default function Components(properties) {
  const [components, setComponents] = useState();

  //Sets the information from virtuoso into a state variable.
  useEffect(() => {
    if (components == undefined) {
      getQueryResponse(properties.title === "Sequence Annotations" ? getLocation : getComponents, { uri: properties.uri }).then(props => {
        if (props.length > 0) setComponents(props);
      });
    }
  }, [components]);

  if (!components) return <Loading />;

  let tableColumns;
  if (properties.type === "Collection") tableColumns = getColumns(collectionJSON);
  else if (properties.type === "Component") tableColumns = getColumns(componentJSON);
  else if (properties.type === "ComponentDefinition") tableColumns = getColumns(componentJSON);

  /**
   * Handles which section the information is needed to be gotten from.
   * 
   * @param {JSON} json The correct JSON.
   * @returns The correctly formatted information for the column.
   */
  function getColumns(json) {
    if (properties.title === "Components") {
      const column = json.tables[0].columns;

      return [
        {
          title: column.access.title,
          link: column.access.link,
          info: column.access.info
        },
        {
          title: column.instance.title,
          link: column.instance.link,
          info: column.instance.info
        },
        {
          title: column.definition.title,
          link: column.definition.link,
          info: column.definition.info
        }
      ];
    }
    else if (properties.title === "Sequence Annotations") {
      const column = json.tables[1].columns;

      return [
        {
          title: column.sequenceAnnotations.title,
          link: column.sequenceAnnotations.link,
          info: column.sequenceAnnotations.info
        },
        {
          title: column.location.title,
          link: column.location.link,
          info: column.location.info
        },
        {
          title: column.componentRoles.title,
          link: column.componentRoles.link,
          info: column.componentRoles.info
        }
      ];
    }
  }

  //Generates the table headers with their corresponding links.
  const header = createHeader(tableColumns);

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
      return (Array.isArray(header.title) ? (
        <th key={header.title[0]}>
          {header.title[0]}
          <Link href={header.link[0]}>
            <a target="_blank" title={header.info[0]}>
              <FontAwesomeIcon
                icon={faInfoCircle}
                size="1x"
                color="#465875"
                className={styles.searchicon}
              />
            </a>
          </Link>
          &nbsp; / {header.title[1]}
          <Link href={header.link[1]}>
            <a target="_blank" title={header.info[1]}>
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
        <th key={header.title}>
          {header.title}
          <Link href={header.link}>
            <a target="_blank" title={header.info}>
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
    return components.map((obj, key) => {
      if(properties.title === "Sequence Annotations") {
        if(obj.start === "") return null;
        const definitionIndex = components.length / 2 + key;
        
        return getRow(
          key,
          { title: obj.title, link: obj.persistentIdentity },
          { title: `${obj.start}, ${obj.end}`, link: obj.location },
          { title: components[definitionIndex].definition, link: components[definitionIndex].def },
        );
      } else if(properties.title === "Components") {
        return getRow(
          key,
          { title: obj.access.replace("http://sbols.org/v2#", ""), link: obj.access },
          { title: obj.title, link: obj.component },
          { title: obj.definition, link: obj.def },
        );
      }
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
                {access.title}
              </span>
            </a>
          </Link>
        </td>
        <td>
          <Link href={title.link}>
            <a target="_blank">
              <span>
                {title.title}
              </span>
            </a>
          </Link>
        </td>
        <td>
          <Link href={definition.link}>
            <a target="_blank">
              <span>
                {definition.title}
              </span>
            </a>
          </Link>
        </td>
      </tr>
    );
  }
}
