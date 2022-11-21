import React, { useEffect, useState } from 'react';
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import getComponents from '../../../sparql/getComponents';
import getLocation from "../../../sparql/getLocation";
import genericTableQuery from "../../../sparql/genericTableQuery";
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
  const [rowPredicates, setRowPredicates] = useState([]);
  const [jsonFile, setJsonFile] = useState();
  const [tableIndex, setTableIndex] = useState();

  //Sets the information from virtuoso into a state variable.
  useEffect(() => {
    //Lets the file know what the correct JSON file is.
    if (properties.type === "Collection") setJsonFile(collectionJSON);
    else if (properties.type === "Component") setJsonFile(componentJSON);
    else if (properties.type === "ComponentDefinition") setJsonFile(componentJSON);

    //Gets the information from the correct table and organizes it into a variable.
    if(tableIndex !== undefined && rowPredicates.length === 0) {
      const columns = jsonFile.tables[tableIndex].columns;
      const columnNames = Object.keys(columns);

      for(let i = 0; i < columnNames.length; i++) {
        const columnInfo = columns[columnNames[i]].predicates;
        setRowPredicates(currRows => [...currRows, columnInfo]);
      }
    }

    if(rowPredicates !== undefined) {
      for(let i = 0; i < rowPredicates.length; i++) {
        for(let j = 0; j < rowPredicates[i].length; j++) {
          if(rowPredicates[i][j].length > 1) {
            //there needs to be a nested subquery
          } else {
            //no subquery query immediately w/ pred
            getQueryResponse(genericTableQuery, { uri: properties.uri, id: i+j, subquery: "", predicate: rowPredicates[i][j][0] }).then(res => {
              //console.log(res);
            });
          }
          // for(let k = 0; k < rowPredicates[i][j].length; k++) {
          //   console.log(rowPredicates[i][j][k]);
          //   getQueryResponse(genericTableQuery, { uri: properties.uri, id: i+j+k, subquery: "", predicate: rowPredicates[i][j][k] }).then(res => {
          //     //console.log(res);
          //   });
          // }
          console.log(rowPredicates[i][j])
        }
      }
    }

    //TODO, i have the predicates set to rowPredicates but now i actually need to query them and dispay that queried data.

    //Sets the table index so the file knows which table is being rendered.
    if(jsonFile !== undefined) {
      for(let i = 0; i < jsonFile.tables.length; i++) {
        if(jsonFile.tables[i].title === properties.title) setTableIndex(i);
      }
    }

    if(components === undefined) {
      getQueryResponse(properties.title === "Sequence Annotations" ? getLocation : getComponents, { uri: properties.uri }).then(props => {
        if (props.length > 0) setComponents(props);
      });
    }
  });

  if (!components) return <Loading />;
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
  const header = createHeader(getColumns(jsonFile));

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
