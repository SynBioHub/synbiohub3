import { faLightbulb, faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import axios from 'axios';
import { useRouter } from 'next/router';
import { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import useSWR from 'swr';

import { addToBasket } from '../../redux/actions';
import styles from '../../styles/basket.module.css';
import { processUrl } from '../Admin/Registries';
import MiniLoading from '../Reusable/MiniLoading';

const MAX_SUBJECTS = 50;
const MAX_SHOWN = 5;

/**
 * Market basket suggestions for whatever is in the basket: "designs that used these parts also
 * commonly used these other parts". Served by SBOLExplorer through /api/recommend
 */
export default function BasketRecommendations(properties) {
  const { basketItems, selected, theme } = properties;
  const token = useSelector(state => state.user.token);
  const dispatch = useDispatch();
  const router = useRouter();

  const selectedCount = useMemo(
    () => countSelected(basketItems, selected),
    [basketItems, selected]
  );

  const subjects = useMemo(
    () => subjectUris(basketItems, selected),
    [basketItems, selected]
  );

  const { data, error } = useSWR(
    subjects.length > 0
      ? [
          `/api/recommend?subject=${encodeURIComponent(subjects.join(','))}`,
          token
        ]
      : null,
    fetcher
  );

  if (subjects.length === 0) return null;
  // Instances running without SBOLExplorer have nothing to recommend from.
  if (data?.available === false) return null;

  const accent = theme?.themeParameters?.[0]?.value || '#D25627';
  const isLoading = !data && !error;
  const recommendations = shownRecommendations(data, basketItems);

  return (
    <div className={styles.recommendations}>
      <div className={styles.recommendationsheading} style={{ color: accent }}>
        <FontAwesomeIcon icon={faLightbulb} size="1x" />
        <span className={styles.recommendationstitle}>Suggested Parts</span>
      </div>
      <div className={styles.recommendationssubtitle}>
        {subtitle(data, selectedCount, isLoading, error)}
      </div>

      {isLoading && <MiniLoading height={20} width={40} />}

      {recommendations.map(recommendation => (
        <div
          key={recommendation.uri}
          className={styles.recommendation}
          role="button"
          onClick={() => openPart(recommendation.uri, router)}
        >
          <div className={styles.recommendationinfo}>
            <code className={styles.recommendationname}>
              {recommendation.name || recommendation.displayId}
            </code>
            <span className={styles.recommendationdetail}>
              {detail(recommendation)}
            </span>
          </div>
          <div
            className={styles.recommendationadd}
            role="button"
            title="Add to Basket"
            style={{ color: accent }}
            onClick={event => {
              event.stopPropagation();
              addRecommendation(recommendation, dispatch);
            }}
          >
            <FontAwesomeIcon icon={faPlus} size="1x" />
          </div>
        </div>
      ))}
    </div>
  );
}

const fetcher = (url, token) =>
  axios
    .get(url, {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-authorization': token
      }
    })
    .then(response => response.data);

/**
 * The parts the suggestions are based on: the checked rows if there are any, otherwise the whole
 * basket.
 */
const subjectUris = (basketItems, selected) => {
  if (!basketItems) return [];
  const checked = basketItems.filter(item => selected?.get(item.displayId));
  const source = checked.length > 0 ? checked : basketItems;
  return source
    .map(item => item.uri)
    .filter(uri => uri)
    .slice(0, MAX_SUBJECTS);
};

const countSelected = (basketItems, selected) => {
  if (!basketItems) return 0;
  return basketItems.filter(item => selected?.get(item.displayId)).length;
};

/** Drops anything already in the basket, since suggesting it again is not useful. */
const shownRecommendations = (data, basketItems) => {
  const alreadyInBasket = new Set((basketItems || []).map(item => item.uri));
  return (data?.recommendations || [])
    .filter(recommendation => !alreadyInBasket.has(recommendation.uri))
    .slice(0, MAX_SHOWN);
};

const subtitle = (data, selectedCount, isLoading, error) => {
  if (isLoading) return 'Looking for parts commonly used with these...';
  if (error) return 'Suggestions are unavailable right now.';

  const recommendationCount = data?.recommendations?.length || 0;
  if (recommendationCount === 0) {
    return 'No parts are commonly used alongside these yet.';
  }
  const { matchedCartSize, requestedCartSize } = data;
  if (matchedCartSize > 0 && matchedCartSize < requestedCartSize) {
    return `Based on ${matchedCartSize} of your ${requestedCartSize} parts.`;
  }
  if (selectedCount > 0) {
    return `Based on your ${selectedCount} selected part${
      selectedCount === 1 ? '' : 's'
    }.`;
  }
  return 'Based on everything in your basket.';
};

const detail = recommendation => {
  const parts = [];
  if (recommendation.count) {
    parts.push(
      `Used together in ${recommendation.count} design${
        recommendation.count === 1 ? '' : 's'
      }`
    );
  }
  if (recommendation.confidence) {
    parts.push(`${Math.round(recommendation.confidence * 100)}% of the time`);
  }
  return parts.join(' · ');
};

/** Same mapping the search results use, so added rows read the same as the rest of the basket. */
const basketType = type => {
  const potentialType = (type || '').toLowerCase();
  if (potentialType.includes('component')) return 'Component';
  if (potentialType.includes('sequence')) return 'Sequence';
  if (potentialType.includes('module')) return 'Module';
  if (potentialType.includes('collection')) return 'Collection';
  return '';
};

const addRecommendation = async (recommendation, dispatch) => {
  const registries = JSON.parse(localStorage.getItem('registries')) || [];
  const processed = await processUrl(recommendation.uri, registries);
  dispatch(
    addToBasket([
      {
        uri: recommendation.uri,
        url: processed.urlRemovedForLink || processed.original,
        name: recommendation.name || recommendation.displayId,
        displayId: recommendation.displayId,
        version: recommendation.version,
        type: basketType(recommendation.type),
        description: recommendation.description
      }
    ])
  );
};

const openPart = async (uri, router) => {
  const registries = JSON.parse(localStorage.getItem('registries')) || [];
  const processed = await processUrl(uri, registries);
  router.push(
    processed.urlRemovedForLink ||
      processed.urlReplacedForBackend ||
      processed.original
  );
};
