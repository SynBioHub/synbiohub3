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

const TAB_LINK = "link";
const TAB_PEOPLE = "people";

/**
 * Share / collaborate modal: copy a shareable link, or add a viewer/owner.
 *
 * @param {Any} properties Information passed in from the parent component.
 */
export default function ShareModal(properties) {
  // When opened from a share-link page the url ends in /<hash>/share; the
  // backend endpoints and uri params expect the plain object url.
  const objectUrl = (properties.url || '').replace(/\/[0-9a-fA-F]{40}\/share$/, '');
  const [activeTab, setActiveTab] = useState(TAB_LINK);
  const [copyText, setCopyText] = useState("Copy");
  const [selectedOption, setSelectedOption] = useState("Select user...");
  const [submitted, setSubmitted] = useState(false);
  const [submittable, setSubmittable] = useState(false);
  const [accessType, setAccessType] = useState("viewer");
  const [shareLink, setShareLink] = useState(`${publicRuntimeConfig.backend}${objectUrl}`);
  const [userList, setUserList] = useState([]);
  const token = useSelector(state => state.user.token);
  const currentUser = useSelector(state => state.user.username);
  const theme = JSON.parse(localStorage.getItem('theme')) || {};

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

  useEffect(() => {
    if (!submitted || activeTab !== TAB_PEOPLE) {
      return;
    }
    if (accessType === "owner") {
      addOwner(theme, selectedOption.value);
    } else {
      addViewer(theme, selectedOption.value);
    }
  }, [submitted]);

  useEffect(() => {
    const fetchShareLink = async () => {
      const url = `${publicRuntimeConfig.backend}${objectUrl}/shareLink`;
      const headers = {
        Accept: "text/plain; charset=UTF-8",
        "X-authorization": token
      };

      try {
        const response = await axios.get(url, { headers });
        if (response.status === 200 && response.data) {
          const originalUrl = response.data;
          const urlObj = new URL(originalUrl);

          const frontendBase = theme.frontendURL || window.location.origin;
          const base = frontendBase.endsWith('/')
            ? frontendBase.slice(0, -1)
            : frontendBase;

          const path = urlObj.pathname.startsWith('/')
            ? urlObj.pathname
            : '/' + urlObj.pathname;

          const newUrl = base + path + urlObj.search + urlObj.hash;

          setShareLink(newUrl);
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
        Accept: "application/json",
        "X-authorization": token
      };

      try {
        const response = await axios.get(url, { headers });
        if (response.status === 200 && response.data && response.data.users) {
          const usernames = response.data.users
            .filter(user => user.username !== currentUser)
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

  const addOwner = async (theme, owner) => {
    const url = `${publicRuntimeConfig.backend}${objectUrl}/addOwner`;
    var headers = {
      Accept: "text/plain; charset=UTF-8",
      "X-authorization": token
    };
    const fullUri = theme.uriPrefix.replace(/\/$/, '') + objectUrl;
    const parameters = new URLSearchParams();
    parameters.append("user", `${theme.uriPrefix}user/${owner}`);
    parameters.append("uri", fullUri);

    try {
      await axios.post(url, parameters, { headers });
      window.location.reload();
    } catch (error) {
      console.error('Error:', error.message);
      const message = typeof error.response?.data === 'string' && error.response.data
        ? error.response.data
        : "Something went wrong with adding an owner.";
      errorToast(message);
    }
  }

  const addViewer = async (theme, viewer) => {
    const url = `${publicRuntimeConfig.backend}${objectUrl}/addViewer`;
    var headers = {
      Accept: "text/plain; charset=UTF-8",
      "X-authorization": token
    };
    const fullUri = theme.uriPrefix.replace(/\/$/, '') + objectUrl;
    const parameters = new URLSearchParams();
    parameters.append("user", `${theme.uriPrefix}user/${viewer}`);
    parameters.append("uri", fullUri);

    try {
      await axios.post(url, parameters, { headers });
      window.location.reload();
    } catch (error) {
      console.error('Error:', error.message);
      const message = typeof error.response?.data === 'string' && error.response.data
        ? error.response.data
        : "Something went wrong with adding a viewer.";
      errorToast(message);
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(`${shareLink}`).then(() => {
      setTimeout(() => {
        setCopyText("Copy");
      }, 1000);
      setCopyText("Copied!");
    });
  }

  const selectTab = (tab) => {
    setActiveTab(tab);
    setSubmitted(false);
    if (tab === TAB_LINK) {
      setSubmittable(false);
    } else if (selectedOption && selectedOption.value) {
      setSubmittable(true);
    }
  };

  const peopleSubmitLabel =
    accessType === "owner" ? "Grant Ownership" : "Grant View Access";

  return (
    <CustomModal
      buttonText={
        activeTab === TAB_LINK
          ? ["Close"]
          : ["Cancel", peopleSubmitLabel]
      }
      setModal={properties.setModal}
      setSubmitted={setSubmitted}
      submittable={submittable}
      error={"You must choose a user to share with."}
      header={
        <React.Fragment>
          <FontAwesomeIcon
            icon={faShareAlt}
            size="1x"
            className={styles.modalicon}
          />
          <h1>Share / Collaborate</h1>
        </React.Fragment>
      }
      content={
        <React.Fragment>
          <div className={styles.shareTabs} role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === TAB_LINK}
              className={
                activeTab === TAB_LINK
                  ? `${styles.shareTab} ${styles.shareTabActive}`
                  : styles.shareTab
              }
              onClick={() => selectTab(TAB_LINK)}
            >
              Get link
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === TAB_PEOPLE}
              className={
                activeTab === TAB_PEOPLE
                  ? `${styles.shareTab} ${styles.shareTabActive}`
                  : styles.shareTab
              }
              onClick={() => selectTab(TAB_PEOPLE)}
            >
              Add people
            </button>
          </div>

          {activeTab === TAB_LINK ? (
            <div className={styles.shareTabPanel} role="tabpanel">
              <p className={styles.shareTabHelp}>
                Copy a shareable link to this object. Anyone with the link can view it.
              </p>
              <div className={styles.copylinkcontainer}>
                <label className={styles.copylinkicon}>
                  <FontAwesomeIcon icon={faCopy} size="1x" />
                </label>
                <input
                  placeholder={`${shareLink}`}
                  className={styles.copylinktext}
                  type="text"
                  readOnly={true}
                  value={shareLink}
                />
                <label
                  className={styles.copylinkbutton}
                  onClick={() => {
                    copyToClipboard();
                  }}
                >
                  {copyText}
                </label>
              </div>
            </div>
          ) : (
            <div className={styles.shareTabPanel} role="tabpanel">
              {accessType === "owner" ? (
                <div className={styles.modalwarning}>
                  <FontAwesomeIcon icon={faExclamationTriangle} size="1x" />
                  {" "}Warning: this will give another user complete control over this object.
                </div>
              ) : (
                <div className={styles.modalwarning}>
                  {" "}The selected user will be able to view this object, but not edit it.
                </div>
              )}
              <div className={styles.ownerselectcontainer}>
                <h5>Access level</h5>
                <label>
                  <input
                    type="radio"
                    name="accessType"
                    value="viewer"
                    checked={accessType === "viewer"}
                    onChange={() => setAccessType("viewer")}
                  />
                  {" "}Viewer (read only)
                </label>
                <label>
                  <input
                    type="radio"
                    name="accessType"
                    value="owner"
                    checked={accessType === "owner"}
                    onChange={() => setAccessType("owner")}
                  />
                  {" "}Owner (full control)
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
            </div>
          )}
        </React.Fragment>
      }
    />
  );
}
