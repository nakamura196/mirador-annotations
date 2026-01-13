import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Editor, EditorState, RichUtils } from 'draft-js';
import { Box, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { FormatBold as BoldIcon, FormatItalic as ItalicIcon } from '@mui/icons-material';
import { stateToHTML } from 'draft-js-export-html';
import { stateFromHTML } from 'draft-js-import-html';

/** */
class TextEditor extends Component {
  /** */
  constructor(props) {
    super(props);
    this.state = {
      editorState: EditorState.createWithContent(stateFromHTML(props.annoHtml)),
    };
    this.onChange = this.onChange.bind(this);
    this.handleKeyCommand = this.handleKeyCommand.bind(this);
    this.handleFormating = this.handleFormating.bind(this);
    this.handleFocus = this.handleFocus.bind(this);
    this.editorRef = React.createRef();
  }

  /**
   * This is a kinda silly hack (but apparently recommended approach) to
   * making sure the whole visible editor area is clickable, not just the first line.
   */
  handleFocus() {
    if (this.editorRef.current) this.editorRef.current.focus();
  }

  /** */
  handleFormating(e, newFormat) {
    const { editorState } = this.state;
    this.onChange(RichUtils.toggleInlineStyle(editorState, newFormat));
  }

  /** */
  handleKeyCommand(command, editorState) {
    const newState = RichUtils.handleKeyCommand(editorState, command);
    if (newState) {
      this.onChange(newState);
      return 'handled';
    }
    return 'not-handled';
  }

  /** */
  onChange(editorState) {
    const { updateAnnotationBody } = this.props;
    this.setState({ editorState });
    if (updateAnnotationBody) {
      const options = {
        inlineStyles: {
          BOLD: { element: 'b' },
          ITALIC: { element: 'i' },
        },
      };
      updateAnnotationBody(stateToHTML(editorState.getCurrentContent(), options).toString());
    }
  }

  /** */
  render() {
    const { editorState } = this.state;
    const currentStyle = editorState.getCurrentInlineStyle();

    return (
      <div>
        <ToggleButtonGroup
          size="small"
          value={currentStyle.toArray()}
        >
          <ToggleButton
            onClick={this.handleFormating}
            value="BOLD"
          >
            <BoldIcon />
          </ToggleButton>
          <ToggleButton
            onClick={this.handleFormating}
            value="ITALIC"
          >
            <ItalicIcon />
          </ToggleButton>
        </ToggleButtonGroup>

        <Box
          onClick={this.handleFocus}
          sx={{
            border: 1,
            borderColor: (theme) => theme.palette.mode === 'light' ? 'rgba(0, 0, 0, 0.23)' : 'rgba(255, 255, 255, 0.23)',
            borderRadius: 1,
            fontFamily: 'inherit',
            mb: 1,
            minHeight: 96,
            mt: 1,
            p: 1,
          }}
        >
          <Editor
            editorState={editorState}
            handleKeyCommand={this.handleKeyCommand}
            onChange={this.onChange}
            ref={this.editorRef}
          />
        </Box>
      </div>
    );
  }
}

TextEditor.propTypes = {
  annoHtml: PropTypes.string,
  updateAnnotationBody: PropTypes.func,
};

TextEditor.defaultProps = {
  annoHtml: '',
  updateAnnotationBody: () => {},
};

export default TextEditor;
