import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  Button,
  ClickAwayListener,
  Divider,
  Grid,
  MenuItem,
  MenuList,
  Paper,
  Popover,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import {
  ArrowDropDown as ArrowDropDownIcon,
  BorderColor as StrokeColorIcon,
  ChangeHistory as ClosedPolygonIcon,
  CheckBoxOutlineBlank as RectangleIcon,
  FormatColorFill as FormatColorFillIcon,
  FormatShapes as FormatShapesIcon,
  Gesture as GestureIcon,
  LineWeight as LineWeightIcon,
  RadioButtonUnchecked as CircleIcon,
  ShowChart as OpenPolygonIcon,
  Timeline as PolygonIcon,
} from '@mui/icons-material';
import { SketchPicker } from 'react-color';
import { v4 as uuid } from 'uuid';
import { ConnectedCompanionWindow as CompanionWindow } from 'mirador';
import AnnotationDrawing from './AnnotationDrawing';
import TextEditor from './TextEditor';
import WebAnnotation from './WebAnnotation';
import CursorIcon from './icons/Cursor';

/** */
class AnnotationCreation extends Component {
  /** */
  constructor(props) {
    super(props);
    const annoState = {};
    if (props.annotation) {
      if (Array.isArray(props.annotation.body)) {
        annoState.tags = [];
        props.annotation.body.forEach((body) => {
          if (body.purpose === 'tagging') {
            annoState.tags.push(body.value);
          } else {
            annoState.annoBody = body.value;
          }
        });
      } else {
        annoState.annoBody = props.annotation.body.value;
      }
      if (props.annotation.target.selector) {
        if (Array.isArray(props.annotation.target.selector)) {
          props.annotation.target.selector.forEach((selector) => {
            if (selector.type === 'SvgSelector') {
              annoState.svg = selector.value;
            } else if (selector.type === 'FragmentSelector') {
              annoState.xywh = selector.value.replace('xywh=', '');
            }
          });
        } else {
          annoState.svg = props.annotation.target.selector.value;
        }
      }
    }

    const toolState = {
      activeTool: 'cursor',
      closedMode: 'closed',
      currentColorType: false,
      fillColor: null,
      strokeColor: '#00BFFF',
      strokeWidth: 3,
      ...(props.config.annotation.defaults || {}),
    };

    this.state = {
      ...toolState,
      annoBody: '',
      colorPopoverOpen: false,
      lineWeightPopoverOpen: false,
      popoverAnchorEl: null,
      popoverLineWeightAnchorEl: null,
      svg: null,
      textEditorStateBustingKey: 0,
      xywh: null,
      ...annoState,
    };

    this.submitForm = this.submitForm.bind(this);
    this.updateBody = this.updateBody.bind(this);
    this.updateGeometry = this.updateGeometry.bind(this);
    this.changeTool = this.changeTool.bind(this);
    this.changeClosedMode = this.changeClosedMode.bind(this);
    this.openChooseColor = this.openChooseColor.bind(this);
    this.openChooseLineWeight = this.openChooseLineWeight.bind(this);
    this.handleLineWeightSelect = this.handleLineWeightSelect.bind(this);
    this.handleCloseLineWeight = this.handleCloseLineWeight.bind(this);
    this.closeChooseColor = this.closeChooseColor.bind(this);
    this.updateStrokeColor = this.updateStrokeColor.bind(this);
  }

  /** */
  handleCloseLineWeight(e) {
    this.setState({
      lineWeightPopoverOpen: false,
      popoverLineWeightAnchorEl: null,
    });
  }

  /** */
  handleLineWeightSelect(e) {
    this.setState({
      lineWeightPopoverOpen: false,
      popoverLineWeightAnchorEl: null,
      strokeWidth: e.currentTarget.value,
    });
  }

  /** */
  openChooseColor(e) {
    this.setState({
      colorPopoverOpen: true,
      currentColorType: e.currentTarget.value,
      popoverAnchorEl: e.currentTarget,
    });
  }

  /** */
  openChooseLineWeight(e) {
    this.setState({
      lineWeightPopoverOpen: true,
      popoverLineWeightAnchorEl: e.currentTarget,
    });
  }

  /** */
  closeChooseColor(e) {
    this.setState({
      colorPopoverOpen: false,
      currentColorType: null,
      popoverAnchorEl: null,
    });
  }

  /** */
  updateStrokeColor(color) {
    const { currentColorType } = this.state;
    this.setState({
      [currentColorType]: color.hex,
    });
  }

  /** */
  submitForm(e) {
    e.preventDefault();
    const {
      annotation, canvases, receiveAnnotation, config,
    } = this.props;
    const {
      annoBody, tags, xywh, svg, textEditorStateBustingKey,
    } = this.state;
    canvases.forEach((canvas) => {
      const storageAdapter = config.annotation.adapter(canvas.id);
      const anno = new WebAnnotation({
        body: annoBody,
        canvasId: canvas.id,
        id: (annotation && annotation.id) || `${uuid()}`,
        manifestId: canvas.options.resource.id,
        svg,
        tags,
        xywh,
      }).toJson();
      if (annotation) {
        storageAdapter.update(anno).then((annoPage) => {
          receiveAnnotation(canvas.id, storageAdapter.annotationPageId, annoPage);
        });
      } else {
        storageAdapter.create(anno).then((annoPage) => {
          receiveAnnotation(canvas.id, storageAdapter.annotationPageId, annoPage);
        });
      }
    });

    this.setState({
      annoBody: '',
      svg: null,
      textEditorStateBustingKey: textEditorStateBustingKey + 1,
      xywh: null,
    });
  }

  /** */
  changeTool(e, tool) {
    this.setState({
      activeTool: tool,
    });
  }

  /** */
  changeClosedMode(e) {
    this.setState({
      closedMode: e.currentTarget.value,
    });
  }

  /** */
  updateBody(annoBody) {
    this.setState({ annoBody });
  }

  /** */
  updateGeometry({ svg, xywh }) {
    this.setState({
      svg, xywh,
    });
  }

  /** */
  render() {
    const {
      annotation, closeCompanionWindow, direction, id, position, windowId,
    } = this.props;

    const {
      activeTool, colorPopoverOpen, currentColorType, fillColor, popoverAnchorEl, strokeColor,
      popoverLineWeightAnchorEl, lineWeightPopoverOpen, strokeWidth, closedMode, annoBody, svg,
      textEditorStateBustingKey,
    } = this.state;
    return (
      <CompanionWindow
        title={annotation ? 'Edit annotation' : 'New annotation'}
        windowId={windowId}
        id={id}
        direction={direction}
        position={position}
      >
        <AnnotationDrawing
          activeTool={activeTool}
          fillColor={fillColor}
          strokeColor={strokeColor}
          strokeWidth={strokeWidth}
          closed={closedMode === 'closed'}
          svg={svg}
          updateGeometry={this.updateGeometry}
          windowId={windowId}
        />
        <form onSubmit={this.submitForm} style={{ paddingBottom: 8, paddingLeft: 16, paddingRight: 8, paddingTop: 16 }}>
          <Grid container>
            <Grid size={12}>
              <Typography variant="overline">
                Target
              </Typography>
            </Grid>
            <Grid size={12}>
              <Paper elevation={0} sx={{ display: 'flex', flexWrap: 'wrap' }}>
                <ToggleButtonGroup
                  sx={{ border: 'none', m: 0.5, '& .MuiToggleButtonGroup-grouped': { borderRadius: 1 } }}
                  value={activeTool}
                  exclusive
                  onChange={this.changeTool}
                  aria-label="tool selection"
                  size="small"
                >
                  <ToggleButton value="cursor" aria-label="select cursor">
                    <CursorIcon />
                  </ToggleButton>
                  <ToggleButton value="edit" aria-label="select cursor">
                    <FormatShapesIcon />
                  </ToggleButton>
                </ToggleButtonGroup>
                <Divider flexItem orientation="vertical" sx={{ mx: 0.5, my: 1 }} />
                <ToggleButtonGroup
                  sx={{ border: 'none', m: 0.5, '& .MuiToggleButtonGroup-grouped': { borderRadius: 1 } }}
                  value={activeTool}
                  exclusive
                  onChange={this.changeTool}
                  aria-label="tool selection"
                  size="small"
                >
                  <ToggleButton value="rectangle" aria-label="add a rectangle">
                    <RectangleIcon />
                  </ToggleButton>
                  <ToggleButton value="ellipse" aria-label="add a circle">
                    <CircleIcon />
                  </ToggleButton>
                  <ToggleButton value="polygon" aria-label="add a polygon">
                    <PolygonIcon />
                  </ToggleButton>
                  <ToggleButton value="freehand" aria-label="free hand polygon">
                    <GestureIcon />
                  </ToggleButton>
                </ToggleButtonGroup>
              </Paper>
            </Grid>
          </Grid>
          <Grid container>
            <Grid size={12}>
              <Typography variant="overline">
                Style
              </Typography>
            </Grid>
            <Grid size={12}>
              <ToggleButtonGroup
                aria-label="style selection"
                size="small"
              >
                <ToggleButton
                  value="strokeColor"
                  aria-label="select color"
                  onClick={this.openChooseColor}
                >
                  <StrokeColorIcon style={{ fill: strokeColor }} />
                  <ArrowDropDownIcon />
                </ToggleButton>
                <ToggleButton
                  value="strokeColor"
                  aria-label="select line weight"
                  onClick={this.openChooseLineWeight}
                >
                  <LineWeightIcon />
                  <ArrowDropDownIcon />
                </ToggleButton>
                <ToggleButton
                  value="fillColor"
                  aria-label="select color"
                  onClick={this.openChooseColor}
                >
                  <FormatColorFillIcon style={{ fill: fillColor }} />
                  <ArrowDropDownIcon />
                </ToggleButton>
              </ToggleButtonGroup>

              <Divider flexItem orientation="vertical" sx={{ mx: 0.5, my: 1 }} />
              { /* close / open polygon mode only for freehand drawing mode. */
                activeTool === 'freehand'
                  ? (
                    <ToggleButtonGroup
                      size="small"
                      value={closedMode}
                      onChange={this.changeClosedMode}
                    >
                      <ToggleButton value="closed">
                        <ClosedPolygonIcon />
                      </ToggleButton>
                      <ToggleButton value="open">
                        <OpenPolygonIcon />
                      </ToggleButton>
                    </ToggleButtonGroup>
                  )
                  : null
              }

            </Grid>
          </Grid>
          <Grid container>
            <Grid size={12}>
              <Typography variant="overline">
                Content
              </Typography>
            </Grid>
            <Grid size={12}>
              <TextEditor
                key={textEditorStateBustingKey}
                annoHtml={annoBody}
                updateAnnotationBody={this.updateBody}
              />
            </Grid>
          </Grid>
          <Button onClick={closeCompanionWindow}>
            Cancel
          </Button>
          <Button variant="contained" color="primary" type="submit">
            Save
          </Button>
        </form>
        <Popover
          open={lineWeightPopoverOpen}
          anchorEl={popoverLineWeightAnchorEl}
        >
          <Paper>
            <ClickAwayListener onClickAway={this.handleCloseLineWeight}>
              <MenuList autoFocus role="listbox">
                {[1, 3, 5, 10, 50].map((option, index) => (
                  <MenuItem
                    key={option}
                    onClick={this.handleLineWeightSelect}
                    value={option}
                    selected={option == strokeWidth}
                    role="option"
                    aria-selected={option == strokeWidth}
                  >
                    {option}
                  </MenuItem>
                ))}
              </MenuList>
            </ClickAwayListener>
          </Paper>
        </Popover>
        <Popover
          open={colorPopoverOpen}
          anchorEl={popoverAnchorEl}
          onClose={this.closeChooseColor}
        >
          <SketchPicker
            // eslint-disable-next-line react/destructuring-assignment
            color={this.state[currentColorType] || {}}
            onChangeComplete={this.updateStrokeColor}
          />
        </Popover>
      </CompanionWindow>
    );
  }
}

AnnotationCreation.propTypes = {
  annotation: PropTypes.object, // eslint-disable-line react/forbid-prop-types
  canvases: PropTypes.arrayOf(
    PropTypes.shape({ id: PropTypes.string, index: PropTypes.number }),
  ),
  closeCompanionWindow: PropTypes.func,
  config: PropTypes.shape({
    annotation: PropTypes.shape({
      adapter: PropTypes.func,
      defaults: PropTypes.objectOf(
        PropTypes.oneOfType(
          [PropTypes.bool, PropTypes.func, PropTypes.number, PropTypes.string]
        )
      ),
    }),
  }).isRequired,
  direction: PropTypes.string,
  id: PropTypes.string.isRequired,
  position: PropTypes.string,
  receiveAnnotation: PropTypes.func.isRequired,
  windowId: PropTypes.string.isRequired,
};

AnnotationCreation.defaultProps = {
  annotation: null,
  canvases: [],
  closeCompanionWindow: () => {},
  direction: 'ltr',
  position: 'right',
};

export default AnnotationCreation;
