import axios from 'axios';
import { useEffect, useState } from 'react';

import Section from './Sections/Section';

export default function Plugin(properties) {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    if (status == null) {
      evaluatePlugin(properties.plugin, properties.type).then(status => setStatus(status));
    }
  }, [status]);

  if (status) {
    const pluginData = {
      complete_sbol: '',
      shallow_sbol: '',
      genbank: '',
      top_level: '',
      instanceUrl: '',
      size: 0,
      type: properties.type
    };

    const toRender = runPlugin(properties.plugin, pluginData);

    return <Section title={properties.plugin.name}>{`${properties.plugin.name} is up and running`}</Section>;
  }
  else {
    return <Section title={properties.plugin.name}>{`${properties.plugin.name} is not working`}</Section>; //return null for it not to be loaded
  }
}

async function evaluatePlugin(plugin, type) {
    return await axios({
      method: 'POST',
      url: 'http://localhost:7777/call',
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
        url: 'http://localhost:7777/call',
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
    url: 'http://localhost:7777/call',
    params: {
      name: plugin.name,
      endpoint: 'run',
      data: pluginData
    }
  }).then(response => {
    return `${plugin.name} is up and running`;
  }).catch(error => {
    return `There was an error with ${plugin.name}`;
  })
}
