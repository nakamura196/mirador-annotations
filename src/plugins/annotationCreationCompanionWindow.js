import {
  getCompanionWindow,
  getVisibleCanvases,
  getWorkspace,
  receiveAnnotation,
  removeCompanionWindow,
} from 'mirador';
import AnnotationCreation from '../AnnotationCreation';

/** */
const mapDispatchToProps = (dispatch, { id, windowId }) => ({
  closeCompanionWindow: () => dispatch(
    removeCompanionWindow(windowId, id),
  ),
  receiveAnnotation: (targetId, annoId, annotation) => dispatch(
    receiveAnnotation(targetId, annoId, annotation),
  ),
});

/** */
function mapStateToProps(state, { id: companionWindowId, windowId }) {
  const companionWindow = getCompanionWindow(state, { companionWindowId, windowId });
  const { annotationid, position } = companionWindow || {};
  const canvases = getVisibleCanvases(state, { windowId });
  const { isWorkspaceControlPanelVisible } = getWorkspace(state) || {};

  let annotation;
  canvases.forEach((canvas) => {
    const annotationsOnCanvas = state.annotations[canvas.id];
    Object.values(annotationsOnCanvas || {}).forEach((value, i) => {
      if (value.json && value.json.items) {
        annotation = value.json.items.find((anno) => anno.id === annotationid);
      }
    });
  });

  // Determine direction based on position
  let direction = 'ltr';
  if (position === 'left') {
    direction = isWorkspaceControlPanelVisible ? 'ltr' : 'ltr';
  } else if (position === 'right') {
    direction = 'rtl';
  }

  return {
    annotation,
    canvases,
    config: state.config,
    direction,
    position,
  };
}

export default {
  companionWindowKey: 'annotationCreation',
  component: AnnotationCreation,
  mapDispatchToProps,
  mapStateToProps,
};
