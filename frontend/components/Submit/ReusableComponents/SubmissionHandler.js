import styles from '../../../styles/submit.module.css'
import Select from "react-select";
import axios from 'axios';
import getConfig from "next/config";
const { publicRuntimeConfig } = getConfig();

export default function SubmissionHandler(properties) {

    const getSelectOptions = () => {
        let selectOptions;
        if(properties.selectedHandler.value === 'default') {
           selectOptions = [];
        }
        else {
           selectOptions = [{value: 'default', label: 'Default Handler'}];
        }
    
        axios({
          method: 'GET',
          url: `${publicRuntimeConfig.backend}/admin/plugins`,
          params: {
            category: 'submit'
          },
          headers: {
            Accept: 'application/json'
          }
        }).then(response => {
          const submitPlugins = response.data.submit;
    
          for(let plugin of submitPlugins) {
            axios({
              method: 'POST',
              url: `${publicRuntimeConfig.backend}/call`,
              params: {
                name: plugin.name,
                endpoint: 'status',
                category: 'submit'
              }
            }).then(response => {
              if(response.status === 200) selectOptions.push({value: plugin.index, label: plugin.name});
              pluginsAvailable = true;
            }).catch(error => {return;});
          }
    
        }).catch(error => {return;});
    
        if(properties.configureOption) {
            selectOptions.push({value: 'configure', label: 'Advanced (configure on next step)'});
        }

        if(properties.failed) {
          selectOptions.push({value: 'null', label: 'Do Not Reupload'});
        }
    
        return selectOptions;
      }
    
    return (
        <Select 
            className={styles.ownerselectcontainer}
            value={properties.selectedHandler}
            onChange={(e) => {
                  properties.setSelectedHandler(e);
            }}
            options={getSelectOptions()}
            isMulti={false}
            menuPortalTarget={document.body}
            styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
            getOptionValue={option => option.label}
            placeholder='Submit Plugin Handler...'
          />
    )
}