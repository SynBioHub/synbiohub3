import styles from "../../styles/view.module.css";
import { faShareSquare, faCopy } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import React, { useState } from "react";
import CustomModal from "./CustomModal";

import getConfig from 'next/config';
const { publicRuntimeConfig } = getConfig();

/**
 * A custom modal class that has error message handling.
 * 
 * @param {Any} properties Information passed in from the parent component.
 */
export default function ShareModal(properties) {
  const [copyText, setCopyText] = useState("Copy");
  
  /**
   * Copies the link to the users clipboard.
   */
  const copyToClipboard = () => {
    navigator.clipboard.writeText(`${publicRuntimeConfig.backend}${properties.url}`).then(() => {
      setTimeout(() => {
        setCopyText("Copy");
      }, 1000);
      setCopyText("Copied!");
    });
  }

  return (
    <CustomModal
      buttonText={["Cancel", null]}
      setModal={properties.setModal}
      error={null}
      header={
        <React.Fragment>
          <FontAwesomeIcon
            icon={faShareSquare}
            size="1x"
            className={styles.idcardicon}
          />
          <h1>Share</h1>
        </React.Fragment>
      }
      content={
        <React.Fragment>
          <div className={styles.copylinkcontainer}>
            <label
              className={styles.copylinkicon}
            >
              <FontAwesomeIcon
                icon={faCopy}
                size="1x"
              />
            </label>
            <input placeholder={`${publicRuntimeConfig.backend}${properties.url}`} className={styles.copylinktext} type="text" readOnly={true} />
            <label
              className={styles.copylinkbutton}
              onClick={() => {
                copyToClipboard();
              }}
            >
              {copyText}
            </label>
          </div>
        </React.Fragment>
      }
    />
  );
}