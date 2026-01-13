import React, { Component } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import PropTypes from 'prop-types';

/**
 * Dialog to enforce single view for annotation creation / editing
 */
class SingleCanvasDialog extends Component {
  /** */
  constructor(props) {
    super(props);
    this.confirm = this.confirm.bind(this);
  }

  /** */
  confirm() {
    const {
      handleClose,
      switchToSingleCanvasView,
    } = this.props;
    switchToSingleCanvasView();
    handleClose();
  }

  /** */
  render() {
    const {
      handleClose,
      open,
    } = this.props;
    return (
      <Dialog
        aria-labelledby="single-canvas-dialog-title"
        fullWidth
        maxWidth="sm"
        onClose={handleClose}
        open={open}
      >
        <DialogTitle id="single-canvas-dialog-title">
          Switch view type to single view?
        </DialogTitle>
        <DialogContent>
          <DialogContentText variant="body1" color="inherit">
            Annotations can only be edited in single canvas view type.
            Switch view type to single view now?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>
            Cancel
          </Button>
          <Button color="primary" onClick={this.confirm} variant="contained">
            Switch to single view
          </Button>
        </DialogActions>
      </Dialog>
    );
  }
}

SingleCanvasDialog.propTypes = {
  handleClose: PropTypes.func.isRequired,
  open: PropTypes.bool,
  switchToSingleCanvasView: PropTypes.func.isRequired,
};

SingleCanvasDialog.defaultProps = {
  open: false,
};

export default SingleCanvasDialog;
