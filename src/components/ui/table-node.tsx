'use client';

import * as React from 'react';

import { DndPlugin, useDraggable, useDropLine } from '@platejs/dnd';
import {
  BlockSelectionPlugin,
  useBlockSelected,
} from '@platejs/selection/react';
import { resizeLengthClampStatic } from '@platejs/resizable';
import {
  getTableColumnCount,
  setCellBackground,
  setTableColSize,
  setTableMarginLeft,
  setTableRowSize,
} from '@platejs/table';
import {
  TablePlugin,
  TableProvider,
  roundCellSizeToStep,
  useCellIndices,
  useOverrideColSize,
  useOverrideMarginLeft,
  useOverrideRowSize,
  useTableCellBorders,
  useTableBordersDropdownMenuContentState,
  useTableColSizes,
  useTableElement,
  useTableMergeState,
  useTableSelectionDom,
  useTableValue,
} from '@platejs/table/react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  CombineIcon,
  EraserIcon,
  Grid2X2Icon,
  GripVertical,
  PaintBucketIcon,
  SquareSplitHorizontalIcon,
  Trash2Icon,
  XIcon,
} from 'lucide-react';
import {
  type TElement,
  type TTableCellElement,
  type TTableElement,
  type TTableRowElement,
  KEYS,
  PathApi,
} from 'platejs';
import {
  type PlateElementProps,
  PlateElement,
  useComposedRef,
  useEditorPlugin,
  useEditorRef,
  useEditorSelector,
  useElement,
  useFocusedLast,
  usePluginOption,
  useReadOnly,
  useRemoveNodeButton,
  useSelected,
  withHOC,
} from 'platejs/react';
import { useElementSelector } from 'platejs/react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from '@/components/ui/popover';
import { usePlateI18n } from '@/i18n/provider';
import { cn } from '@/lib/utils';

import { blockSelectionVariants } from './block-selection';
import {
  ColorDropdownMenuItems,
  DEFAULT_COLORS,
} from './font-color-toolbar-button';
import {
  BorderAllIcon,
  BorderBottomIcon,
  BorderLeftIcon,
  BorderNoneIcon,
  BorderRightIcon,
  BorderTopIcon,
} from './table-icons';
import { TableEditorExpandable } from './table-editor-expandable';
import { TableExpandedContext } from './table-expanded-context';
import { TableFullscreenEditor } from './table-fullscreen-editor';
import { TablePreviewFrame } from './table-preview-frame';
import {
  Toolbar,
  ToolbarButton,
  ToolbarGroup,
  ToolbarMenuGroup,
} from './toolbar';

type TableResizeDirection = 'bottom' | 'left' | 'right';

type TableResizeStartOptions = {
  colIndex: number;
  direction: TableResizeDirection;
  handleKey: string;
  rowIndex: number;
};

type TableResizeDragState = {
  colIndex: number;
  direction: TableResizeDirection;
  initialPosition: number;
  initialSize: number;
  marginLeft: number;
  rowIndex: number;
};

type TableResizeContextValue = {
  disableMarginLeft: boolean;
  clearResizePreview: (handleKey: string) => void;
  setResizePreview: (
    event: React.PointerEvent<HTMLDivElement>,
    options: TableResizeStartOptions
  ) => void;
  startResize: (
    event: React.PointerEvent<HTMLDivElement>,
    options: TableResizeStartOptions
  ) => void;
};

const TABLE_CONTROL_COLUMN_WIDTH = 8;
const TABLE_DEFAULT_COLUMN_WIDTH = 120;
const TABLE_DEFERRED_COLUMN_RESIZE_CELL_COUNT = 1200;
const TABLE_MULTI_SELECTION_TOOLBAR_DELAY_MS = 150;

const TableResizeContext = React.createContext<TableResizeContextValue | null>(
  null
);

function useTableResizeContext() {
  const context = React.useContext(TableResizeContext);

  if (!context) {
    throw new Error('TableResizeContext is missing');
  }

  return context;
}

function useTableResizeController({
  deferColumnResize,
  dragIndicatorRef,
  hoverIndicatorRef,
  marginLeft,
  controlColumnWidth,
  tablePath,
  tableRef,
  wrapperRef,
}: {
  deferColumnResize: boolean;
  dragIndicatorRef: React.RefObject<HTMLDivElement | null>;
  hoverIndicatorRef: React.RefObject<HTMLDivElement | null>;
  marginLeft: number;
  controlColumnWidth: number;
  tablePath: number[];
  tableRef: React.RefObject<HTMLTableElement | null>;
  wrapperRef: React.RefObject<HTMLDivElement | null>;
}) {
  const { editor, getOptions } = useEditorPlugin(TablePlugin);
  const { disableMarginLeft = false, minColumnWidth = 0 } = getOptions();
  const colSizes = useTableColSizes({
    disableOverrides: true,
  });
  const effectiveColSizes = React.useMemo(
    () => colSizes.map((colSize) => colSize || TABLE_DEFAULT_COLUMN_WIDTH),
    [colSizes]
  );
  const effectiveColSizesRef = React.useRef(effectiveColSizes);
  const activeHandleKeyRef = React.useRef<string | null>(null);
  const activeRowElementRef = React.useRef<HTMLTableRowElement | null>(null);
  const cleanupListenersRef = React.useRef<(() => void) | null>(null);
  const marginLeftRef = React.useRef(marginLeft);
  const dragStateRef = React.useRef<TableResizeDragState | null>(null);
  const frozenRowIndicesRef = React.useRef<number[] | null>(null);
  const previewHandleKeyRef = React.useRef<string | null>(null);
  const overrideColSize = useOverrideColSize();
  const overrideMarginLeft = useOverrideMarginLeft();
  const overrideRowSize = useOverrideRowSize();

  React.useEffect(() => {
    effectiveColSizesRef.current = effectiveColSizes;
  }, [effectiveColSizes]);

  React.useEffect(() => {
    marginLeftRef.current = marginLeft;
  }, [marginLeft]);

  const hideDeferredResizeIndicator = React.useCallback(() => {
    const indicator = dragIndicatorRef.current;

    if (!indicator) return;

    indicator.style.display = 'none';
    indicator.style.removeProperty('left');
  }, [dragIndicatorRef]);

  const showDeferredResizeIndicator = React.useCallback(
    (offset: number) => {
      const indicator = dragIndicatorRef.current;

      if (!indicator) return;

      indicator.style.display = 'block';
      indicator.style.left = `${offset}px`;
    },
    [dragIndicatorRef]
  );

  const hideResizeIndicator = React.useCallback(() => {
    const indicator = hoverIndicatorRef.current;

    if (!indicator) return;

    indicator.style.display = 'none';
    indicator.style.removeProperty('left');
  }, [hoverIndicatorRef]);

  const clearFrozenRowHeights = React.useCallback(() => {
    const frozenRowIndices = frozenRowIndicesRef.current;

    if (!frozenRowIndices) return;

    frozenRowIndicesRef.current = null;

    frozenRowIndices.forEach((rowIndex) => {
      overrideRowSize(rowIndex, null);
    });
  }, [overrideRowSize]);

  const freezeRowHeights = React.useCallback(() => {
    const table = tableRef.current;

    if (!table || deferColumnResize) return;

    clearFrozenRowHeights();

    const frozenRowIndices: number[] = [];

    Array.from(table.rows).forEach((row, rowIndex) => {
      const height = row.getBoundingClientRect().height;

      if (!height) return;

      overrideRowSize(rowIndex, height);
      frozenRowIndices.push(rowIndex);
    });

    frozenRowIndicesRef.current = frozenRowIndices;
  }, [clearFrozenRowHeights, deferColumnResize, overrideRowSize, tableRef]);

  const showResizeIndicatorAtOffset = React.useCallback(
    (offset: number) => {
      const indicator = hoverIndicatorRef.current;

      if (!indicator) return;

      indicator.style.display = 'block';
      indicator.style.left = `${offset}px`;
    },
    [hoverIndicatorRef]
  );

  const showResizeIndicator = React.useCallback(
    ({
      event,
      direction,
    }: Pick<TableResizeStartOptions, 'direction'> & {
      event: React.PointerEvent<HTMLDivElement>;
    }) => {
      if (direction === 'bottom') return;

      const wrapper = wrapperRef.current;

      if (!wrapper) return;

      const handleRect = event.currentTarget.getBoundingClientRect();
      const wrapperRect = wrapper.getBoundingClientRect();
      const boundaryOffset =
        handleRect.left - wrapperRect.left + handleRect.width / 2;

      showResizeIndicatorAtOffset(boundaryOffset);
    },
    [showResizeIndicatorAtOffset, wrapperRef]
  );

  const setResizePreview = React.useCallback(
    (
      event: React.PointerEvent<HTMLDivElement>,
      options: TableResizeStartOptions
    ) => {
      if (activeHandleKeyRef.current) return;

      previewHandleKeyRef.current = options.handleKey;
      showResizeIndicator({ ...options, event });
    },
    [showResizeIndicator]
  );

  const clearResizePreview = React.useCallback(
    (handleKey: string) => {
      if (activeHandleKeyRef.current) return;
      if (previewHandleKeyRef.current !== handleKey) return;

      previewHandleKeyRef.current = null;
      hideResizeIndicator();
    },
    [hideResizeIndicator]
  );

  const commitColSize = React.useCallback(
    (colIndex: number, width: number) => {
      setTableColSize(editor, { colIndex, width }, { at: tablePath });
      setTimeout(() => overrideColSize(colIndex, null), 0);
    },
    [editor, overrideColSize, tablePath]
  );

  const commitRowSize = React.useCallback(
    (rowIndex: number, height: number) => {
      setTableRowSize(editor, { height, rowIndex }, { at: tablePath });
      setTimeout(() => overrideRowSize(rowIndex, null), 0);
    },
    [editor, overrideRowSize, tablePath]
  );

  const commitMarginLeft = React.useCallback(
    (nextMarginLeft: number) => {
      setTableMarginLeft(
        editor,
        { marginLeft: nextMarginLeft },
        { at: tablePath }
      );
      setTimeout(() => overrideMarginLeft(null), 0);
    },
    [editor, overrideMarginLeft, tablePath]
  );

  const getColumnBoundaryOffset = React.useCallback(
    (colIndex: number, currentWidth: number) =>
      controlColumnWidth +
      effectiveColSizesRef.current
        .slice(0, colIndex)
        .reduce((total, colSize) => total + colSize, 0) +
      currentWidth,
    [controlColumnWidth]
  );

  const applyResize = React.useCallback(
    (event: PointerEvent, finished: boolean) => {
      const dragState = dragStateRef.current;

      if (!dragState) return;

      const currentPosition =
        dragState.direction === 'bottom' ? event.clientY : event.clientX;
      const delta = currentPosition - dragState.initialPosition;

      if (dragState.direction === 'bottom') {
        const newHeight = roundCellSizeToStep(
          dragState.initialSize + delta,
          undefined
        );

        if (finished) {
          commitRowSize(dragState.rowIndex, newHeight);
        } else {
          overrideRowSize(dragState.rowIndex, newHeight);
        }

        return;
      }

      if (dragState.direction === 'left') {
        const initial =
          effectiveColSizesRef.current[dragState.colIndex] ??
          dragState.initialSize;
        const complement = (width: number) =>
          initial + dragState.marginLeft - width;
        const nextMarginLeft = roundCellSizeToStep(
          resizeLengthClampStatic(dragState.marginLeft + delta, {
            max: complement(minColumnWidth),
            min: 0,
          }),
          undefined
        );
        const nextWidth = complement(nextMarginLeft);

        if (finished) {
          commitMarginLeft(nextMarginLeft);
          commitColSize(dragState.colIndex, nextWidth);
        } else if (deferColumnResize) {
          showDeferredResizeIndicator(
            controlColumnWidth + (nextMarginLeft - dragState.marginLeft)
          );
        } else {
          showResizeIndicatorAtOffset(
            controlColumnWidth + (nextMarginLeft - dragState.marginLeft)
          );
          overrideMarginLeft(nextMarginLeft);
          overrideColSize(dragState.colIndex, nextWidth);
        }

        return;
      }

      const currentInitial =
        effectiveColSizesRef.current[dragState.colIndex] ??
        dragState.initialSize;
      const nextInitial = effectiveColSizesRef.current[dragState.colIndex + 1];
      const complement = (width: number) =>
        currentInitial + nextInitial - width;
      const currentWidth = roundCellSizeToStep(
        resizeLengthClampStatic(currentInitial + delta, {
          max: nextInitial ? complement(minColumnWidth) : undefined,
          min: minColumnWidth,
        }),
        undefined
      );
      const nextWidth = nextInitial ? complement(currentWidth) : undefined;

      if (finished) {
        commitColSize(dragState.colIndex, currentWidth);

        if (nextWidth !== undefined) {
          commitColSize(dragState.colIndex + 1, nextWidth);
        }
      } else if (deferColumnResize) {
        showDeferredResizeIndicator(
          getColumnBoundaryOffset(dragState.colIndex, currentWidth)
        );
      } else {
        showResizeIndicatorAtOffset(
          getColumnBoundaryOffset(dragState.colIndex, currentWidth)
        );
        overrideColSize(dragState.colIndex, currentWidth);

        if (nextWidth !== undefined) {
          overrideColSize(dragState.colIndex + 1, nextWidth);
        }
      }
    },
    [
      commitColSize,
      commitMarginLeft,
      commitRowSize,
      controlColumnWidth,
      deferColumnResize,
      getColumnBoundaryOffset,
      showDeferredResizeIndicator,
      showResizeIndicatorAtOffset,
      minColumnWidth,
      overrideColSize,
      overrideMarginLeft,
      overrideRowSize,
    ]
  );

  const stopResize = React.useCallback(() => {
    cleanupListenersRef.current?.();
    cleanupListenersRef.current = null;
    activeHandleKeyRef.current = null;
    previewHandleKeyRef.current = null;
    dragStateRef.current = null;

    if (activeRowElementRef.current) {
      delete activeRowElementRef.current.dataset.tableResizing;
      activeRowElementRef.current = null;
    }

    hideDeferredResizeIndicator();
    hideResizeIndicator();
    clearFrozenRowHeights();
  }, [clearFrozenRowHeights, hideDeferredResizeIndicator, hideResizeIndicator]);

  React.useEffect(() => stopResize, [stopResize]);

  const startResize = React.useCallback(
    (
      event: React.PointerEvent<HTMLDivElement>,
      { colIndex, direction, handleKey, rowIndex }: TableResizeStartOptions
    ) => {
      const rowHeight =
        tableRef.current?.rows.item(rowIndex)?.getBoundingClientRect().height ??
        0;

      dragStateRef.current = {
        colIndex,
        direction,
        initialPosition: direction === 'bottom' ? event.clientY : event.clientX,
        initialSize:
          direction === 'bottom'
            ? rowHeight
            : (effectiveColSizesRef.current[colIndex] ??
              TABLE_DEFAULT_COLUMN_WIDTH),
        marginLeft: marginLeftRef.current,
        rowIndex,
      };
      activeHandleKeyRef.current = handleKey;
      previewHandleKeyRef.current = null;

      const rowElement = tableRef.current?.rows.item(rowIndex) ?? null;

      if (
        activeRowElementRef.current &&
        activeRowElementRef.current !== rowElement
      ) {
        delete activeRowElementRef.current.dataset.tableResizing;
      }

      activeRowElementRef.current = rowElement;

      if (rowElement) {
        rowElement.dataset.tableResizing = 'true';
      }

      cleanupListenersRef.current?.();

      if (direction !== 'bottom') {
        freezeRowHeights();
      }

      const handlePointerMove = (pointerEvent: PointerEvent) => {
        applyResize(pointerEvent, false);
      };

      const handlePointerEnd = (pointerEvent: PointerEvent) => {
        applyResize(pointerEvent, true);
        stopResize();
      };

      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerEnd);
      window.addEventListener('pointercancel', handlePointerEnd);

      cleanupListenersRef.current = () => {
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerEnd);
        window.removeEventListener('pointercancel', handlePointerEnd);
      };

      if (deferColumnResize && direction !== 'bottom') {
        hideResizeIndicator();
        showDeferredResizeIndicator(
          direction === 'left'
            ? controlColumnWidth
            : getColumnBoundaryOffset(
                colIndex,
                effectiveColSizesRef.current[colIndex] ??
                  TABLE_DEFAULT_COLUMN_WIDTH
              )
        );
      } else {
        showResizeIndicator({ direction, event });
      }

      event.preventDefault();
      event.stopPropagation();
    },
    [
      controlColumnWidth,
      deferColumnResize,
      getColumnBoundaryOffset,
      hideResizeIndicator,
      showDeferredResizeIndicator,
      showResizeIndicator,
      stopResize,
      tableRef,
      applyResize,
      freezeRowHeights,
    ]
  );

  return React.useMemo(
    () => ({
      clearResizePreview,
      disableMarginLeft,
      setResizePreview,
      startResize,
    }),
    [clearResizePreview, disableMarginLeft, setResizePreview, startResize]
  );
}

export const TableElement = withHOC(
  TableProvider,
  function TableElement({
    children,
    ...props
  }: PlateElementProps<TTableElement>) {
    const readOnly = useReadOnly();
    const isSelectionAreaVisible = usePluginOption(
      BlockSelectionPlugin,
      'isSelectionAreaVisible'
    );
    const hasControls = !readOnly && !isSelectionAreaVisible;
    const { marginLeft, props: tableProps } = useTableElement();
    const colSizes = useTableColSizes();
    const controlColumnWidth = hasControls ? TABLE_CONTROL_COLUMN_WIDTH : 0;
    const dragIndicatorRef = React.useRef<HTMLDivElement>(null);
    const hoverIndicatorRef = React.useRef<HTMLDivElement>(null);
    const deferColumnResize =
      colSizes.length * props.element.children.length >
      TABLE_DEFERRED_COLUMN_RESIZE_CELL_COUNT;
    const tablePath = useElementSelector(([, path]) => path, [], {
      key: KEYS.table,
    });
    const tableRef = React.useRef<HTMLTableElement>(null);
    const wrapperRef = React.useRef<HTMLDivElement>(null);
    useTableSelectionDom(tableRef);
    const resizeController = useTableResizeController({
      controlColumnWidth,
      deferColumnResize,
      dragIndicatorRef,
      hoverIndicatorRef,
      marginLeft,
      tablePath,
      tableRef,
      wrapperRef,
    });
    const resolvedColSizes = React.useMemo(() => {
      if (colSizes.length > 0) {
        return colSizes.map((colSize) => colSize || TABLE_DEFAULT_COLUMN_WIDTH);
      }

      return Array.from(
        { length: getTableColumnCount(props.element) },
        () => TABLE_DEFAULT_COLUMN_WIDTH
      );
    }, [colSizes, props.element]);
    const tableVariableStyle = React.useMemo(() => {
      if (resolvedColSizes.length === 0) {
        return;
      }

      return {
        ...Object.fromEntries(
          resolvedColSizes.map((colSize, index) => [
            `--table-col-${index}`,
            `${colSize}px`,
          ])
        ),
      } as React.CSSProperties;
    }, [resolvedColSizes]);
    const tableStyle = React.useMemo(
      () =>
        ({
          width: `${
            resolvedColSizes.reduce((total, colSize) => total + colSize, 0) +
            controlColumnWidth
          }px`,
        }) as React.CSSProperties,
      [controlColumnWidth, resolvedColSizes]
    );

    const isSelectingTable = useBlockSelected(props.element.id as string);

    const editor = useEditorRef();
    const isInsideFullscreen = React.useContext(TableExpandedContext);
    const [expanded, setExpanded] = React.useState(false);

    const content = (
      <PlateElement
        {...props}
        className={cn(
          'overflow-x-auto py-5',
          hasControls && '-ml-2 *:data-[slot=block-selection]:left-2'
        )}
        style={{ paddingLeft: marginLeft }}
      >
        <TableResizeContext.Provider value={resizeController}>
          <div
            ref={wrapperRef}
            className="group/table relative w-fit"
            style={tableVariableStyle}
          >
            <div
              ref={dragIndicatorRef}
              className="-translate-x-[1.5px] pointer-events-none absolute inset-y-0 z-36 hidden w-[3px] bg-ring/70"
              contentEditable={false}
            />
            <div
              ref={hoverIndicatorRef}
              className="-translate-x-[1.5px] pointer-events-none absolute inset-y-0 z-35 hidden w-[3px] bg-ring/80"
              contentEditable={false}
            />
            <table
              ref={tableRef}
              className={cn(
                'mr-0 ml-px table h-px table-fixed border-collapse',
                'data-[table-selecting=true]:[&_*::selection]:!bg-transparent',
                'data-[table-selecting=true]:[&_*::selection]:!text-inherit',
                'data-[table-selecting=true]:[&_*::-moz-selection]:!bg-transparent',
                'data-[table-selecting=true]:[&_*::-moz-selection]:!text-inherit',
                'data-[table-selecting=true]:[&_*]:!caret-transparent'
              )}
              style={tableStyle}
              {...tableProps}
            >
              {resolvedColSizes.length > 0 && (
                <colgroup>
                  {hasControls && (
                    <col
                      style={{
                        maxWidth: TABLE_CONTROL_COLUMN_WIDTH,
                        minWidth: TABLE_CONTROL_COLUMN_WIDTH,
                        width: TABLE_CONTROL_COLUMN_WIDTH,
                      }}
                    />
                  )}
                  {resolvedColSizes.map((colSize, index) => (
                    <col
                      key={index}
                      style={{
                        maxWidth: colSize,
                        minWidth: colSize,
                        width: colSize,
                      }}
                    />
                  ))}
                </colgroup>
              )}
              <tbody className="min-w-full">{children}</tbody>
            </table>

            {isSelectingTable && (
              <div
                className={blockSelectionVariants()}
                contentEditable={false}
              />
            )}
          </div>
        </TableResizeContext.Provider>
      </PlateElement>
    );

    if (readOnly) {
      return (
        <PlateElement
          {...props}
          className="py-5"
          style={{ paddingLeft: marginLeft }}
        >
          <TablePreviewFrame>
            {(ref) => (
              <div ref={ref} className="w-fit" style={tableVariableStyle}>
                <table
                  className="mr-0 ml-px table h-px table-fixed border-collapse"
                  style={tableStyle}
                  {...tableProps}
                >
                  {resolvedColSizes.length > 0 && (
                    <colgroup>
                      {resolvedColSizes.map((colSize, index) => (
                        <col
                          key={index}
                          style={{
                            maxWidth: colSize,
                            minWidth: colSize,
                            width: colSize,
                          }}
                        />
                      ))}
                    </colgroup>
                  )}
                  <tbody className="min-w-full">{children}</tbody>
                </table>
              </div>
            )}
          </TablePreviewFrame>
        </PlateElement>
      );
    }

    // Already inside the fullscreen sub-editor: edit normally, no nested expand.
    if (isInsideFullscreen) {
      return (
        <TableFloatingToolbar anchorRef={wrapperRef} tableRef={tableRef}>
          {content}
        </TableFloatingToolbar>
      );
    }

    return (
      <>
        <TableEditorExpandable
          tableWrapRef={wrapperRef}
          onExpand={() => setExpanded(true)}
        >
          <TableFloatingToolbar anchorRef={wrapperRef} tableRef={tableRef}>
            {content}
          </TableFloatingToolbar>
        </TableEditorExpandable>

        {expanded && (
          <TableFullscreenEditor
            element={props.element}
            onClose={(next) => {
              setExpanded(false);
              if (!next) return;
              editor.tf.withoutNormalizing(() => {
                editor.tf.removeNodes({ at: tablePath });
                editor.tf.insertNodes(next, { at: tablePath });
              });
            }}
          />
        )}
      </>
    );
  }
);

/**
 * Host apps usually render the editor under a fixed header. The toolbar is
 * pinned below the table, so while the table is scrolling out of view there is
 * a window where the toolbar sits inside the header's strip and covers it.
 * Consumers declare that strip by setting `--op-plate-safe-area-top` (any
 * CSS length, inherited — put it on the app shell or on the editor container);
 * the toolbar then fades out before it reaches the header instead of after.
 */
const TABLE_TOOLBAR_SAFE_AREA_TOP_VAR = '--op-plate-safe-area-top';

function readSafeAreaTop(node: HTMLElement): number {
  const raw = getComputedStyle(node)
    .getPropertyValue(TABLE_TOOLBAR_SAFE_AREA_TOP_VAR)
    .trim();

  if (!raw) return 0;

  // `getComputedStyle` resolves custom properties as written, so anything but
  // px would need a layout probe to convert. Px covers the header case and
  // anything else degrades to "no safe area" rather than to a wrong number.
  const parsed = Number.parseFloat(raw);

  return Number.isFinite(parsed) && raw.endsWith('px') ? Math.max(parsed, 0) : 0;
}

function nearestScrollable(node: Element): Element | null {
  let element = node.parentElement;

  while (element) {
    // The height check is not redundant: setting only `overflow-x: auto` (which
    // the table wrapper does) makes the computed `overflow-y` `auto` as well,
    // so the style alone would match a purely horizontal scroller and pin the
    // observer root to the table itself.
    if (
      /auto|scroll/.test(getComputedStyle(element).overflowY) &&
      element.scrollHeight > element.clientHeight
    ) {
      return element;
    }

    element = element.parentElement;
  }

  return null;
}

/**
 * How much of the top of the scroll viewport is covered by something the
 * toolbar must not slide under: the editor's own sticky toolbar, plus whatever
 * strip the host app declared via `--op-plate-safe-area-top`.
 *
 * The editor toolbar is found rather than assumed because its height depends on
 * the item set and on wrapping, and because the fullscreen modal has its own.
 * Only sticky/fixed toolbars horizontally overlapping the table count — a
 * toolbar that scrolls away with the content obstructs nothing.
 */
function topObstruction(node: Element, root: Element | null): number {
  const declared = readSafeAreaTop(node as HTMLElement);
  const rootTop = root ? root.getBoundingClientRect().top : 0;
  const nodeRect = node.getBoundingClientRect();

  let obstruction = declared;

  node.ownerDocument.querySelectorAll('[role="toolbar"]').forEach((toolbar) => {
    if (!/sticky|fixed/.test(getComputedStyle(toolbar).position)) return;

    const rect = toolbar.getBoundingClientRect();
    if (rect.right <= nodeRect.left || rect.left >= nodeRect.right) return;

    obstruction = Math.max(obstruction, rect.bottom - rootTop);
  });

  return Math.max(obstruction, 0);
}

/**
 * Tracks whether the caret's cell is still visible, measured against the scroll
 * container and minus the obstructed strip at its top.
 *
 * Watching the cell rather than the whole table matters once a table is taller
 * than the viewport: the table can still be well in view while the cell being
 * edited has scrolled up under the toolbar, and the toolbar pinned to that cell
 * would be drawn across it.
 */
function useAnchorOnScreen(anchor: Element | null, enabled: boolean) {
  const [onScreen, setOnScreen] = React.useState(true);

  React.useEffect(() => {
    if (!anchor || !enabled || typeof IntersectionObserver === 'undefined') {
      setOnScreen(true);

      return;
    }

    const root = nearestScrollable(anchor);
    const obstruction = topObstruction(anchor, root);
    const observer = new IntersectionObserver(
      ([entry]) => {
        setOnScreen(entry?.isIntersecting ?? true);
      },
      {
        root,
        rootMargin: obstruction ? `-${obstruction}px 0px 0px 0px` : undefined,
        threshold: 0,
      }
    );

    observer.observe(anchor);

    return () => {
      observer.disconnect();
    };
  }, [anchor, enabled]);

  return onScreen;
}

/**
 * Anchors the toolbar to the cell holding the caret rather than to the whole
 * table. For a table taller than the viewport the two are nowhere near each
 * other: anchored to the table, the toolbar sits at its far edge, hundreds of
 * pixels off screen from where the user is actually typing.
 *
 * This is a Radix "virtual" anchor — an object that only has to report a rect —
 * so it can follow the caret from cell to cell without re-mounting the popover.
 * The rect is resolved on read (the popover repositions every animation frame),
 * and falls back to the table wrapper whenever the caret is not in a cell of
 * *this* table, which also covers the multi-cell selection case.
 */
function useCaretCellAnchor(
  tableRef: React.RefObject<HTMLTableElement | null>,
  fallbackRef: React.RefObject<HTMLElement | null>
) {
  // Radix only re-reads the anchor when the anchor *object* changes — it does
  // not poll a virtual one. So the identity has to change whenever the caret
  // moves to another cell, which is what this key drives.
  const caretPathKey = useEditorSelector(
    (editor) => (editor.selection?.anchor.path ?? []).join('.'),
    []
  );
  const [caretCell, setCaretCell] = React.useState<Element | null>(null);

  React.useEffect(() => {
    const table = tableRef.current;
    const selection = typeof window === 'undefined' ? null : getSelection();
    const anchorNode = selection?.anchorNode ?? null;
    const anchorElement =
      anchorNode?.nodeType === Node.ELEMENT_NODE
        ? (anchorNode as Element)
        : (anchorNode?.parentElement ?? null);
    const cell = anchorElement?.closest('td,th') ?? null;

    setCaretCell(cell && table?.contains(cell) ? cell : null);
  }, [caretPathKey, tableRef]);

  const anchorRef = React.useMemo(
    () => ({
      // Radix reads `current` and nothing else. Carrying the key on the object
      // documents that a new caret position is meant to produce a new anchor
      // identity, which is the whole point of rebuilding this memo.
      caretPathKey,
      current: {
        // Resolved on read so that scrolling within one cell stays exact.
        getBoundingClientRect: () =>
          (caretCell ?? fallbackRef.current)?.getBoundingClientRect() ??
          new DOMRect(),
      },
    }),
    [caretCell, caretPathKey, fallbackRef]
  );

  // The cell is also what the on-screen check must watch — see useAnchorOnScreen.
  return { anchorRef, caretCell };
}

function TableFloatingToolbar({
  anchorRef,
  children,
  tableRef,
  ...props
}: React.ComponentProps<typeof PopoverContent> & {
  anchorRef?: React.RefObject<HTMLElement | null>;
  tableRef?: React.RefObject<HTMLTableElement | null>;
}) {
  const selectedCellCount = useEditorSelector(
    (editor) =>
      editor.getApi(TablePlugin).table.getSelectedCellIds()?.length ?? 0,
    []
  );
  const selected = useSelected();
  const collapsedInside = useEditorSelector(
    (editor) => selected && editor.api.isCollapsed(),
    [selected]
  );
  const isFocusedLast = useFocusedLast();
  const [isExpandedSelectionToolbarReady, setIsExpandedSelectionToolbarReady] =
    React.useState(false);
  const isCollapsedToolbarOpen = isFocusedLast && collapsedInside;
  const isExpandedSelectionPending =
    isFocusedLast && !collapsedInside && selectedCellCount > 1;

  React.useEffect(() => {
    if (!isExpandedSelectionPending) {
      setIsExpandedSelectionToolbarReady(false);

      return;
    }

    const timeoutId = window.setTimeout(() => {
      setIsExpandedSelectionToolbarReady(true);
    }, TABLE_MULTI_SELECTION_TOOLBAR_DELAY_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isExpandedSelectionPending]);

  const shouldRenderExpandedSelectionToolbar =
    isExpandedSelectionToolbarReady && isExpandedSelectionPending;
  const isToolbarOpen =
    isCollapsedToolbarOpen || shouldRenderExpandedSelectionToolbar;
  const { anchorRef: caretAnchorRef, caretCell } = useCaretCellAnchor(
    tableRef ?? emptyTableRef,
    anchorRef ?? emptyAnchorRef
  );
  const isAnchorOnScreen = useAnchorOnScreen(
    caretCell ?? anchorRef?.current ?? null,
    isToolbarOpen
  );

  return (
    <Popover open={isToolbarOpen} modal={false}>
      {children}
      <PopoverAnchor virtualRef={caretAnchorRef} />
      {isCollapsedToolbarOpen && (
        <CollapsedTableFloatingToolbarContent
          anchorHidden={!isAnchorOnScreen}
          {...props}
        />
      )}
      {shouldRenderExpandedSelectionToolbar && (
        <ExpandedSelectionTableFloatingToolbarContent
          anchorHidden={!isAnchorOnScreen}
          {...props}
        />
      )}
    </Popover>
  );
}

// Stable no-op refs so the hooks above keep an unconditional call order even
// when this toolbar is rendered without the optional refs.
const emptyTableRef: React.RefObject<HTMLTableElement | null> = { current: null };
const emptyAnchorRef: React.RefObject<HTMLElement | null> = { current: null };

type TableFloatingToolbarContentProps = React.ComponentProps<
  typeof PopoverContent
> & {
  /** The table scrolled out of view — fade the toolbar out instead of leaving
   * it stranded over whatever is now under it (a sticky app header, usually). */
  anchorHidden?: boolean;
};

function ExpandedSelectionTableFloatingToolbarContent(
  props: TableFloatingToolbarContentProps
) {
  const { tf } = useEditorPlugin(TablePlugin);
  const { canMerge, canSplit } = useTableMergeState();

  if (!canMerge && !canSplit) return null;

  return (
    <TableFloatingToolbarContent
      canMerge={canMerge}
      canSplit={canSplit}
      onMerge={() => tf.table.merge()}
      onSplit={() => tf.table.split()}
      {...props}
    />
  );
}

function CollapsedTableFloatingToolbarContent(
  props: TableFloatingToolbarContentProps
) {
  const { tf } = useEditorPlugin(TablePlugin);
  const element = useElement<TTableElement>();
  const { props: buttonProps } = useRemoveNodeButton({ element });
  const { canSplit } = useTableMergeState();

  return (
    <TableFloatingToolbarContent
      buttonProps={buttonProps}
      canSplit={canSplit}
      collapsedInside
      onDeleteColumn={() => {
        tf.remove.tableColumn();
      }}
      onDeleteRow={() => {
        tf.remove.tableRow();
      }}
      onInsertColumnAfter={() => {
        tf.insert.tableColumn();
      }}
      onInsertColumnBefore={() => {
        tf.insert.tableColumn({ before: true });
      }}
      onInsertRowAfter={() => {
        tf.insert.tableRow();
      }}
      onInsertRowBefore={() => {
        tf.insert.tableRow({ before: true });
      }}
      onSplit={() => tf.table.split()}
      {...props}
    />
  );
}

function TableFloatingToolbarContent({
  anchorHidden = false,
  buttonProps,
  canMerge = false,
  canSplit = false,
  collapsedInside = false,
  onDeleteColumn,
  onDeleteRow,
  onInsertColumnAfter,
  onInsertColumnBefore,
  onInsertRowAfter,
  onInsertRowBefore,
  onMerge,
  onSplit,
  ...props
}: TableFloatingToolbarContentProps & {
  buttonProps?: React.ComponentProps<typeof ToolbarButton>;
  canMerge?: boolean;
  canSplit?: boolean;
  collapsedInside?: boolean;
  onDeleteColumn?: () => void;
  onDeleteRow?: () => void;
  onInsertColumnAfter?: () => void;
  onInsertColumnBefore?: () => void;
  onInsertRowAfter?: () => void;
  onInsertRowBefore?: () => void;
  onMerge?: () => void;
  onSplit?: () => void;
}) {
  const { t } = usePlateI18n();
  const isInsideFullscreen = React.useContext(TableExpandedContext);
  return (
    <PopoverContent
      asChild
      // `updatePositionStrategy="always"` makes Radix reposition on every
      // animation frame instead of only on the scroll/resize events floating-ui
      // managed to subscribe to. The default misses host layouts whose scroll
      // container it did not detect as an overflow ancestor: the toolbar then
      // freezes at its last viewport position while the table scrolls away
      // underneath — which is what "the menu flies up into the header" actually
      // is. Collision avoidance stays ON so the toolbar is never pushed off
      // screen and out of reach; keeping it on screen while the table is gone
      // is instead handled by `hideWhenDetached` and the `anchorHidden` fade.
      updatePositionStrategy="always"
      hideWhenDetached
      onOpenAutoFocus={(e) => e.preventDefault()}
      contentEditable={false}
      {...props}
    >
      <Toolbar
        className={cn(
          'scrollbar-hide flex w-auto max-w-[80vw] flex-row overflow-x-auto rounded-md border bg-popover p-1 shadow-md transition-opacity duration-150 print:hidden',
          anchorHidden && 'pointer-events-none opacity-0'
        )}
        contentEditable={false}
        // In the page editor: one below the editor's own sticky FixedToolbar
        // (`z-50`). Both used to sit at `z-50`, and this one is portalled to
        // `<body>`, so it won the tie on DOM order and painted *over* the main
        // toolbar whenever a partially-scrolled cell put it up there.
        //
        // In the fullscreen modal the same value would hide it entirely: the
        // overlay is itself `z-50` and forms a stacking context, so anything
        // below 50 lands behind the whole modal. Nothing can be both above the
        // overlay and below a toolbar nested inside it, so there we keep 50 and
        // rely on the fade to clear the toolbar's strip.
        //
        // Radix mirrors the content's computed z-index onto its popper wrapper,
        // so setting it here is enough. Inline rather than a class, which would
        // collide with the `z-50` PopoverContent already carries.
        style={{ zIndex: isInsideFullscreen ? 50 : 40, ...props.style }}
        // Read by index.css to disable pointer events on Radix's popper
        // wrapper too — see the rule there.
        data-op-toolbar-hidden={anchorHidden ? 'true' : undefined}
      >
        <ToolbarGroup>
          <ColorDropdownMenu tooltip={t('backgroundColor')}>
            <PaintBucketIcon />
          </ColorDropdownMenu>
          {canMerge && onMerge && (
            <ToolbarButton
              onClick={onMerge}
              onMouseDown={(e) => e.preventDefault()}
              tooltip={t('mergeCells')}
            >
              <CombineIcon />
            </ToolbarButton>
          )}
          {canSplit && onSplit && (
            <ToolbarButton
              onClick={onSplit}
              onMouseDown={(e) => e.preventDefault()}
              tooltip={t('splitCell')}
            >
              <SquareSplitHorizontalIcon />
            </ToolbarButton>
          )}

          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <ToolbarButton tooltip={t('cellBorders')}>
                <Grid2X2Icon />
              </ToolbarButton>
            </DropdownMenuTrigger>

            <DropdownMenuPortal>
              <TableBordersDropdownMenuContent />
            </DropdownMenuPortal>
          </DropdownMenu>

          {collapsedInside && !isInsideFullscreen && (
            <ToolbarGroup>
              <ToolbarButton tooltip={t('deleteTable')} {...buttonProps}>
                <Trash2Icon />
              </ToolbarButton>
            </ToolbarGroup>
          )}
        </ToolbarGroup>

        {collapsedInside && (
          <ToolbarGroup>
            <ToolbarButton
              onClick={onInsertRowBefore}
              onMouseDown={(e) => e.preventDefault()}
              tooltip={t('insertRowBefore')}
            >
              <ArrowUp />
            </ToolbarButton>
            <ToolbarButton
              onClick={onInsertRowAfter}
              onMouseDown={(e) => e.preventDefault()}
              tooltip={t('insertRowAfter')}
            >
              <ArrowDown />
            </ToolbarButton>
            <ToolbarButton
              onClick={onDeleteRow}
              onMouseDown={(e) => e.preventDefault()}
              tooltip={t('deleteRow')}
            >
              <XIcon />
            </ToolbarButton>
          </ToolbarGroup>
        )}

        {collapsedInside && (
          <ToolbarGroup>
            <ToolbarButton
              onClick={onInsertColumnBefore}
              onMouseDown={(e) => e.preventDefault()}
              tooltip={t('insertColumnBefore')}
            >
              <ArrowLeft />
            </ToolbarButton>
            <ToolbarButton
              onClick={onInsertColumnAfter}
              onMouseDown={(e) => e.preventDefault()}
              tooltip={t('insertColumnAfter')}
            >
              <ArrowRight />
            </ToolbarButton>
            <ToolbarButton
              onClick={onDeleteColumn}
              onMouseDown={(e) => e.preventDefault()}
              tooltip={t('deleteColumn')}
            >
              <XIcon />
            </ToolbarButton>
          </ToolbarGroup>
        )}
      </Toolbar>
    </PopoverContent>
  );
}

function TableBordersDropdownMenuContent(
  props: React.ComponentProps<typeof DropdownMenuContent>
) {
  const { t } = usePlateI18n();
  const editor = useEditorRef();
  const {
    getOnSelectTableBorder,
    hasBottomBorder,
    hasLeftBorder,
    hasNoBorders,
    hasOuterBorders,
    hasRightBorder,
    hasTopBorder,
  } = useTableBordersDropdownMenuContentState();

  return (
    <DropdownMenuContent
      className="min-w-[220px]"
      onCloseAutoFocus={(e) => {
        e.preventDefault();
        editor.tf.focus();
      }}
      align="start"
      side="right"
      sideOffset={0}
      {...props}
    >
      <DropdownMenuGroup>
        <DropdownMenuCheckboxItem
          checked={hasTopBorder}
          onCheckedChange={getOnSelectTableBorder('top')}
        >
          <BorderTopIcon />
          <div>{t('topBorder')}</div>
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={hasRightBorder}
          onCheckedChange={getOnSelectTableBorder('right')}
        >
          <BorderRightIcon />
          <div>{t('rightBorder')}</div>
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={hasBottomBorder}
          onCheckedChange={getOnSelectTableBorder('bottom')}
        >
          <BorderBottomIcon />
          <div>{t('bottomBorder')}</div>
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={hasLeftBorder}
          onCheckedChange={getOnSelectTableBorder('left')}
        >
          <BorderLeftIcon />
          <div>{t('leftBorder')}</div>
        </DropdownMenuCheckboxItem>
      </DropdownMenuGroup>

      <DropdownMenuGroup>
        <DropdownMenuCheckboxItem
          checked={hasNoBorders}
          onCheckedChange={getOnSelectTableBorder('none')}
        >
          <BorderNoneIcon />
          <div>{t('noBorder')}</div>
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={hasOuterBorders}
          onCheckedChange={getOnSelectTableBorder('outer')}
        >
          <BorderAllIcon />
          <div>{t('outsideBorders')}</div>
        </DropdownMenuCheckboxItem>
      </DropdownMenuGroup>
    </DropdownMenuContent>
  );
}

function ColorDropdownMenu({
  children,
  tooltip,
}: {
  children: React.ReactNode;
  tooltip: string;
}) {
  const { t } = usePlateI18n();
  const [open, setOpen] = React.useState(false);

  const editor = useEditorRef();

  const onUpdateColor = React.useCallback(
    (color: string) => {
      setOpen(false);
      setCellBackground(editor, {
        color,
        selectedCells:
          editor.getApi(TablePlugin).table.getSelectedCells() ?? [],
      });
    },
    [editor]
  );

  const onClearColor = React.useCallback(() => {
    setOpen(false);
    setCellBackground(editor, {
      color: null,
      selectedCells: editor.getApi(TablePlugin).table.getSelectedCells() ?? [],
    });
  }, [editor]);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
      <DropdownMenuTrigger asChild>
        <ToolbarButton tooltip={tooltip}>{children}</ToolbarButton>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-[340px] max-w-[90vw]">
        <ToolbarMenuGroup label={t('colors')}>
          <ColorDropdownMenuItems
            className="px-2"
            colors={DEFAULT_COLORS}
            updateColor={onUpdateColor}
          />
        </ToolbarMenuGroup>
        <DropdownMenuGroup>
          <DropdownMenuItem className="p-2" onClick={onClearColor}>
            <EraserIcon />
            <span>{t('clear')}</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Wires react-dnd up for one row.
 *
 * This lives in its own component because `useDraggable` subscribes to the
 * editor and re-renders its host on **every** document change. Held inside
 * `TableRowElement`, that re-rendered every row of the table on every
 * keystroke — even while typing in a paragraph elsewhere in the document
 * (measured: 25 rows × StrictMode = 50 row renders per typed character,
 * ~60ms of the per-keystroke cost on a 25-row table).
 *
 * The row passes its own `nodeRef` in, so drag and drop still attach to the
 * `<tr>` itself rather than to anything this renders.
 */
function TableRowDragSource({
  element,
  onDraggingChange,
  rowRef,
}: {
  element: TTableRowElement;
  onDraggingChange: (isDragging: boolean) => void;
  rowRef: React.RefObject<HTMLTableRowElement | null>;
}) {
  const editor = useEditorRef();
  const { isDragging, previewRef, handleRef } = useDraggable({
    element,
    type: element.type,
    nodeRef: rowRef as never,
    canDropNode: ({ dragEntry, dropEntry }) =>
      PathApi.equals(
        PathApi.parent(dragEntry[1]),
        PathApi.parent(dropEntry[1])
      ),
    onDropHandler: (_, { dragItem }) => {
      const dragElement = (dragItem as { element: TElement }).element;

      if (dragElement) {
        editor.tf.select(dragElement);
      }
    },
  });

  // The drag preview is the row itself.
  React.useEffect(() => {
    previewRef.current = rowRef.current as never;
  });

  React.useEffect(() => {
    onDraggingChange(isDragging);
  }, [isDragging, onDraggingChange]);

  return <RowDragHandle dragRef={handleRef} />;
}

export function TableRowElement({
  children,
  ...props
}: PlateElementProps<TTableRowElement>) {
  const { element } = props;
  const readOnly = useReadOnly();
  const rowIndex = useElementSelector(([, path]) => path.at(-1) as number, [], {
    key: KEYS.tr,
  });
  const rowSize = useElementSelector(
    ([node]) => (node as TTableRowElement).size,
    [],
    {
      key: KEYS.tr,
    }
  );
  const rowSizeOverrides = useTableValue('rowSizeOverrides');
  const rowMinHeight = rowSizeOverrides.get?.(rowIndex) ?? rowSize;
  const isSelectionAreaVisible = usePluginOption(
    BlockSelectionPlugin,
    'isSelectionAreaVisible'
  );
  const hasControls = !readOnly && !isSelectionAreaVisible;

  const rowRef = React.useRef<HTMLTableRowElement>(null);
  const [isHovered, setIsHovered] = React.useState(false);
  const [isDragging, setIsDragging] = React.useState(false);
  // A drag in progress anywhere means every row has to be a live drop target.
  // Otherwise only the hovered row needs one, since the handle is what starts a
  // drag and it is itself only revealed on hover.
  const isDragInProgress = usePluginOption(DndPlugin, 'isDragging');
  const needsDragSource = hasControls && (isHovered || isDragInProgress);

  return (
    <PlateElement
      {...props}
      ref={useComposedRef(props.ref, rowRef)}
      as="tr"
      className={cn('group/row', isDragging && 'opacity-50')}
      style={
        {
          ...props.style,
          '--tableRowMinHeight': rowMinHeight ? `${rowMinHeight}px` : undefined,
        } as React.CSSProperties
      }
      attributes={{
        ...props.attributes,
        onMouseEnter: () => setIsHovered(true),
        onMouseLeave: () => setIsHovered(false),
      }}
    >
      {hasControls && (
        <td
          className="w-2 min-w-2 max-w-2 select-none p-0"
          contentEditable={false}
        >
          {needsDragSource && (
            <TableRowDragSource
              element={element}
              onDraggingChange={setIsDragging}
              rowRef={rowRef}
            />
          )}
          <RowDropLine />
        </td>
      )}

      {children}
    </PlateElement>
  );
}

function useTableCellPresentation(element: TTableCellElement) {
  const { api } = useEditorPlugin(TablePlugin);
  const borders = useTableCellBorders({ element });
  const { col, row } = useCellIndices();

  const colSpan = api.table.getColSpan(element);
  const rowSpan = api.table.getRowSpan(element);
  const width = React.useMemo(() => {
    const terms = Array.from(
      { length: colSpan },
      (_, offset) => `var(--table-col-${col + offset}, 120px)`
    );

    return terms.length === 1 ? terms[0]! : `calc(${terms.join(' + ')})`;
  }, [col, colSpan]);

  return {
    borders,
    colIndex: col + colSpan - 1,
    colSpan,
    rowIndex: row + rowSpan - 1,
    rowSpan,
    width,
  };
}

function RowDragHandle({ dragRef }: { dragRef: React.Ref<any> }) {
  const editor = useEditorRef();
  const element = useElement();

  return (
    <Button
      ref={dragRef}
      variant="outline"
      className={cn(
        '-translate-y-1/2 absolute top-1/2 left-0 z-51 h-6 w-4 p-0 focus-visible:ring-0 focus-visible:ring-offset-0',
        'cursor-grab active:cursor-grabbing',
        'opacity-0 transition-opacity duration-100 group-hover/row:opacity-100 group-data-[table-resizing=true]/row:opacity-0'
      )}
      onClick={() => {
        editor.tf.select(element);
      }}
    >
      <GripVertical className="text-muted-foreground" />
    </Button>
  );
}

function RowDropLine() {
  const { dropLine } = useDropLine();

  if (!dropLine) return null;

  return (
    <div
      className={cn(
        'absolute inset-x-0 left-2 z-50 h-0.5 bg-brand/50',
        dropLine === 'top' ? '-top-px' : '-bottom-px'
      )}
    />
  );
}

export function TableCellElement({
  isHeader,
  ...props
}: PlateElementProps<TTableCellElement> & {
  isHeader?: boolean;
}) {
  const readOnly = useReadOnly();
  const element = props.element;

  const tableId = useElementSelector(([node]) => node.id as string, [], {
    key: KEYS.table,
  });
  const rowId = useElementSelector(([node]) => node.id as string, [], {
    key: KEYS.tr,
  });
  const isSelectingTable = useBlockSelected(tableId);
  const isSelectingRow = useBlockSelected(rowId) || isSelectingTable;
  const isSelectionAreaVisible = usePluginOption(
    BlockSelectionPlugin,
    'isSelectionAreaVisible'
  );

  const { borders, colIndex, colSpan, rowIndex, rowSpan, width } =
    useTableCellPresentation(element);

  return (
    <PlateElement
      {...props}
      as={isHeader ? 'th' : 'td'}
      className={cn(
        'relative h-full overflow-visible border-none bg-background p-0',
        element.background ? 'bg-(--cellBackground)' : 'bg-background',
        isHeader && 'text-left *:m-0',
        'before:size-full',
        'data-[table-cell-selected=true]:before:z-10',
        'data-[table-cell-selected=true]:before:bg-brand/5',
        "before:absolute before:box-border before:select-none before:content-['']",
        borders.bottom?.size && 'before:border-b before:border-b-border',
        borders.right?.size && 'before:border-r before:border-r-border',
        borders.left?.size && 'before:border-l before:border-l-border',
        borders.top?.size && 'before:border-t before:border-t-border'
      )}
      style={
        {
          '--cellBackground': element.background,
          maxWidth: width,
          minWidth: width,
        } as React.CSSProperties
      }
      attributes={{
        ...props.attributes,
        colSpan,
        'data-table-cell-id': element.id,
        rowSpan,
      }}
    >
      <div
        // `whitespace-pre-wrap` is mandatory, not cosmetic: with `white-space:
        // normal` the browser collapses the trailing space of a cell, so the
        // caret never advances past it and the next keystroke is inserted
        // *before* the space ("A1x" + Space + "y" → "A1xy "). `break-normal` /
        // `word-break: normal` keep long words from being split mid-word,
        // which is the behaviour this wrapper actually wants.
        className="relative z-20 box-border h-full px-3 py-2 whitespace-pre-wrap break-normal [overflow-wrap:normal] [word-break:normal] [&_*]:[word-break:normal]"
        style={
          rowSpan === 1
            ? { minHeight: 'var(--tableRowMinHeight, 0px)' }
            : undefined
        }
      >
        {props.children}
      </div>

      {!readOnly && !isSelectionAreaVisible && (
        <TableCellResizeControls colIndex={colIndex} rowIndex={rowIndex} />
      )}

      {isSelectingRow && (
        <div className={blockSelectionVariants()} contentEditable={false} />
      )}
    </PlateElement>
  );
}

export function TableCellHeaderElement(
  props: React.ComponentProps<typeof TableCellElement>
) {
  return <TableCellElement {...props} isHeader />;
}

const TableCellResizeControls = React.memo(function TableCellResizeControls({
  colIndex,
  rowIndex,
}: {
  colIndex: number;
  rowIndex: number;
}) {
  const {
    clearResizePreview,
    disableMarginLeft,
    setResizePreview,
    startResize,
  } = useTableResizeContext();
  const rightHandleKey = `right:${rowIndex}:${colIndex}`;
  const bottomHandleKey = `bottom:${rowIndex}:${colIndex}`;
  const leftHandleKey = `left:${rowIndex}:${colIndex}`;
  const isLeftHandle = colIndex === 0 && !disableMarginLeft;

  return (
    <div
      className="group/resize pointer-events-none absolute inset-0 z-30 select-none"
      contentEditable={false}
      suppressContentEditableWarning={true}
    >
      <div
        className="-top-2 -right-1 pointer-events-auto absolute z-40 h-[calc(100%_+_8px)] w-2 cursor-col-resize touch-none"
        onPointerEnter={(event) => {
          setResizePreview(event, {
            colIndex,
            direction: 'right',
            handleKey: rightHandleKey,
            rowIndex,
          });
        }}
        onPointerLeave={() => {
          clearResizePreview(rightHandleKey);
        }}
        onPointerDown={(event) => {
          startResize(event, {
            colIndex,
            direction: 'right',
            handleKey: rightHandleKey,
            rowIndex,
          });
        }}
      />
      <div
        className="-bottom-1 pointer-events-auto absolute left-0 z-40 h-2 w-full cursor-row-resize touch-none"
        onPointerEnter={(event) => {
          setResizePreview(event, {
            colIndex,
            direction: 'bottom',
            handleKey: bottomHandleKey,
            rowIndex,
          });
        }}
        onPointerLeave={() => {
          clearResizePreview(bottomHandleKey);
        }}
        onPointerDown={(event) => {
          startResize(event, {
            colIndex,
            direction: 'bottom',
            handleKey: bottomHandleKey,
            rowIndex,
          });
        }}
      />
      {isLeftHandle && (
        <div
          className="-left-1 pointer-events-auto absolute top-0 z-40 h-full w-2 cursor-col-resize touch-none"
          onPointerEnter={(event) => {
            setResizePreview(event, {
              colIndex,
              direction: 'left',
              handleKey: leftHandleKey,
              rowIndex,
            });
          }}
          onPointerLeave={() => {
            clearResizePreview(leftHandleKey);
          }}
          onPointerDown={(event) => {
            startResize(event, {
              colIndex,
              direction: 'left',
              handleKey: leftHandleKey,
              rowIndex,
            });
          }}
        />
      )}
    </div>
  );
});

TableCellResizeControls.displayName = 'TableCellResizeControls';
