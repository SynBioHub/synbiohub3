import Section from './Section';
import getConfig from 'next/config';
const { publicRuntimeConfig } = getConfig();
import { useEffect, useState } from 'react';
import axios from 'axios';
import { processUrl } from '../../Admin/Registries';
import parse, { domToReact } from 'html-react-parser';



export default function Visualization(properties) {
    const theme = JSON.parse(localStorage.getItem('theme')) || {};
    const registries = JSON.parse(localStorage.getItem("registries")) || {};
    const [processedUrl, setProcessedUrl] = useState({ original: properties.uri });
    const [content, setContent] = useState('<div>Loading Visualization...</div>');
    const [status, setStatus] = useState(null);

    useEffect(() => {
        async function fetchAndProcessUrl() {
          const result = await processUrl(properties.uri, registries);
          if(result.urlRemovedForLink) {
            setProcessedUrl(`${publicRuntimeConfig.backend}${result.urlRemovedForLink}/visualization`)
          }
          else {
            setProcessedUrl(`${publicRuntimeConfig.backend}${result.original}/visualization`)
          }
          console.log(processedUrl)
          setContent(`<div>${processedUrl}</div>`);
          setStatus(200);
        }
    
        fetchAndProcessUrl();
      }, [properties.uri]);


    if (status === 200) {
        return <Section title="Visualization">
            <div>{parse(`${content}`, options)}</div>
        </Section>
    }
    else {
        return <Section title="Visualization">
            <div><p>Visualization Loading...</p></div>
        </Section>
    }
}


/* async function fetchVisualizationContent(url, token) {
    return await axios({
      method: 'GET',
        url: `${publicRuntimeConfig.backend}/ */


const acceptedTags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'a', 'img', 'ul', 'ol', 'li', 'table', 'tr', 'td', 'th', 'thead', 'tbody', 'tfoot', 'caption', 'div', 'span', 'br', 'hr', 'pre', 'code', 'blockquote', 'strong', 'em', 'i', 'b', 'u', 's', 'sub', 'sup', 'del', 'ins', 'mark', 'small', 'big', 'abbr', 'cite', 'dfn', 'kbd', 'q', 'samp', 'var', 'time', 'address', 'article', 'aside', 'footer', 'header', 'nav', 'section', 'main', 'figure', 'figcaption', 'details', 'summary', 'dialog', 'menu', 'menuitem', 'menuitem', 'meter', 'progress', 'output', 'canvas', 'audio', 'video', 'iframe', 'object', 'embed', 'param', 'source', 'track', 'map', 'area', 'form', 'label', 'input', 'button', 'select', 'datalist', 'optgroup', 'option', 'textarea', 'fieldset', 'legend', 'datalist', 'output', 'progress', 'meter', 'details', 'summary', 'command', 'menu', 'menuitem', 'menuitem', 'script', 'noscript', 'style', 'link', 'meta', 'title', 'base', 'head', 'body', 'html', 'br', 'hr', 'wbr', 'img', 'area', 'map', 'track', 'source', 'param', 'iframe', 'embed', 'object', 'canvas', 'script', 'noscript', 'style', 'link', 'meta', 'title', 'base', 'head', 'body', 'html', 'br', 'hr', 'wbr', 'img', 'area', 'map', 'track', 'source', 'param', 'iframe', 'embed', 'object', 'canvas', 'script', 'noscript', 'style', 'link', 'meta', 'title', 'base', 'head', 'body', 'html', 'br', 'hr', 'wbr', 'img', 'area', ]


const options = {
      replace: domNode => {
        if(!domNode.attribs) {
          return;
        }

        if(domNode.name === '!doctype html') {
          return <></>;
        }

        if(!acceptedTags.includes(domNode.name)) {
          return (
            <>{domToReact(domNode.children, options)}</>
          );
        }

        if(domNode.name === 'html' || domNode.name === 'head' || domNode.name === 'body') {
          return (
            <>{domToReact(domNode.children, options)}</>
          );
        }

        if(domNode.type === 'script') {
          var script = document.createElement('script');
          if(domNode.attribs.src) {
            script.src = domNode.attribs.src;
          }
          script.type = 'text/javascript';
          script.innerText = `${domToReact(domNode.children, options)}`;
          document.getElementById(`${properties.plugin.name}`).appendChild(script);
          return <></>;
        }

      }
    }