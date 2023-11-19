import styles from "../../../styles/view.module.css";
import { faTrashAlt, faExclamationTriangle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import React, { useState } from "react";
import CustomModal from "./CustomModal";
import { useSelector } from "react-redux";

/**
 * A modal that handles deleting an element.
 * 
 * @param {Any} properties Information passed in from the parent component.
 */
export default function DeleteModal(properties) {
  const [submitted, setSubmitted] = useState(false);
  const [submittable, setSubmittable] = useState(false);
  const token = useSelector(state => state.user.token);

  const handleDelete = () => {
    properties.onDeletionComplete?.(); // Call the callback function
  };

  return (
    <CustomModal
      buttonText={["Cancel", "Delete"]}
      setModal={properties.setModal}
      setSubmitted={setSubmitted}
      submittable={submittable}
      error={"Something went wrong with deleting."}
      header={
        <React.Fragment>
          <FontAwesomeIcon
            icon={faTrashAlt}
            size="1x"
            className={styles.modalicon}
          />
          <h1>Are you sure you want to delete this?</h1>
        </React.Fragment>
      }
      content={
        <React.Fragment>
          <div className={styles.modalwarning}>
            <FontAwesomeIcon
              icon={faExclamationTriangle}
              size="1x"
            />
            {" "}Warning: this will be permanently deleted.
          </div>
        </React.Fragment>
      }
      onConfirm={handleDelete}
    />
  );
}