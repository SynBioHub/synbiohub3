import styles from "../../../styles/view.module.css";
import { faCloudDownloadAlt } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import React, { useEffect, useState } from "react";

import Select from "react-select";
import CustomModal from "./CustomModal";

import getConfig from "next/config";
const { publicRuntimeConfig } = getConfig();

import { useDispatch } from "react-redux";
import { downloadFiles } from "../../../redux/actions";

/**
 * A modal that lets the user choose what format they want to download the object in.
 * 
 * @param {Any} properties Information passed in from the parent component.
 */
export default function ShareModal(properties) {
  const [selectedOption, setSelectedOption] = useState();
  const [submitted, setSubmitted] = useState(false);
  const [submittable, setSubmittable] = useState(false);
  const dispatch = useDispatch();

  //Checks if the modal has been submitted and downloads in the format the user chose.
  useEffect(() => {
    if (submitted) {
      download(selectedOption.value);
    }
  }, [submitted]);

  /**
   * Downloads in the correct format.
   * 
   * @param {String} type The download endpoint the user has chosen.
   */
  const download = (type) => {
    const item = {
      url: `${publicRuntimeConfig.backend}${properties.url}/${type}`,
      name: properties.name,
      displayId: properties.displayId,
      type: "xml",
      status: "downloading"
    };

    dispatch(downloadFiles([item]));
  }

  /**
   * Depending on the type of the page the download options will change.
   * 
   * @returns An array that has all the select options for the user to decide to download.
   */
  const getSelectOptions = () => {
    const selectOptions = [
      { value: "sbol", label: "Download SBOL" },
      { value: "omex", label: "Download COMBINE Archive" }
    ];

    if (properties.type === "Component") {
      selectOptions.push({ value: "gb", label: "Download GenBank" });
      selectOptions.push({ value: "gff", label: "Download GFF3" });
    }

    if (properties.type === "Sequence") selectOptions.push({ value: "fasta", label: "Download FASTA" });
    if (properties.type === "Module") selectOptions.push({ value: "image", label: "Download Image" });
    if (properties.type === "Attachment") selectOptions.push({ value: "download", label: "Download Attachment" });

    return selectOptions;
  }

  return (
    <CustomModal
      buttonText={["Cancel", "Download"]}
      setModal={properties.setModal}
      setSubmitted={setSubmitted}
      submittable={submittable}
      error={"Choose a file format."}
      header={
        <React.Fragment>
          <FontAwesomeIcon
            icon={faCloudDownloadAlt}
            size="1x"
            className={styles.modalicon}
          />
          <h1>Download</h1>
        </React.Fragment>
      }
      content={
        <React.Fragment>
          <div className={styles.downloadmodalcontainer}>
            <h5>Select a file format to download</h5>
            <Select
              className={styles.ownercustomselect}
              value={selectedOption}
              onChange={(e) => {
                if (e.value !== undefined) {
                  setSelectedOption({ value: e.value, label: e.label });
                  setSubmittable(true);
                }
              }}
              options={getSelectOptions()}
              menuPortalTarget={document.body}
              styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
            />
          </div>
        </React.Fragment>
      }
    />
  );
}