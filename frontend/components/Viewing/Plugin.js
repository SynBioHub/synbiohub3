import axios from 'axios';
import { useEffect, useState } from 'react';
import parse from 'html-react-parser';

import Section from './Sections/Section';
import getConfig from 'next/config';
const { publicRuntimeConfig } = getConfig();

export default function Plugin(properties) {
  const [status, setStatus] = useState(null);
  const [content, setContent] = useState("");

  return <Section title={properties.plugin.name}>{`${properties.plugin.name}`}</Section>;
}
  
  /*
  const pluginData = {
    complete_sbol: '',
    shallow_sbol: '',
    genbank: '',
    top_level: '',
    instanceUrl: '',
    size: 0,
    type: ''
  };

  useEffect(() => {
    return <Section title={properties.plugin.name}>{`${properties.plugin.name}`}</Section>;

    
    
    if (status == null) {
      evaluatePlugin(properties.plugin, properties.type).then(status => setStatus(status));
    }
    else if (status) {
      const downloadContent = async () => {
       const toRender = await runPlugin(properties.plugin, pluginData);
       setContent(toRender);
      };
      downloadContent();
    }
  }, [status]);

  if (status) {
    return <Section title={properties.plugin.name}>{parse(`${content}`)}</Section>;
  }
  else {
    return <Section title={properties.plugin.name}>{`${properties.plugin.name} is not working`}</Section>; //return null for it not to be loaded
  }
  
}

/*
async function evaluatePlugin(plugin, type) {
    return await axios({
      method: 'POST',
      url: `${publicRuntimeConfig.backend}/call`,
      params: {
        name: plugin.name,
        endpoint: 'status'
      }
    }).then(response => {
      if(response.status != 200) {
        return false;
      }
      return axios({
        method: 'POST',
        url: `${publicRuntimeConfig.backend}/call`,
        params: {
          name: plugin.name,
          endpoint: 'evaluate',
          data: {
            type: type
          }
        }
      }).then(response => {
        return response.status === 200;
      })
    }).catch(error => {
      return false;
    });
}

async function runPlugin(plugin, pluginData) {
  return await axios({
    method: 'POST',
    url: `${publicRuntimeConfig.backend}/call`,
    params: {
      name: plugin.name,
      endpoint: 'run',
      data: pluginData
    }
  }).then(response => {
    return response.data;
  }).catch(error => {
    return `There was an error with ${plugin.name}`;
  })
  
}
*/