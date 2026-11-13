import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import getConfig from 'next/config';
import styles from '../../../../styles/view.module.css';

const { publicRuntimeConfig } = getConfig();
const imageTypes = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  bmp: 'image/bmp',
  avif: 'image/avif',
  ico: 'image/x-icon'
};

export default function AttachmentPreview({ uri, name, translation = 0 }) {
  const token = useSelector(state => state.user.token);
  const [preview, setPreview] = useState({ src: '', loading: true, error: '' });
  const extension = (name || '').split('.').pop().toLowerCase();
  const imageType = imageTypes[extension];

  useEffect(() => {
    if (!imageType || !uri) return undefined;

    let active = true;
    let objectUrl;
    const request = axios.CancelToken.source();
    setPreview({ src: '', loading: true, error: '' });

    async function loadPreview() {
      try {
        const path = new URL(uri).pathname.replace(/\/$/, '');
        const response = await axios.get(
          `${publicRuntimeConfig.backend.replace(/\/$/, '')}${path}/download`,
          {
            responseType: 'blob',
            headers: token ? { 'X-authorization': token } : {},
            cancelToken: request.token
          }
        );
        if (!active) return;

        // Downloads use application/octet-stream. Give the image blob its
        // image type, and render it only as an img, never as HTML or an iframe.
        objectUrl = URL.createObjectURL(new Blob([response.data], { type: imageType }));
        setPreview({ src: objectUrl, loading: false, error: '' });
      } catch (error) {
        if (!active || axios.isCancel(error)) return;
        const status = error.response?.status;
        const message = status === 401 || status === 403
          ? 'Sign in with an account that has access to preview this image.'
          : 'Unable to load the image preview. Try downloading the attachment.';
        setPreview({ src: '', loading: false, error: message });
      }
    }

    loadPreview();
    return () => {
      active = false;
      request.cancel();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [uri, token, imageType]);

  if (!imageType) return null;

  return (
    <section
      className={translation === 0 ? styles.sectionexpanded : styles.sectioncollapsed}
      aria-label="Image preview"
    >
      <div className={styles.sectiontitle}>Image preview</div>
      <div className={styles.attachmentPreview}>
        {preview.loading && <p role="status">Loading image…</p>}
        {preview.error && <p role="alert">{preview.error}</p>}
        {preview.src && !preview.error && (
          <img
            src={preview.src}
            alt={name || 'Attachment preview'}
            onError={() => setPreview({
              src: '', loading: false,
              error: 'This file could not be displayed as an image. Try downloading the attachment.'
            })}
          />
        )}
      </div>
    </section>
  );
}
