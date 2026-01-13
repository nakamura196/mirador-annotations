import React, { useState, useContext, forwardRef } from 'react';
import PropTypes from 'prop-types';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';
import { DeleteForever as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import flatten from 'lodash/flatten';
import AnnotationActionsContext from './AnnotationActionsContext';

/** */
const CanvasListItem = forwardRef(({
  annotationid, children, ...otherProps
}, ref) => {
  const [isHovering, setIsHovering] = useState(false);
  const context = useContext(AnnotationActionsContext);
  const {
    addCompanionWindow,
    annotationsOnCanvases,
    canvases,
    receiveAnnotation,
    storageAdapter,
    toggleSingleCanvasDialogOpen,
    windowViewType,
  } = context;

  /** */
  const handleDelete = () => {
    canvases.forEach((canvas) => {
      const adapter = storageAdapter(canvas.id);
      adapter.delete(annotationid).then((annoPage) => {
        receiveAnnotation(canvas.id, adapter.annotationPageId, annoPage);
      });
    });
  };

  /** */
  const handleEdit = () => {
    addCompanionWindow('annotationCreation', {
      annotationid,
      position: 'right',
    });
  };

  /** */
  const handleMouseEnter = () => setIsHovering(true);
  const handleMouseLeave = () => setIsHovering(false);

  /** */
  const editable = () => {
    const annoIds = canvases.map((canvas) => {
      if (annotationsOnCanvases[canvas.id]) {
        return flatten(Object.entries(annotationsOnCanvases[canvas.id]).map(([key, value]) => {
          if (value.json && value.json.items) {
            return value.json.items.map((item) => item.id);
          }
          return [];
        }));
      }
      return [];
    });
    return flatten(annoIds).includes(annotationid);
  };

  return (
    <li
      ref={ref}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...otherProps}
    >
      {isHovering && editable() && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            zIndex: 10000,
          }}
        >
          <ToggleButtonGroup
            aria-label="annotation tools"
            size="small"
          >
            <ToggleButton
              aria-label="Edit"
              onClick={windowViewType === 'single' ? handleEdit : toggleSingleCanvasDialogOpen}
              value="edit"
            >
              <EditIcon />
            </ToggleButton>
            <ToggleButton aria-label="Delete" onClick={handleDelete} value="delete">
              <DeleteIcon />
            </ToggleButton>
          </ToggleButtonGroup>
        </div>
      )}
      {children}
    </li>
  );
});

CanvasListItem.propTypes = {
  annotationid: PropTypes.string.isRequired,
  children: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.node,
  ]).isRequired,
};

CanvasListItem.displayName = 'CanvasListItem';

export default CanvasListItem;
