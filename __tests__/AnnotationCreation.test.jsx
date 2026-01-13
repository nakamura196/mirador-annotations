import React from 'react';
import {
  describe, it, expect, vi,
} from 'vitest';
import { render, screen } from '@testing-library/react';
import AnnotationCreation from '../src/AnnotationCreation';

// Mock mirador's ConnectedCompanionWindow
vi.mock('mirador', () => ({
  ConnectedCompanionWindow: ({ children, title }) => (
    <div data-testid="companion-window" data-title={title}>
      {children}
    </div>
  ),
}));

// Mock AnnotationDrawing since it has complex paper.js dependencies
vi.mock('../src/AnnotationDrawing', () => ({
  default: () => <div data-testid="annotation-drawing" />,
}));

// Mock TextEditor since it has draft-js dependencies
vi.mock('../src/TextEditor', () => ({
  default: ({ updateAnnotationBody }) => (
    <textarea
      data-testid="text-editor"
      onChange={(e) => updateAnnotationBody(e.target.value)}
    />
  ),
}));

// Mock react-color
vi.mock('react-color', () => ({
  SketchPicker: () => <div data-testid="sketch-picker" />,
}));

/** */
function renderComponent(props = {}) {
  return render(
    <AnnotationCreation
      id="x"
      config={{ annotation: {} }}
      receiveAnnotation={vi.fn()}
      windowId="abc"
      {...props}
    />,
  );
}

describe('AnnotationCreation', () => {
  it('renders a form', () => {
    renderComponent();
    expect(document.querySelector('form')).toBeTruthy();
  });

  it('renders the companion window with correct title for new annotation', () => {
    renderComponent();
    const companionWindow = screen.getByTestId('companion-window');
    expect(companionWindow.dataset.title).toBe('New annotation');
  });

  it('renders the companion window with edit title when editing', () => {
    renderComponent({
      annotation: {
        body: { value: 'test' },
        id: 'anno-1',
        target: {},
      },
    });
    const companionWindow = screen.getByTestId('companion-window');
    expect(companionWindow.dataset.title).toBe('Edit annotation');
  });

  it('renders tool selection buttons', () => {
    renderComponent();
    // Note: there are two "select cursor" labels in the component (cursor and edit buttons)
    expect(screen.getAllByLabelText('select cursor').length).toBeGreaterThan(0);
    expect(screen.getByLabelText('add a rectangle')).toBeTruthy();
    expect(screen.getByLabelText('add a circle')).toBeTruthy();
    expect(screen.getByLabelText('add a polygon')).toBeTruthy();
    expect(screen.getByLabelText('free hand polygon')).toBeTruthy();
  });

  it('renders the AnnotationDrawing component', () => {
    renderComponent();
    expect(screen.getByTestId('annotation-drawing')).toBeTruthy();
  });

  it('renders the TextEditor component', () => {
    renderComponent();
    expect(screen.getByTestId('text-editor')).toBeTruthy();
  });

  it('renders Save and Cancel buttons', () => {
    renderComponent();
    expect(screen.getByRole('button', { name: /save/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeTruthy();
  });

  it('can handle annotations without target selector', () => {
    // Should not throw
    renderComponent({
      annotation: {
        body: {
          purpose: 'commenting',
          value: 'Foo bar',
        },
        target: {},
      },
    });
    expect(screen.getByTestId('companion-window')).toBeTruthy();
  });
});
