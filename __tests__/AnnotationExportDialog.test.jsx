import React from 'react';
import {
  describe, it, expect, vi, beforeEach,
} from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import AnnotationExportDialog from '../src/AnnotationExportDialog';

// Mock URL.createObjectURL
window.URL.createObjectURL = vi.fn(() => 'downloadurl');

const createMockAdapter = () => vi.fn(() => ({
  all: vi.fn().mockResolvedValue({
    id: 'pageId/3',
    items: [
      { id: 'anno/2' },
    ],
    type: 'AnnotationPage',
  }),
  annotationPageId: 'pageId/3',
}));

/** */
function renderComponent(props = {}) {
  const defaultAdapter = createMockAdapter();
  return render(
    <AnnotationExportDialog
      canvases={[]}
      config={{ annotation: { adapter: defaultAdapter } }}
      handleClose={vi.fn()}
      open
      {...props}
    />,
  );
}

describe('AnnotationExportDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders dialog with title', () => {
    renderComponent();
    expect(screen.getByText('Export Annotations')).toBeTruthy();
  });

  it('shows no annotations message when there are no canvases', () => {
    renderComponent({ canvases: [] });
    expect(screen.getByText('No annotations stored yet.')).toBeTruthy();
  });

  it('renders download links for annotation pages', async () => {
    const adapter = createMockAdapter();
    const { rerender } = render(
      <AnnotationExportDialog
        canvases={[
          { id: 'canvas/1' },
          { id: 'canvas/2' },
        ]}
        config={{ annotation: { adapter } }}
        handleClose={vi.fn()}
        open={false}
      />,
    );

    // Now rerender with open=true to trigger componentDidUpdate
    rerender(
      <AnnotationExportDialog
        canvases={[
          { id: 'canvas/1' },
          { id: 'canvas/2' },
        ]}
        config={{ annotation: { adapter } }}
        handleClose={vi.fn()}
        open
      />,
    );

    // Wait for async state update
    await waitFor(() => {
      expect(screen.queryByText('No annotations stored yet.')).toBeNull();
    });

    // Check that export links are rendered (using canvas.id as label since no __jsonld)
    expect(screen.getByLabelText('Export annotations for canvas/1')).toBeTruthy();
    expect(screen.getByLabelText('Export annotations for canvas/2')).toBeTruthy();
  });

  it('uses canvas label from __jsonld when available', async () => {
    const adapter = createMockAdapter();
    const { rerender } = render(
      <AnnotationExportDialog
        canvases={[
          { __jsonld: { label: 'My Canvas' }, id: 'canvas/1' },
        ]}
        config={{ annotation: { adapter } }}
        handleClose={vi.fn()}
        open={false}
      />,
    );

    rerender(
      <AnnotationExportDialog
        canvases={[
          { __jsonld: { label: 'My Canvas' }, id: 'canvas/1' },
        ]}
        config={{ annotation: { adapter } }}
        handleClose={vi.fn()}
        open
      />,
    );

    await waitFor(() => {
      expect(screen.getByLabelText('Export annotations for My Canvas')).toBeTruthy();
    });
  });
});
