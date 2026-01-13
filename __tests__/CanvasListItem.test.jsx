import React from 'react';
import {
  describe, it, expect, vi, beforeEach,
} from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CanvasListItem from '../src/CanvasListItem';
import AnnotationActionsContext from '../src/AnnotationActionsContext';

/** */
function createMocks() {
  const deleteMock = vi.fn(async () => 'annoPageResultFromDelete');
  const receiveAnnotation = vi.fn();
  const storageAdapter = vi.fn(() => ({
    all: vi.fn().mockResolvedValue({
      items: [{ id: 'anno/2' }],
    }),
    annotationPageId: 'pageId/3',
    delete: deleteMock,
  }));

  return { deleteMock, receiveAnnotation, storageAdapter };
}

/** */
function renderComponent(props = {}, context = {}, mocks = createMocks()) {
  return {
    ...render(
      <AnnotationActionsContext.Provider
        value={{
          addCompanionWindow: vi.fn(),
          annotationsOnCanvases: {},
          canvases: [],
          receiveAnnotation: mocks.receiveAnnotation,
          storageAdapter: mocks.storageAdapter,
          toggleSingleCanvasDialogOpen: vi.fn(),
          windowViewType: 'single',
          ...context,
        }}
      >
        <CanvasListItem
          annotationid="anno/1"
          {...props}
        >
          <div>HelloWorld</div>
        </CanvasListItem>
      </AnnotationActionsContext.Provider>,
    ),
    mocks,
  };
}

describe('CanvasListItem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders its children', () => {
    renderComponent();
    expect(screen.getByText('HelloWorld')).toBeTruthy();
  });

  it('renders as a list item', () => {
    renderComponent();
    expect(document.querySelector('li')).toBeTruthy();
  });

  it('shows edit and delete buttons when hovering over editable annotation', async () => {
    const user = userEvent.setup();

    renderComponent({}, {
      annotationsOnCanvases: {
        'canv/1': {
          'annoPage/1': {
            json: {
              items: [
                { id: 'anno/1' },
              ],
            },
          },
        },
      },
      canvases: [{ id: 'canv/1' }],
    });

    const listItem = document.querySelector('li');

    // Initially no buttons visible
    expect(screen.queryByLabelText('Edit')).toBeNull();
    expect(screen.queryByLabelText('Delete')).toBeNull();

    // Hover over the item
    await user.hover(listItem);

    // Buttons should appear
    await waitFor(() => {
      expect(screen.getByLabelText('Edit')).toBeTruthy();
      expect(screen.getByLabelText('Delete')).toBeTruthy();
    });
  });

  it('does not show buttons when annotation is not editable', async () => {
    const user = userEvent.setup();

    renderComponent({
      annotationid: 'anno/1',
    }, {
      annotationsOnCanvases: {},
      canvases: [{ id: 'canv/1' }],
    });

    const listItem = document.querySelector('li');
    await user.hover(listItem);

    // Buttons should not appear since annotation is not in annotationsOnCanvases
    expect(screen.queryByLabelText('Edit')).toBeNull();
    expect(screen.queryByLabelText('Delete')).toBeNull();
  });

  it('deletes from storage adapter when delete button is clicked', async () => {
    const mocks = createMocks();

    renderComponent(
      { annotationid: 'anno/1' },
      {
        annotationsOnCanvases: {
          'canvas/1': {
            'annoPage/1': {
              json: {
                items: [{ id: 'anno/1' }],
              },
            },
          },
        },
        canvases: [{ id: 'canvas/1' }],
      },
      mocks,
    );

    const listItem = document.querySelector('li');

    // Trigger mouse enter to show buttons
    fireEvent.mouseEnter(listItem);

    // Wait for the buttons to appear after hover
    await waitFor(() => {
      expect(screen.getByLabelText('Delete')).toBeTruthy();
    });

    // Click the delete button
    fireEvent.click(screen.getByLabelText('Delete'));

    // Wait for the async operations to complete
    await waitFor(() => {
      expect(mocks.storageAdapter).toHaveBeenCalled();
    }, { timeout: 2000 });

    await waitFor(() => {
      expect(mocks.deleteMock).toHaveBeenCalledWith('anno/1');
    }, { timeout: 2000 });

    await waitFor(() => {
      expect(mocks.receiveAnnotation).toHaveBeenCalledWith('canvas/1', 'pageId/3', 'annoPageResultFromDelete');
    }, { timeout: 2000 });
  });
});
