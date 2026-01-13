import React from 'react';
import {
  describe, it, expect, vi,
} from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import LocalStorageAdapter from '../src/LocalStorageAdapter';
import miradorAnnotationPlugin from '../src/plugins/miradorAnnotationPlugin';

const MiradorAnnotation = miradorAnnotationPlugin.component;

// Mock mirador
vi.mock('mirador', () => ({
  MiradorMenuButton: ({ children, 'aria-label': ariaLabel, onClick }) => (
    <button type="button" aria-label={ariaLabel} onClick={onClick}>
      {children}
    </button>
  ),
  addCompanionWindow: vi.fn(),
  getVisibleCanvases: vi.fn(() => []),
  getWindowViewType: vi.fn(() => 'single'),
  setWindowViewType: vi.fn(),
}));

// Mock SingleCanvasDialog
vi.mock('../src/SingleCanvasDialog', () => ({
  default: ({ open }) => (open ? <div data-testid="single-canvas-dialog">SingleCanvasDialog</div> : null),
}));

// Mock AnnotationExportDialog
vi.mock('../src/AnnotationExportDialog', () => ({
  default: ({ open }) => (open ? <div data-testid="annotation-export-dialog">AnnotationExportDialog</div> : null),
}));

// Mock GoogleAuthButton
vi.mock('../src/GoogleAuthButton', () => ({
  default: () => <div data-testid="google-auth-button">GoogleAuthButton</div>,
}));

/** */
function renderComponent(props = {}) {
  return render(
    <MiradorAnnotation
      canvases={[]}
      config={{}}
      TargetComponent={() => <div data-testid="target-component">Target</div>}
      targetProps={{}}
      addCompanionWindow={vi.fn()}
      switchToSingleCanvasView={vi.fn()}
      windowViewType="single"
      {...props}
    />,
  );
}

describe('MiradorAnnotation', () => {
  it('renders a create new annotation button', () => {
    renderComponent();
    expect(screen.getByLabelText('Create new annotation')).toBeTruthy();
  });

  it('renders the TargetComponent', () => {
    renderComponent();
    expect(screen.getByTestId('target-component')).toBeTruthy();
  });

  it('renders GoogleAuthButton', () => {
    renderComponent();
    expect(screen.getByTestId('google-auth-button')).toBeTruthy();
  });

  it('calls addCompanionWindow when button is clicked in single view', () => {
    const mockAddCompanionWindow = vi.fn();
    renderComponent({
      addCompanionWindow: mockAddCompanionWindow,
      windowViewType: 'single',
    });

    fireEvent.click(screen.getByLabelText('Create new annotation'));
    expect(mockAddCompanionWindow).toHaveBeenCalledWith(
      'annotationCreation',
      { position: 'right' },
    );
  });

  it('opens single canvas dialog if not in single view', () => {
    renderComponent({
      windowViewType: 'book',
    });

    // Dialog should not be visible initially
    expect(screen.queryByTestId('single-canvas-dialog')).toBeNull();

    // Click the button
    fireEvent.click(screen.getByLabelText('Create new annotation'));

    // Dialog should appear
    expect(screen.getByTestId('single-canvas-dialog')).toBeTruthy();
  });

  it('does not render export button if export or LocalStorageAdapter are not configured', () => {
    // No config
    renderComponent();
    expect(screen.queryByLabelText('Export local annotations for visible items')).toBeNull();

    // With adapter but not LocalStorageAdapter
    renderComponent({
      config: {
        annotation: {
          adapter: () => ({}),
          exportLocalStorageAnnotations: true,
        },
      },
    });
    expect(screen.queryByLabelText('Export local annotations for visible items')).toBeNull();

    // With LocalStorageAdapter but no export flag
    renderComponent({
      config: {
        annotation: {
          adapter: (canvasId) => new LocalStorageAdapter(`test://?canvasId=${canvasId}`),
        },
      },
    });
    expect(screen.queryByLabelText('Export local annotations for visible items')).toBeNull();
  });

  it('renders export button if export and LocalStorageAdapter are configured', () => {
    renderComponent({
      config: {
        annotation: {
          adapter: (canvasId) => new LocalStorageAdapter(`test://?canvasId=${canvasId}`),
          exportLocalStorageAnnotations: true,
        },
      },
    });
    expect(screen.getByLabelText('Export local annotations for visible items')).toBeTruthy();
  });
});
