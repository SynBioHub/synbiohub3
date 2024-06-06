import styles from "../../../../styles/view.module.css";
import { faPencilAlt } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";

/**
 * The section for each field in details.
 *
 * @param {Any} properties Information passed in from the parent.
 * @returns The name of the section and the content in it.
 */
export default function Section(properties) {
  const sanitizedText = removeHtmlTags(properties.text);

  return (
    <React.Fragment>
      {properties.owner && (
        <FontAwesomeIcon
          title={`Edit ${properties.title}`}
          icon={faPencilAlt}
          size="1x"
          color="#465875"
          className={styles.editpencilbutton}
          onClick={() => {
            properties.setShowEdit(curr => [...curr, properties.title]);
          }}
        />
      )}
      <h4 className={styles.detailsheader}>{properties.title}</h4>
      <p className={styles.detailstext}>{sanitizedText}</p>
    </React.Fragment>
  );
}

/**
 * Function to remove HTML tags from a string.
 *
 * @param {string} text The input text with potential HTML tags.
 * @returns {string} The text with HTML tags removed.
 */
function removeHtmlTags(text) {
  return text.replace(/<\/?[^>]+(>|$)/g, "");
}
