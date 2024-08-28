import styles from "../../../styles/view.module.css";
import { faLink } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import React, { useEffect, useState } from "react";
import CustomModal from "./CustomModal";

import Select from "react-select";

import { getCanSubmitTo } from '../../../redux/actions';
import { useSelector, useDispatch } from "react-redux";

import getConfig from "next/config";
// const { publicRuntimeConfig } = getConfig();
import backendUrl from '../../GetUrl/GetBackend';

import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import axios from "axios";

/**
 * A modal that allows the current collection to be added a private collection.
 * 
 * @param {Any} properties Information passed in from the parent component.
 */
export default function AddToCollectionModal(properties) {
  const [selectedOption, setSelectedOption] = useState("Select collection...");
  const [submitted, setSubmitted] = useState(false);
  const [submittable, setSubmittable] = useState(false);
  const token = useSelector(state => state.user.token);
  const canSubmitTo = useSelector(state => state.submit.canSubmitTo);
  const dispatch = useDispatch();

  //Checks if the canSubmitTo variable is empty and then updates it with the dispatch action.
  useEffect(() => {
    if (canSubmitTo.length === 0) {
      dispatch(getCanSubmitTo());
    }
  }, []);

  //Properties for the error toast.
  const errorToast = (message) => toast.error(message, {
    position: "top-right",
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
    className: styles.modaltoast
  });

  //Properties for the success toast.
  const successToast = (message) => toast.success(message, {
    position: "top-right",
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
    className: styles.modaltoast
  });

  //Checks if the submit button has been clicked and then adds to the chosen collection.
  useEffect(() => {
    if (submitted) {
      addToCollection(selectedOption.value);
    }
  }, [submitted]);

  /**
   * @returns An array that contains all the information regarding the collections the user can submit to.
   */
  const getCollectionOptions = () => {
    const collections = [];
    for (const collection of canSubmitTo) {
      collections.push({ value: collection.uri, label: collection.name });
    }

    return collections;
  }

  /**
   * Adds the current collection to the chosen collection.
   * 
   * @param {String} collection The uri of the collection to add to.
   */
  const addToCollection = async (collection) => {
    const url = `${backendUrl}${properties.url}/addToCollection`;
    var headers = {
      Accept: "text/plain; charset=UTF-8",
      "X-authorization": token
    };

    const parameters = new URLSearchParams();
    parameters.append("collections", collection);

    let response;

    try {
      response = await axios.post(url, parameters, { headers });
    } catch (error) {
      if (error.response) {
        console.error('Error:', error.message);
      }
    }

    if (response.status !== 200) errorToast("Something went wrong with adding to the collection.");
    else successToast("Successfully added to the collection!")
  }

  return (
    <CustomModal
      buttonText={["Cancel", "Add to Collection"]}
      setModal={properties.setModal}
      setSubmitted={setSubmitted}
      submittable={submittable}
      error={"You must choose a collection to add to."}
      header={
        <React.Fragment>
          <FontAwesomeIcon
            icon={faLink}
            size="1x"
            className={styles.modalicon}
          />
          <h1>Add to Collection</h1>
        </React.Fragment>
      }
      content={
        <React.Fragment>
          <div className={styles.addtocollectioncontainer}>
            <h5>Select a collection to add to</h5>
            <Select
              className={styles.addtocollectionselect}
              value={selectedOption}
              onChange={(e) => {
                if (e.value !== undefined) {
                  setSelectedOption({ value: e.value, label: e.label });
                  setSubmittable(true);
                }
              }}
              options={getCollectionOptions()}
              menuPortalTarget={document.body}
              placeholder={selectedOption}
              styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
            />
          </div>
        </React.Fragment>
      }
    />
  );
}
