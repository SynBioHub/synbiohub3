import styles from "../../../styles/view.module.css";
import { faFunnelDollar, prefix } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import React, { useEffect, useState } from "react";

import Select from "react-select";
import CustomModal from "./CustomModal";

import getConfig from 'next/config';
const { publicRuntimeConfig } = getConfig();

import axios from "axios";
import parse from 'html-react-parser';

import { createHTML } from '../../Plugins/html_creator'


export default function CurationModal(properties) {

    const [selectedOption, setSelectedOption] = useState({value: "default", label: "Clear Selection"});
    const [content, setContent] = useState("");
    const pluginsUseLocalCompose = useSelector(state => state.pluginsUseLocalCompose);
    const pluginLocalComposePrefix = useSelector(state => state.pluginLocalComposePrefix);

    const pluginData = {
        complete_sbol: '',
        shallow_sbol: '',
        genbank: '',
        top_level: '',
        instanceUrl: '',
        size: 0,
        type: properties.type,
        submit_link: 'test.com',
        eval_parameters: {}
      };

    useEffect(() => {
        if(selectedOption.value === "default") {
            setContent("<h1>Please Select a Plugin From the Menu Above</h1>");
        }
        else {
            const downloadContent = async () => {
                const toRender = await runPlugin(selectedOption.label, pluginData);
                setContent(toRender);
               };
               downloadContent();
        }
    }, [selectedOption])


    const getSelectOptions = () => {
        const selectOptions = [];

        const pluginData = {
            complete_sbol: '',
            shallow_sbol: '',
            genbank: '',
            top_level: '',
            instanceUrl: '',
            size: 0,
            type: properties.type,
            submit_link: ''
        }

        if(selectedOption.value === "plugin") selectOptions.push({value: "default", label: "Clear Selection"});

        axios({
            method: 'GET',
            url: `${publicRuntimeConfig.backend}/admin/plugins`,
            params: {
                category: 'curation'
            },
            headers: {
                Accept: 'application/json'
              }
        }).then(response => {
            const curatePlugins = response.data.curation;

            for(let plugin of curatePlugins) {
                axios({
                    method: 'POST',
                    url: `${publicRuntimeConfig.backend}/call`,
                    params: {
                        name: plugin.name,
                        endpoint: 'evaluate',
                        data: pluginData,
                        prefix: pluginsUseLocalCompose ? pluginLocalComposePrefix : ''
                    }
                    
                }).then(response => {
                    if(response.status === 200) selectOptions.push({ value: "plugin", label: plugin.name});
                }).catch(error => {return;});
            }
        }).catch(error => {return;});

        return selectOptions;
    }



    return (
        <CustomModal
            buttonText={["Cancel", "Save"]}
            setModal={properties.setModal}
            error={"Choose a plugin"}
            header={
                <React.Fragment>
                <FontAwesomeIcon
                    icon={faFunnelDollar}
                    size="1x"
                    className={styles.modalicon}
                />
                <h1>Curation</h1>
                <Select 
                    className={styles.curationcustomselect}
                    value={selectedOption.value === "plugin" ? selectedOption : "Select Plugin"}
                    onChange={(e) => {
                        if (e.value !== undefined) {
                            setSelectedOption({ value: e.value, label: e.label });
                          }
                    }}
                    options={getSelectOptions()}
                    menuPortalTarget={document.body}
                    styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                    getOptionValue={option => option.label}
                    placeholder={"Select Curation Plugin..."}
                />
                </React.Fragment>
            }
            content={
                <React.Fragment>
                    <div className={styles.curationmodalcontainer}>
                        {parse(`${content}`)}
                    </div>
                </React.Fragment>
            }
        />

    )
}


async function runPlugin(pluginName, pluginData) {
    return await axios({
      method: 'POST',
      url: `${publicRuntimeConfig.backend}/call`,
      params: {
        name: pluginName,
        endpoint: 'run',
        data: pluginData,
        prefix: pluginsUseLocalCompose ? pluginLocalComposePrefix : ''
      }
    }).then(response => {
        if(response.data.own_interface) {
            return response.data.interface;
        }
        else {
            return createHTML(response.data);
        }
    }).catch(error => {
      return `There was an error with ${pluginName}: ${error}`;
    })
  }