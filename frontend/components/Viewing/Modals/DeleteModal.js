import styles from "../../../styles/view.module.css";
import { faTrashAlt, faExclamationTriangle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import React, { useState, useEffect } from "react";
import CustomModal from "./CustomModal";
import { useSelector } from "react-redux";

import axios from "axios";

import { toast } from "react-toastify";

import getConfig from 'next/config';
const { publicRuntimeConfig } = getConfig();
import { useRouter } from 'next/router';

/**
 * A modal that handles deleting an element.
 * 
 * @param {Any} properties Information passed in from the parent component.
 */
export default function DeleteModal(properties) {
  const [submitted, setSubmitted] = useState(false);
  const [submittable, setSubmittable] = useState(true);
  const token = useSelector(state => state.user.token);
  const router = useRouter();

  const warningToast = (message) => toast.warn(message, {
      position: "top-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      className: styles.modaltoast
    });

  useEffect(() => {
    if(submitted) {
      const deleteElement = async () => {
        const url = `${publicRuntimeConfig.backend}${properties.url}/removeCollection`;
        try {
          const result = await axios.get(url, {
            headers: {
              'X-authorization': token
            }
          });
          if (result.status === 200) {
            router.push('/submissions');
          }
        } catch (error) {
          console.error("Error deleting item:", error);
          warningToast("Error Deleting Item");
          setSubmitted(false);
        }
      }
      deleteElement();
    }
  }, [submitted])

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
    />
  );
}