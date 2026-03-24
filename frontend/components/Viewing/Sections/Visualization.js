import Section from './Section';
import getConfig from 'next/config';
const { publicRuntimeConfig } = getConfig();
import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { processUrl } from '../../Admin/Registries';
import { useSelector } from 'react-redux';



export default function Visualization(properties) {
    const theme = JSON.parse(localStorage.getItem('theme')) || {};
    const registries = JSON.parse(localStorage.getItem("registries")) || {};
    const iframeRef = useRef(null);
    const [processedUrl, setProcessedUrl] = useState(properties.uri);
    const [content, setContent] = useState('<div>Loading Visualization...</div>');
    const [status, setStatus] = useState(null);
    const [frameHeight, setFrameHeight] = useState(0);
    const token = useSelector(state => state.user.token);

    function navigateParent(href) {
      if (!href) {
        return;
      }

      window.location.assign(href);
    }

    useEffect(() => {
        async function fetchAndProcessUrl() {
          const result = await processUrl(properties.uri, registries);

          const computedUrl = result.urlRemovedForLink
            ? `${publicRuntimeConfig.backend}${result.urlRemovedForLink}/visualization`
            : `${publicRuntimeConfig.backend}${result.original}/visualization`;

          setProcessedUrl(computedUrl);

          const response = await fetchVisualizationContent(computedUrl, token);

          if (response) {
            setContent(response.data);
            setStatus(response.status === 200);
          } else {
            setStatus(false);
          }
        }

        fetchAndProcessUrl();
      }, [properties.uri]);

    useEffect(() => {
      function handleMessage(event) {
        if (event.data?.type === 'visualization:navigate') {
          if (typeof event.data.href === 'string' && event.data.href) {
            navigateParent(event.data.href);
          }
          return;
        }

        if (event.data?.type !== 'visualization:resize') {
          return;
        }

        if (typeof event.data.height === 'number' && event.data.height > 0) {
          setFrameHeight(event.data.height);
        }
      }

      window.addEventListener('message', handleMessage);

      return () => {
        window.removeEventListener('message', handleMessage);
      };
    }, []);

    function handleIframeLoad() {
      const iframe = iframeRef.current;
      if (!iframe || !iframe.contentWindow) {
        return;
      }

      try {
        const currentHref = iframe.contentWindow.location.href;

        if (currentHref && currentHref !== 'about:srcdoc' && currentHref !== 'about:blank') {
          navigateParent(currentHref);
        }
      }
      catch (error) {
        // Ignore cross-origin access here; in-iframe messaging handles those cases.
      }
    }

    if (status) {
      const iframeDocument = buildVisualizationDocument(content, processedUrl, theme.frontendURL);

      return <Section title="Visualization">
        <iframe
          id="Visualization"
          ref={iframeRef}
          title="Visualization"
          onLoad={handleIframeLoad}
          srcDoc={iframeDocument}
          scrolling="no"
          style={{ width: '100%', height: `${Math.max(frameHeight, 1)}px`, border: '0', display: 'block' }}
        />
      </Section>
    }
    else {
      return <Section title="Visualization">
        <div><p>Visualization Loading...</p></div>
      </Section>
    }
}


async function fetchVisualizationContent(url, token) {
    return await axios({
      method: 'GET',
        url: url,
        headers: {
          'X-authorization': token,
        }
    }).then(response => {      return response;
    }).catch(error => {
      console.error("Error fetching visualization content:", error);
      return null;
    });

  }


function buildVisualizationDocument(html, currentUrl, frontendUrl) {
    if (!html || typeof html !== 'string') {
      return '';
    }

    try {
      const parser = new DOMParser();
      const documentNode = parser.parseFromString(html, 'text/html');
      const headHtml = documentNode.head ? documentNode.head.innerHTML.replace(/<base[^>]*>/gi, '') : '';
      const bodyHtml = documentNode.body ? documentNode.body.innerHTML : html;
      const baseTag = currentUrl ? `<base href="${escapeAttribute(currentUrl)}" target="_top">` : '<base target="_top">';

      return `<!DOCTYPE html>
<html>
  <head>
    ${baseTag}
    <script>
      (function() {
        function safeOrigin(url) {
          try {
            return new URL(url).origin;
          }
          catch (error) {
            return '';
          }
        }

        function rewriteToFrontend(url) {
          if (!url) {
            return url;
          }

          var frontendBase = window.__visualizationFrontendUrl || '';
          if (!frontendBase) {
            return url;
          }

          try {
            var frontend = new URL(frontendBase);
            var resolved = new URL(url, frontendBase);
            var backendOrigin = safeOrigin(window.__visualizationBackendUrl);

            if (backendOrigin && resolved.origin === backendOrigin) {
              return frontend.origin + resolved.pathname + resolved.search + resolved.hash;
            }

            if (/^https?:/i.test(url)) {
              return resolved.toString();
            }

            if (url.startsWith('/')) {
              return frontend.origin + url;
            }

            return new URL(url, frontendBase).toString();
          }
          catch (error) {
            return url;
          }
        }

        function navigateTop(url) {
          if (!url) {
            return;
          }

          var rewritten = rewriteToFrontend(url);

          try {
            window.top.location.href = rewritten;
          }
          catch (error) {
            parent.postMessage({ type: 'visualization:navigate', href: rewritten }, '*');
          }
        }

        window.__visualizationNavigateTop = navigateTop;
        window.__visualizationFrontendUrl = ${JSON.stringify(frontendUrl || '')};
        window.__visualizationBackendUrl = ${JSON.stringify(currentUrl || '')};

        function findAncestor(node, predicate) {
          while (node) {
            if (predicate(node)) {
              return node;
            }
            node = node.parentNode;
          }
          return null;
        }

        function stopEvent(event) {
          event.preventDefault();
          event.stopPropagation();
          if (event.stopImmediatePropagation) {
            event.stopImmediatePropagation();
          }
        }

        function handleClick(event) {
          if (event.defaultPrevented || event.button !== 0) {
            return;
          }

          if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
            return;
          }

          var dataUriNode = findAncestor(event.target, function(node) {
            return node && node.getAttribute && node.getAttribute('data-uri');
          });

          if (dataUriNode) {
            stopEvent(event);
            navigateTop(dataUriNode.getAttribute('data-uri'));
            return;
          }

          var hrefNode = findAncestor(event.target, function(node) {
            return node && node.getAttribute && (node.getAttribute('href') || node.getAttribute('xlink:href') || node.getAttribute('data-href'));
          });

          if (!hrefNode) {
            return;
          }

          stopEvent(event);
          var rawHref = hrefNode.getAttribute('href') || hrefNode.getAttribute('xlink:href') || hrefNode.getAttribute('data-href');
          navigateTop(rawHref);
        }

        function handleSubmit(event) {
          var form = event.target;
          if (!form || !form.action) {
            return;
          }

          stopEvent(event);
          navigateTop(form.getAttribute('action') || form.action);
        }

        document.addEventListener('click', handleClick, true);
        document.addEventListener('submit', handleSubmit, true);
      })();
    </script>
    ${headHtml}
  </head>
  <body>
    <div id="visualization-root">${bodyHtml}</div>
    <script>
      (function() {
        function prepareLinks() {
          var anchors = document.querySelectorAll('a[href], [href], [xlink\\:href]');
          for (var index = 0; index < anchors.length; index += 1) {
            if (anchors[index].setAttribute) {
              anchors[index].setAttribute('target', '_top');
            }
          }
        }

        function postHeight() {
          var root = document.getElementById('visualization-root');
          if (!root) {
            return;
          }

          var height = Math.max(
            Math.ceil(root.getBoundingClientRect().height),
            root.scrollHeight || 0,
            root.offsetHeight || 0
          );

          parent.postMessage({ type: 'visualization:resize', height: height + 12 }, '*');
        }

        window.addEventListener('load', postHeight);
        window.addEventListener('load', prepareLinks);
        window.addEventListener('resize', postHeight);

        if (window.ResizeObserver) {
          new ResizeObserver(postHeight).observe(document.getElementById('visualization-root'));
        }

        setTimeout(postHeight, 100);
        setTimeout(postHeight, 500);
        setTimeout(postHeight, 1500);
        setTimeout(prepareLinks, 100);
      })();
    </script>
  </body>
</html>`;
    }
    catch (error) {
      console.error('Error building visualization document:', error);
      return html;
    }
}

function escapeAttribute(value) {
    return `${value}`
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
}