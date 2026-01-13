import Mirador from 'mirador';
import annotationPlugins from '../../src';
import FirestoreAnnotationAdapter from '../../src/FirestoreAnnotationAdapter';

// URL parameter to get manifest
const urlParams = new URLSearchParams(window.location.search);
const manifestUrl = urlParams.get('manifest') || 'https://dl.ndl.go.jp/api/iiif/3437686/manifest.json';

const config = {
  annotation: {
    adapter: (canvasId) => new FirestoreAnnotationAdapter(canvasId, manifestUrl),
    exportLocalStorageAnnotations: true,
  },
  id: 'demo',
  window: {
    defaultSideBarPanel: 'annotations',
    sideBarOpenByDefault: true,
  },
  windows: [{
    manifestId: manifestUrl,
  }],
};

Mirador.viewer(config, [...annotationPlugins]);
