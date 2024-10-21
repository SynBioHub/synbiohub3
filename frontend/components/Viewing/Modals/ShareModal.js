import styles from "../../../styles/view.module.css";
import { faCopy, faExclamationTriangle, faShareAlt } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import React, { useEffect, useState } from "react";
import CustomModal from "./CustomModal";

import { useSelector } from "react-redux";

import Select from "react-select";

import getConfig from "next/config";
import feConfig from "../../../config.json";

import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

/**
 * A modal class that handles the user wanting to share an object.
 * 
 * @param {Any} properties Information passed in from the parent component.
 */
export default function ShareModal(properties) {
  const [copyText, setCopyText] = useState("Copy");
  const [selectedOption, setSelectedOption] = useState("Select user...");
  const [submitted, setSubmitted] = useState(false);
  const [submittable, setSubmittable] = useState(false);
  const token = useSelector(state => state.user.token);

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

  //Checks if the submit button has been clicked and adds to owner and then hides the modal.
  useEffect(() => {
    if (submitted) {
      addOwner(selectedOption.value);
    }
  }, [submitted]);

  /**
   * Posts the new owner.
   * 
   * @param {String} owner The owner to add.
   */
  const addOwner = async (owner) => {
    const url = `${feConfig.backend}${properties.url}/addOwner`;
    var headers = {
      Accept: "text/plain; charset=UTF-8",
      "X-authorization": token
    };

    const parameters = new URLSearchParams();
    parameters.append("user", owner);
    parameters.append("uri", feConfig.backend + properties.url);

    let response;

    try {
      response = await axios.post(url, parameters, { headers });
    } catch (error) {
      if (error.response) {
        console.error('Error:', error.message);
      }
    }

    if (response.status !== 200) errorToast("Something went wrong with adding an owner.");
  }

  /**
   * Copies the link to the users clipboard.
   */
  const copyToClipboard = () => {
    navigator.clipboard.writeText(`${feConfig.backend}${properties.url}`).then(() => {
      setTimeout(() => {
        setCopyText("Copy");
      }, 1000);
      setCopyText("Copied!");
    });
  }

  return (
    <CustomModal
      buttonText={["Cancel", "Grant Ownership"]}
      setModal={properties.setModal}
      setSubmitted={setSubmitted}
      submittable={submittable}
      error={"You must choose an user to grant ownership to."}
      header={
        <React.Fragment>
          <FontAwesomeIcon
            icon={faShareAlt}
            size="1x"
            className={styles.modalicon}
          />
          <h1>Share</h1>
        </React.Fragment>
      }
      content={
        <React.Fragment>
          <div className={styles.modalwarning}>
            <FontAwesomeIcon
              icon={faExclamationTriangle}
              size="1x"
            />
            {" "}Warning: this will give another user complete control over this object.
          </div>
          <div className={styles.ownerselectcontainer}>
            <h5>Select a user to add</h5>
            <Select
              className={styles.ownercustomselect}
              value={selectedOption}
              onChange={(e) => {
                if (e.value !== undefined) {
                  setSelectedOption({ value: e.value, label: e.label });
                  setSubmittable(true);
                }
              }}
              options={selectOptions}
              menuPortalTarget={document.body}
              placeholder={selectedOption}
              styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
            />
          </div>
          <div className={styles.copylinkcontainer}>
            <label
              className={styles.copylinkicon}
            >
              <FontAwesomeIcon
                icon={faCopy}
                size="1x"
              />
            </label>
            <input placeholder={`${feConfig.backend}${properties.url}`} className={styles.copylinktext} type="text" readOnly={true} />
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

//Fill in later once there's an endpoint to get the users.
const selectOptions = [
  { value: "User Value 1", label: "User Information 1" },
  { value: "User Value 2", label: "User Information 2" },
  { value: "User Value 3", label: "User Information 3" },
  { value: "User Value 4", label: "User Information 4" },
  { value: "User Value 5", label: "User Information 5" },
  { value: "User Value 6", label: "User Information 6" },
  { value: "User Value 7", label: "User Information 7" },
  { value: "User Value 8", label: "User Information 8" },
  { value: "User Value 9", label: "User Information 9" },
  { value: "User Value 10", label: "User Information 10" }
];