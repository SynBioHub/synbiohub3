import React, { useEffect, useState } from 'react';
import { faSearch } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import getOtherProperties from '../../../sparql/getMemberOfCollections';
import getQueryResponse from '../../../sparql/tools/getQueryResponse';
import Loading from '../../Reusable/Loading';
import Link from 'next/link';

import styles from '../../../styles/view.module.css';
import { useDispatch } from 'react-redux';
import { useSelector } from 'react-redux';
import { processUrl } from '../../Admin/Registries';

/**
 * @param {Any} properties Information passed down from parent component.
 * @returns The collections that this component is a member of.
 */
export default function MemberOfCollections(properties) {
  const [otherProps, setOtherProps] = useState();
  const dispatch = useDispatch();
  const token = useSelector(state => state.user.token);
  const registries = JSON.parse(localStorage.getItem("registries")) || {};

  useEffect(() => {
    if (otherProps == undefined)
      getQueryResponse(dispatch, getOtherProperties, {
        uri: properties.uri
      }).then(props => {
          if (props.length > 0) setOtherProps(props);
        });
  }, [otherProps]);
  if (!otherProps) return <Loading />;

  return (
    <div>
      <table className={styles.table}>
        <tbody>{generateRows()}</tbody>
      </table>
    </div>
  );

  /**
   * Maps the query information and gets x number of rows.
   *
   * @returns All the returned collection info mapped into rows.
   */
  function generateRows() {
    return otherProps.map((collection, key) => (
      <Row key={key} collection={collection} token={token} dispatch={dispatch} />
    ));
  }

  /**
   * @param {Number} key The unique key.
   * @param {Object} collection The collection information.
   * @returns A row with the populated collection information.
   */
  function Row({ collection, token, dispatch }) {
    const [urlRemovedForLink, setUrlRemovedForLink] = useState(null);

    useEffect(() => {
      async function fetchProcessedUrl() {
        const result = await processUrl(collection.subject, registries);
        setUrlRemovedForLink(result.urlRemovedForLink);
      }

      fetchProcessedUrl();
    }, [collection.subject, token, dispatch]);

    const displayText = collection.title || (function () {
      const parts = collection.subject.split('/');
      return parts[parts.length - 2] || '';
    })();


    return (
      <tr>
        <td>
          <span className={styles.link}>
            {urlRemovedForLink ? (
              <Link href={urlRemovedForLink}>{displayText}</Link>
            ) : (
              <span>{displayText}</span>
            )}
          </span>
          <Link
            href={`/search/collection=<${encodeURIComponent(
              collection.subject
            )}>&`}
          >
            <a>
              <FontAwesomeIcon
                icon={faSearch}
                size="1x"
                color="#465875"
                className={styles.searchicon}
              />
            </a>
          </Link>
        </td>
      </tr>
    );
  }

}
