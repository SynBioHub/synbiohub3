import styles from "../../../styles/view.module.css";
import { faCopy, faExclamationTriangle, faShareAlt } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import React, { useEffect, useState } from "react";
import CustomModal from "./CustomModal";

import { useSelector } from "react-redux";

import Select from "react-select";

import getConfig from 'next/config';
const { publicRuntimeConfig } = getConfig();

import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";

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
  const [shareLink, setShareLink] = useState(`${publicRuntimeConfig.backend}${properties.url}`);
  const [userList, setUserList] = useState([]);
  const token = useSelector(state => state.user.token);
  const currentUser = useSelector(state => state.user.username);
  const theme = JSON.parse(localStorage.getItem('theme')) || {};

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
      addOwner(theme, selectedOption.value);
    }
  }, [submitted]);


  useEffect(() => {
    const fetchShareLink = async () => {
      const url = `${publicRuntimeConfig.backend}${properties.url}/shareLink`;
      const headers = {
        Accept: "text/plain; charset=UTF-8",
        "X-authorization": token
      };

      try {
        const response = await axios.get(url, { headers });
        if (response.status === 200 && response.data) {
          setShareLink(response.data);
        }
      } catch (error) {
        console.error("Error fetching share link:", error.message);
      }
    };

    fetchShareLink();

  }, [properties.url, token]);

  useEffect(() => {
    const fetchUserList = async () => {
      const url = `${publicRuntimeConfig.backend}/admin/users`;
      const headers = {
        Accept: "text/plain; charset=UTF-8",
        "X-authorization": token
      };

      console.log(url);

      try {
        const response = await axios.get(url, { headers });
        if (response.status === 200 && response.data && response.data.users) {
          console.log(response.data);
          // Extract only the usernames
          const usernames = response.data.users
          .filter(user => user.username !== currentUser)  // Exclude current user
          .map(user => ({
            value: user.username,
            label: user.username
          }));

          setUserList(usernames);
        }
      } catch (error) {
        console.error("Error fetching user list:", error.message);
      }
    };

    fetchUserList();
  }, [properties.url, token]);

  console.log(localStorage);

  /**
   * Posts the new owner.
   * 
   * @param {String} owner The owner to add.
   */
  const addOwner = async (theme, owner) => {
    const url = `${publicRuntimeConfig.backend}${properties.url}/addOwner`;
    var headers = {
      Accept: "text/plain; charset=UTF-8",
      "X-authorization": token
    };
    const fullUri = theme.uriPrefix.replace(/\/$/, '') + properties.url;
    const parameters = new URLSearchParams();
    parameters.append("user", `${theme.uriPrefix}user/${owner}`);
    parameters.append("uri", fullUri);

    let response;

    try {
      response = await axios.post(url, parameters, { headers });
    } catch (error) {
      if (error.response) {
        console.error('Error:', error.message);
      }
    }

    if (response && response.status !== 200) errorToast("Something went wrong with adding an owner.");
  }

  /**
   * Copies the link to the users clipboard.
   */
  const copyToClipboard = () => {
    navigator.clipboard.writeText(`${shareLink}`).then(() => {
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
      error={"You must choose a user to grant ownership to."}
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
          <div className={styles.copylinkcontainer}>
            <label
              className={styles.copylinkicon}
            >
              <FontAwesomeIcon
                icon={faCopy}
                size="1x"
              />
            </label>
            <input placeholder={`${shareLink}`} className={styles.copylinktext} type="text" readOnly={true} />
            <label
              className={styles.copylinkbutton}
              onClick={() => {
                copyToClipboard();
              }}
            >
              {copyText}
            </label>
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
              options={userList}
              menuPortalTarget={document.body}
              placeholder={selectedOption}
              isSearchable={true}
              styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
            />
          </div>
        </React.Fragment>
      }
    />
  );
}