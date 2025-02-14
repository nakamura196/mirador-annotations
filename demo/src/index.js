import mirador from 'mirador/dist/es/src/index';
import annotationPlugins from '../../src';
// import LocalStorageAdapter from '../../src/LocalStorageAdapter';
// import AnnototAdapter from '../../src/AnnototAdapter';

// const endpointUrl = 'http://127.0.0.1:3000/annotations';
import FirestoreAnnotationAdapter from '../../src/FirestoreAnnotationAdapter';
// Firebase初期化
FirestoreAnnotationAdapter.initialize();

// URLからmanifestパラメータを取得
const urlParams = new URLSearchParams(window.location.search);
const manifestUrl = urlParams.get('manifest') || 'https://iiif.harvardartmuseums.org/manifests/object/299843'; // デフォルト値

const config = {
  annotation: {
    adapter: (canvasId) => {
      const manifestId = config.windows[0].loadedManifest;
      return new FirestoreAnnotationAdapter(canvasId, manifestId);
    },
    exportLocalStorageAnnotations: false,
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
