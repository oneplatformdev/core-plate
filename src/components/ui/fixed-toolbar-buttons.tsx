'use client';

import * as React from 'react';

import {
  BaselineIcon,
  BoldIcon,
  Code2Icon,
  ItalicIcon,
  MoreHorizontalIcon,
  PaintBucketIcon,
  StrikethroughIcon,
  UnderlineIcon,
} from 'lucide-react';
import { KEYS } from 'platejs';
import { useEditorReadOnly } from 'platejs/react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { usePlateI18n } from '@/i18n/provider';

import { AlignToolbarButton } from './align-toolbar-button';
import { EmojiToolbarButton } from './emoji-toolbar-button';
import { FontColorToolbarButton } from './font-color-toolbar-button';
import { FontSizeToolbarButton } from './font-size-toolbar-button';
import { RedoToolbarButton, UndoToolbarButton } from './history-toolbar-button';
import {
  IndentToolbarButton,
  OutdentToolbarButton,
} from './indent-toolbar-button';
import { InsertToolbarButton } from './insert-toolbar-button';
import { LineHeightToolbarButton } from './line-height-toolbar-button';
import { LinkToolbarButton } from './link-toolbar-button';
import {
  BulletedListToolbarButton,
  NumberedListToolbarButton,
  TodoListToolbarButton,
} from './list-toolbar-button';
import { MarkToolbarButton } from './mark-toolbar-button';
import { MediaToolbarButton } from './media-toolbar-button';
import { TableToolbarButton } from './table-toolbar-button';
import { ToggleToolbarButton } from './toggle-toolbar-button';
import { ToolbarButton } from './toolbar';
import { ToolbarOverflowContext } from './toolbar-overflow-context';
import { TurnIntoToolbarButton } from './turn-into-toolbar-button';

type ToolbarItem = {
  group: string;
  key: string;
  render: () => React.ReactNode;
};

export function FixedToolbarButtons() {
  const { t } = usePlateI18n();
  const readOnly = useEditorReadOnly();
  const containerRef = React.useRef<HTMLDivElement>(null);
  const itemMeasureRefs = React.useRef<(HTMLDivElement | null)[]>([]);
  const separatorMeasureRef = React.useRef<HTMLDivElement>(null);
  const moreMeasureRef = React.useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = React.useState<number | null>(null);
  const [menuOpen, setMenuOpen] = React.useState(false);

  const items = React.useMemo<ToolbarItem[]>(
    () => [
      { group: 'history', key: 'undo', render: () => <UndoToolbarButton /> },
      { group: 'history', key: 'redo', render: () => <RedoToolbarButton /> },
      { group: 'insert', key: 'insert', render: () => <InsertToolbarButton /> },
      { group: 'insert', key: 'turn-into', render: () => <TurnIntoToolbarButton /> },
      { group: 'insert', key: 'font-size', render: () => <FontSizeToolbarButton /> },
      {
        group: 'marks',
        key: 'bold',
        render: () => (
          <MarkToolbarButton nodeType={KEYS.bold} tooltip={t('boldShortcut')}>
            <BoldIcon />
          </MarkToolbarButton>
        ),
      },
      {
        group: 'marks',
        key: 'italic',
        render: () => (
          <MarkToolbarButton nodeType={KEYS.italic} tooltip={t('italicShortcut')}>
            <ItalicIcon />
          </MarkToolbarButton>
        ),
      },
      {
        group: 'marks',
        key: 'underline',
        render: () => (
          <MarkToolbarButton nodeType={KEYS.underline} tooltip={t('underlineShortcut')}>
            <UnderlineIcon />
          </MarkToolbarButton>
        ),
      },
      {
        group: 'marks',
        key: 'strikethrough',
        render: () => (
          <MarkToolbarButton
            nodeType={KEYS.strikethrough}
            tooltip={t('strikethroughShortcut')}
          >
            <StrikethroughIcon />
          </MarkToolbarButton>
        ),
      },
      {
        group: 'marks',
        key: 'code',
        render: () => (
          <MarkToolbarButton nodeType={KEYS.code} tooltip={t('codeShortcut')}>
            <Code2Icon />
          </MarkToolbarButton>
        ),
      },
      {
        group: 'marks',
        key: 'text-color',
        render: () => (
          <FontColorToolbarButton nodeType={KEYS.color} tooltip={t('textColor')}>
            <BaselineIcon />
          </FontColorToolbarButton>
        ),
      },
      {
        group: 'marks',
        key: 'bg-color',
        render: () => (
          <FontColorToolbarButton nodeType={KEYS.backgroundColor} tooltip={t('backgroundColor')}>
            <PaintBucketIcon />
          </FontColorToolbarButton>
        ),
      },
      { group: 'lists', key: 'align', render: () => <AlignToolbarButton /> },
      { group: 'lists', key: 'numbered', render: () => <NumberedListToolbarButton /> },
      { group: 'lists', key: 'bulleted', render: () => <BulletedListToolbarButton /> },
      { group: 'lists', key: 'todo', render: () => <TodoListToolbarButton /> },
      { group: 'lists', key: 'toggle', render: () => <ToggleToolbarButton /> },
      { group: 'links', key: 'link', render: () => <LinkToolbarButton /> },
      { group: 'links', key: 'table', render: () => <TableToolbarButton /> },
      { group: 'links', key: 'emoji', render: () => <EmojiToolbarButton /> },
      { group: 'media', key: 'img', render: () => <MediaToolbarButton nodeType={KEYS.img} /> },
      { group: 'media', key: 'video', render: () => <MediaToolbarButton nodeType={KEYS.video} /> },
      { group: 'media', key: 'audio', render: () => <MediaToolbarButton nodeType={KEYS.audio} /> },
      { group: 'media', key: 'file', render: () => <MediaToolbarButton nodeType={KEYS.file} /> },
      { group: 'indent', key: 'line-height', render: () => <LineHeightToolbarButton /> },
      { group: 'indent', key: 'outdent', render: () => <OutdentToolbarButton /> },
      { group: 'indent', key: 'indent', render: () => <IndentToolbarButton /> },
    ],
    [t]
  );

  // Button widths depend only on the item set (icons, and the labels inside
  // `turn-into` / `font-size`), never on editor content or container width. So
  // they are measured once per item set and cached: the hidden probe row is
  // mounted only while `needsMeasure` is true and dropped straight afterwards.
  // Keeping it mounted meant every keystroke re-rendered all ~27 buttons a
  // second time, invisibly — measured at 114 ToolbarButton renders per typed
  // character before this change.
  const itemWidthsRef = React.useRef<number[] | null>(null);
  const chromeWidthsRef = React.useRef<{ more: number; separator: number } | null>(
    null
  );
  // Which item set the cached widths belong to. Deriving "do we need to
  // measure?" from this instead of keeping a separate boolean matters: a
  // boolean flipped to `false` by the measuring effect and back to `true` by an
  // items effect settles, within one commit, on the value it already had — so
  // React skips the re-render and the probe row never unmounts.
  const [measuredFor, setMeasuredFor] = React.useState<ToolbarItem[] | null>(
    null
  );
  const needsMeasure = measuredFor !== items;

  // Web fonts land after first paint and change label widths.
  React.useEffect(() => {
    if (readOnly || typeof document === 'undefined' || !document.fonts) return;

    let cancelled = false;
    void document.fonts.ready.then(() => {
      if (!cancelled) setMeasuredFor(null);
    });

    return () => {
      cancelled = true;
    };
  }, [readOnly]);

  const recalculate = React.useCallback(() => {
    const container = containerRef.current;
    const itemWidths = itemWidthsRef.current;
    const chrome = chromeWidthsRef.current;
    if (!container || !itemWidths || !chrome) return;

    const availableWidth = container.offsetWidth;

    let count = 0;
    let usedWidth = 0;
    for (let index = 0; index < itemWidths.length; index += 1) {
      const width = itemWidths[index] ?? 0;
      const separator =
        index > 0 && items[index - 1]?.group !== items[index]?.group
          ? chrome.separator
          : 0;
      const hasRemaining = index < itemWidths.length - 1;
      const reserveForMore = hasRemaining ? chrome.separator + chrome.more : 0;
      if (usedWidth + separator + width + reserveForMore > availableWidth) break;
      usedWidth += separator + width;
      count += 1;
    }

    setVisibleCount(count);
  }, [items]);

  React.useLayoutEffect(() => {
    if (readOnly || !needsMeasure) return;

    itemWidthsRef.current = itemMeasureRefs.current.map(
      (el) => el?.offsetWidth ?? 0
    );
    chromeWidthsRef.current = {
      more: moreMeasureRef.current?.offsetWidth ?? 40,
      separator: separatorMeasureRef.current?.offsetWidth ?? 12,
    };

    setMeasuredFor(items);
    recalculate();
  }, [items, needsMeasure, readOnly, recalculate]);

  // Only the container resizes at runtime; the cached widths stay valid.
  React.useEffect(() => {
    if (readOnly) return;

    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(recalculate);
    observer.observe(container);

    return () => observer.disconnect();
  }, [readOnly, recalculate]);

  const safeVisibleCount = visibleCount ?? items.length;
  const visibleItems = React.useMemo(
    () => items.slice(0, safeVisibleCount),
    [items, safeVisibleCount]
  );
  const hiddenItems = React.useMemo(
    () => items.slice(safeVisibleCount),
    [items, safeVisibleCount]
  );
  const hasHiddenItems = hiddenItems.length > 0;

  const renderItems = (renderList: ToolbarItem[]) => (
    <div className="flex items-center gap-0">
      {renderList.map((item, index) => {
        const showSeparator = index > 0 && renderList[index - 1]?.group !== item.group;
        return (
          <React.Fragment key={item.key}>
            {showSeparator && (
              <div className="mx-1.5 py-0.5">
                <Separator orientation="vertical" />
              </div>
            )}
            <div className="flex items-center">{item.render()}</div>
          </React.Fragment>
        );
      })}
    </div>
  );

  const renderOverflowItems = (renderList: ToolbarItem[]) => (
    <div className="flex flex-col gap-1">
      {renderList.map((item, index) => {
        const showSeparator = index > 0 && renderList[index - 1]?.group !== item.group;
        return (
          <React.Fragment key={`overflow-${item.key}`}>
            {showSeparator && <Separator className="my-1" orientation="horizontal" />}
            <div className="flex items-center">{item.render()}</div>
          </React.Fragment>
        );
      })}
    </div>
  );

  // This component re-renders on every editor change (it subscribes via
  // `useEditorReadOnly`). Holding the rendered element trees by identity means
  // React bails out of the whole button subtree on those re-renders, leaving
  // each button to update only through its own editor subscription — which is
  // the work that actually has to happen.
  const visibleContent = React.useMemo(
    () => renderItems(visibleItems),
    [visibleItems]
  );
  const overflowContent = React.useMemo(
    () => renderOverflowItems(hiddenItems),
    [hiddenItems]
  );

  return (
    <div ref={containerRef} className="relative flex w-full min-w-0 items-center overflow-hidden">
      {!readOnly && (
        <>
          <div className="flex min-w-0 items-center overflow-hidden">{visibleContent}</div>

          <div className="grow" />

          {hasHiddenItems && (
            <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen} modal={false}>
              <DropdownMenuTrigger asChild>
                <ToolbarButton pressed={menuOpen} tooltip={t('more')}>
                  <MoreHorizontalIcon />
                </ToolbarButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="ignore-click-outside/toolbar max-h-[55vh] max-w-[90vw] min-w-1! w-full overflow-y-auto overflow-x-hidden p-1.5"
                align="end"
                collisionPadding={8}
                side="bottom"
                sideOffset={6}
              >
                <ToolbarOverflowContext.Provider value>
                  {overflowContent}
                </ToolbarOverflowContext.Provider>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {needsMeasure && (
          <div aria-hidden className="pointer-events-none absolute -z-10 opacity-0">
            <div className="flex items-center">
              {items.map((item, index) => (
                <React.Fragment key={`measure-${item.key}`}>
                  {index > 0 && items[index - 1]?.group !== item.group && (
                    <div ref={separatorMeasureRef} className="mx-1.5 py-0.5">
                      <Separator orientation="vertical" />
                    </div>
                  )}
                  <div
                    ref={(el) => {
                      itemMeasureRefs.current[index] = el;
                    }}
                    className="flex items-center"
                  >
                    {item.render()}
                  </div>
                </React.Fragment>
              ))}
              <div ref={moreMeasureRef} className="mx-1.5 py-0.5">
                <ToolbarButton>
                  <MoreHorizontalIcon />
                </ToolbarButton>
              </div>
            </div>
          </div>
          )}
        </>
      )}
    </div>
  );
}
