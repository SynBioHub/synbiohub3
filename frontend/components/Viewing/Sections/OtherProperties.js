import React, { useEffect, useState } from 'react';
import { faSearch, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import getOtherProperties from '../../../sparql/getOtherProperties';
import getQueryResponse from '../../../sparql/tools/getQueryResponse';
import Loading from '../../Reusable/Loading';
import Link from 'next/link';

import styles from '../../../styles/view.module.css';
import { useDispatch } from 'react-redux';

export default function OtherProperties(properties) {
  const [otherProps, setOtherProps] = useState();

  const dispatch = useDispatch();

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

  function generateRows() {
    return otherProps.map((obj, key) => {
      return getRow(key, obj.p, obj.o);
    });
  }

  function getRow(key, name, value) {
    const isUri = value.includes('http');
    const valueSearch = isUri
      ? `/search/<${encodeURIComponent(name)}>=<${encodeURIComponent(value)}>&`
      : `/search/<${encodeURIComponent(name)}>='${encodeURIComponent(
          value.replace("'", "\\'")
        )}'&`;
    const parsedValue = value
      .replace(name + '/', '')
      .slice(
        value.slice(0, value.lastIndexOf('/')).lastIndexOf('/') + 1,
        value.length
      );

    return (
      <tr key={key}>
        <td>
          {name.split('/').pop()}
          <Link href={name}>
            <a>
              <FontAwesomeIcon
                icon={faInfoCircle}
                size="1x"
                color="#465875"
                className={styles.searchicon}
              />
            </a>
          </Link>
        </td>
        <td>
          <span>{parsedValue}</span>
          {isUri && (
            <Link href={value}>
              <a>
                <FontAwesomeIcon
                  icon={faInfoCircle}
                  size="1x"
                  color="#465875"
                  className={styles.searchicon}
                />
              </a>
            </Link>
          )}
          <Link href={valueSearch}>
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
