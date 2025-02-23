import mirador from 'mirador/dist/es/src/index';
import annotationPlugins from '../../src';
// import LocalStorageAdapter from '../../src/LocalStorageAdapter';
// import AnnototAdapter from '../../src/AnnototAdapter';

// const endpointUrl = 'http://127.0.0.1:3000/annotations';
import FirestoreAnnotationAdapter from '../../src/FirestoreAnnotationAdapter';

// URLからmanifestパラメータを取得
const urlParams = new URLSearchParams(window.location.search);
const manifestUrl = urlParams.get('manifest') || 'https://dl.ndl.go.jp/api/iiif/3437686/manifest.json'; // デフォルト値

const config = {
  annotation: {
    adapter: (canvasId) => {
      const manifestId = config.windows[0].loadedManifest;
      return new FirestoreAnnotationAdapter(canvasId, manifestId);
    },
    exportLocalStorageAnnotations: true,
  },
  id: 'demo',
  window: {
    defaultSideBarPanel: 'annotations',
    sideBarOpenByDefault: true,
  },
  windows: [{
    loadedManifest: manifestUrl,
  }],
};

mirador.viewer(config, [...annotationPlugins]);
