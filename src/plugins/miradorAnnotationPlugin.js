import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  addCompanionWindow,
  getVisibleCanvases,
  getWindowViewType,
  MiradorMenuButton,
  setWindowViewType,
} from 'mirador';
import { AddBox as AddBoxIcon, GetApp as GetAppIcon } from '@mui/icons-material';
import SingleCanvasDialog from '../SingleCanvasDialog';
import AnnotationExportDialog from '../AnnotationExportDialog';
import LocalStorageAdapter from '../LocalStorageAdapter';
import GoogleAuthButton from '../GoogleAuthButton';
import FirestoreAnnotationAdapter from '../FirestoreAnnotationAdapter';

/** */
class MiradorAnnotation extends Component {
  /** */
  constructor(props) {
    super(props);
    this.state = {
      annotationExportDialogOpen: false,
      singleCanvasDialogOpen: false,
    };
    this.openCreateAnnotationCompanionWindow = this.openCreateAnnotationCompanionWindow.bind(this);
    this.toggleCanvasExportDialog = this.toggleCanvasExportDialog.bind(this);
    this.toggleSingleCanvasDialogOpen = this.toggleSingleCanvasDialogOpen.bind(this);
  }

  /** */
  openCreateAnnotationCompanionWindow(e) {
    const {
      addCompanionWindow: addWindow,
    } = this.props;

    addWindow('annotationCreation', {
      position: 'right',
    });
  }

  /** */
  toggleSingleCanvasDialogOpen() {
    const { singleCanvasDialogOpen } = this.state;
    this.setState({
      singleCanvasDialogOpen: !singleCanvasDialogOpen,
    });
  }

  /** */
  toggleCanvasExportDialog(e) {
    const { annotationExportDialogOpen } = this.state;
    const newState = {
      annotationExportDialogOpen: !annotationExportDialogOpen,
    };
    this.setState(newState);
  }

  /** */
  render() {
    const {
      canvases,
      config,
      switchToSingleCanvasView,
      TargetComponent,
      targetProps,
      windowViewType,
    } = this.props;
    const { annotationExportDialogOpen, singleCanvasDialogOpen } = this.state;
    const storageAdapter = config.annotation && config.annotation.adapter('poke');
    const isLocalOrFirestore = storageAdapter instanceof LocalStorageAdapter
      || storageAdapter instanceof FirestoreAnnotationAdapter;
    const offerExportDialog = config.annotation && isLocalOrFirestore
      && config.annotation.exportLocalStorageAnnotations;
    return (
      <div>
        <TargetComponent
          {...targetProps} // eslint-disable-line react/jsx-props-no-spreading
        />
        <GoogleAuthButton
          canvases={canvases}
          config={config}
        />
        <MiradorMenuButton
          aria-label="Create new annotation"
          onClick={windowViewType === 'single' ? this.openCreateAnnotationCompanionWindow : this.toggleSingleCanvasDialogOpen}
          size="small"
        >
          <AddBoxIcon />
        </MiradorMenuButton>

        { singleCanvasDialogOpen && (
          <SingleCanvasDialog
            open={singleCanvasDialogOpen}
            handleClose={this.toggleSingleCanvasDialogOpen}
            switchToSingleCanvasView={switchToSingleCanvasView}
          />
        )}
        { offerExportDialog && (
          <MiradorMenuButton
            aria-label="Export local annotations for visible items"
            onClick={this.toggleCanvasExportDialog}
            size="small"
          >
            <GetAppIcon />
          </MiradorMenuButton>
        )}
        { offerExportDialog && (
          <AnnotationExportDialog
            canvases={canvases}
            config={config}
            handleClose={this.toggleCanvasExportDialog}
            open={annotationExportDialogOpen}
          />
        )}
      </div>
    );
  }
}

MiradorAnnotation.propTypes = {
  addCompanionWindow: PropTypes.func.isRequired,
  canvases: PropTypes.arrayOf(
    PropTypes.shape({ id: PropTypes.string, index: PropTypes.number }),
  ).isRequired,
  config: PropTypes.shape({
    annotation: PropTypes.shape({
      adapter: PropTypes.func,
      exportLocalStorageAnnotations: PropTypes.bool,
    }),
  }).isRequired,
  switchToSingleCanvasView: PropTypes.func.isRequired,
  TargetComponent: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.node,
  ]).isRequired,
  targetProps: PropTypes.object.isRequired, // eslint-disable-line react/forbid-prop-types
  windowViewType: PropTypes.string.isRequired,
};

/** */
const mapDispatchToProps = (dispatch, props) => ({
  addCompanionWindow: (content, additionalProps) => dispatch(
    addCompanionWindow(props.targetProps.windowId, { content, ...additionalProps }),
  ),
  switchToSingleCanvasView: () => dispatch(
    setWindowViewType(props.targetProps.windowId, 'single'),
  ),
});

/** */
const mapStateToProps = (state, { targetProps: { windowId } }) => ({
  canvases: getVisibleCanvases(state, { windowId }),
  config: state.config,
  windowViewType: getWindowViewType(state, { windowId }),
});

const plugin = {
  component: MiradorAnnotation,
  mapDispatchToProps,
  mapStateToProps,
  mode: 'wrap',
  target: 'AnnotationSettings',
};

export default plugin;
