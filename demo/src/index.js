
import mirador from 'mirador/dist/es/src/index';
import annotationPlugins from '../../src';
import LocalStorageAdapter from '../../src/LocalStorageAdapter';
import AnnototAdapter from '../../src/AnnototAdapter';

var params = new URL(document.location).searchParams;
var manifest = params.get('iiif-content') || params.get('manifest') || 'https://iiif.harvardartmuseums.org/manifests/object/299843'
var windows = [];
if (manifest) {
  windows.push({ manifestId: manifest });
}
/*
var miradorInstance = Mirador.viewer({
  id: 'mirador',
  windows: windows,
});
*/

const endpointUrl = 'http://127.0.0.1:3000/annotations';
const config = {
  annotation: {
    adapter: (canvasId) => new LocalStorageAdapter(`localStorage://?canvasId=${canvasId}`),
    // adapter: (canvasId) => new AnnototAdapter(canvasId, endpointUrl),
    exportLocalStorageAnnotations: false, // display annotation JSON export button
  },
  id: 'demo',
  window: {
    defaultSideBarPanel: 'annotations',
    sideBarOpenByDefault: true,
  },
  windows /*: [{
    loadedManifest: 'https://iiif.harvardartmuseums.org/manifests/object/299843',
  }]*/,
};

mirador.viewer(config, [...annotationPlugins]);
