import axios from 'axios';
import { useEffect, useState } from 'react';

import Section from './Sections/Section';

export default function Plugin(properties) {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    if (status == null) {
      evaluatePlugin(properties.plugin.url).then(status => setStatus(status));
    }
  }, [status]);

  return <Section title={properties.plugin.name}>{status ? `${properties.plugin.name} is up and running`: `${properties.plugin.name} is not working`}</Section>;
}

async function evaluatePlugin(url) {
    return await axios({
      method: 'POST',
      url: 'http://localhost:7777/call',
      params: {
        name: plugin.name,
        endpoint: 'status'
      }
    }).then(response => {
      return response.status === 200;
    }).catch(error => {
      return false;
    });
}
