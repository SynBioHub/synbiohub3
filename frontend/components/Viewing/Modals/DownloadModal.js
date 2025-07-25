import styles from "../../../styles/view.module.css";
import { faCloudDownloadAlt, prefix } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import React, { useEffect, useState } from "react";

import Select from "react-select";
import CustomModal from "./CustomModal";

import getConfig from 'next/config';
const { publicRuntimeConfig } = getConfig();

import { useDispatch } from "react-redux";
import { downloadFiles } from "../../../redux/actions";
import axios from "axios";
import { useSelector } from "react-redux";

/**
 * A modal that lets the user choose what format they want to download the object in.
 * 
 * @param {Any} properties Information passed in from the parent component.
 */
export default function DownloadModal(properties) {
  const [selectedOption, setSelectedOption] = useState();
  const [submitted, setSubmitted] = useState(false);
  const [submittable, setSubmittable] = useState(false);
  const dispatch = useDispatch();
  const theme = JSON.parse(localStorage.getItem('theme')) || {};
  const pluginsUseLocalCompose = useSelector(state => state.pluginsUseLocalCompose);
  const pluginLocalComposePrefix = useSelector(state => state.pluginLocalComposePrefix);

  //Checks if the modal has been submitted and downloads in the format the user chose.
  useEffect(() => {
    if (submitted) {
        download(selectedOption.value, selectedOption.label);
    }
  }, [submitted]);

  /**
   * Downloads in the correct format.
   * 
   * @param {String} type The download endpoint the user has chosen.
   */
  const download = async (type, pluginName) => {
    
    if (type != 'plugin') {
    const item = {
      url: `${publicRuntimeConfig.backend}${properties.url}/${type}`,
      name: properties.name,
      displayId: properties.displayId,
      type: "xml",
      status: "downloading"
    };

    dispatch(downloadFiles([item]));
  }

  else {
    const item = {
      name: properties.name,
      displayId: properties.displayId,
      type: "xml",
      status: "downloading"
    };

    let uri = properties.uri;

    if(!uri.includes('/public/')) {
      const shareLink = await getShareLink(uri.split(theme.uriPrefix).join(''));
      uri = shareLink;
      //Replace backend with uriPrefix
      uri = uri.replace(publicRuntimeConfig.backend, theme.uriPrefix);
    }

    let uriSuffix = uri.split(theme.uriPrefix).join('');
    //Remove first slash if it exists
    if (uriSuffix.startsWith('/')) {
      uriSuffix = uriSuffix.slice(1);
    }

    
    const pluginData = {
      uriSuffix: uriSuffix,
      instanceUrl: `${publicRuntimeConfig.backend}/`,
      size: 1,
      type: properties.type,
      top: properties.uri,
      apiToken: localStorage.getItem('userToken')
    };
    

    dispatch(downloadFiles([item], true, pluginName, pluginData));
  }
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

    if (properties.type === "ComponentDefinition") {
      selectOptions.push({ value: "gb", label: "Download GenBank" });
      selectOptions.push({ value: "gff", label: "Download GFF3" });
    }

    if (properties.type === "Sequence" || properties.type === "ComponentDefinition") selectOptions.push({ value: "fasta", label: "Download FASTA" });
    if (properties.type === "Module" || properties.type === "ComponentDefinition") selectOptions.push({ value: "image", label: "Download Image" });
    if (properties.type === "Attachment") selectOptions.push({ value: "download", label: "Download Attachment" });

    
    axios({
      method: 'GET',
      url: `${publicRuntimeConfig.backend}/admin/plugins`,
      params: {
        category: 'download'
      },
      headers: {
        Accept: 'application/json'
      }
    }).then(response => {
      const downloadPlugins = response.data.download;

      let type;

      switch(properties.type) {
        case 'Component':
          type = 'ComponentInstance'
          break
        case 'Module':
          type = 'ModuleInstance'
          break
        case 'ComponentDefinition':
          type = 'Component'
          break
        case 'ModuleDefinition':
          type = 'Module'
          break
        default:
          type = properties.type
      }

      for(let plugin of downloadPlugins) {

        axios({
          method: 'POST',
          url: `${publicRuntimeConfig.backend}/callPlugin`,
          data: {
            name: plugin.name,
            endpoint: 'status',
            category: 'download',
            prefix: pluginsUseLocalCompose ? pluginLocalComposePrefix : null
          }
        }).then(response => {

          if(response.status === 200) {

            axios({
              method: 'POST',
              url: `${publicRuntimeConfig.backend}/callPlugin`,
              data: {
                name: plugin.name,
                endpoint: 'evaluate',
                category: 'download',
                data: {
                  type: properties.type
                },
                prefix: pluginsUseLocalCompose ? pluginLocalComposePrefix : null
              }
              
            }).then(response => {
              if (response.status === 200) selectOptions.push({ value: "plugin", label: plugin.name});
            }).catch(error => {return;});

          }

          return;

        }).catch(error => {return;})
        
      }
    }).catch(error => {return;});
    

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
              getOptionValue={option => option.label}
            />
          </div>
        </React.Fragment>
      }
    />
  );
}


async function getShareLink(uriSuffix) {
  const token = localStorage.getItem('userToken');
  return await axios({
    method: 'GET',
    url: `${publicRuntimeConfig.backend}/${uriSuffix}/shareLink`,
    user: token, // Assuming the API requires a user token for authentication
    headers: {
      'Accept': 'text/plain',
      'X-authorization': token
    }
  }).then(response => {
    return response.data;
  }
  ).catch(error => {
    return error;
  });
}