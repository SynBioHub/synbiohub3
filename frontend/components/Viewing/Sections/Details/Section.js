import styles from "../../../../styles/view.module.css";
import { faPencilAlt } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";
import parse from "html-react-parser";

/**
 * The section for each field in details.
 *
 * @param {Any} properties Information passed in from the parent.
 * @returns The name of the section and the content in it.
 */
export default function Section(properties) {
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
      <p className={styles.detailstext}>{parse(properties.text)}</p>
    </React.Fragment>
  );
}
