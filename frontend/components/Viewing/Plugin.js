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

  return <Section title={properties.plugin.name}>{status}</Section>;
}

async function evaluatePlugin(url) {
  try {
    return await axios.get(`${url}status`);
  } catch (error) {
    return <div>{error.toString()}</div>;
  }
}
