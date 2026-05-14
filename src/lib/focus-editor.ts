import type { PlateEditor } from 'platejs/react';

// Restoring focus to the editor after a toolbar interaction (insert block,
// upload media, run a transform) needs to survive two failure modes that
// Slate's own `editor.tf.focus()` does NOT cover:
//
// 1. The OS file picker / a Radix focus-scope moved `document.activeElement`
//    outside the editor's contenteditable host. Slate sometimes no-ops in this
//    state because it tracks selection independently of DOM focus.
// 2. Toolbar buttons / dropdown triggers retain DOM focus after `onSelect`
//    fires; `editor.tf.focus()` updates Slate's selection but does not move
//    the browser's focus until the next interaction.
//
// Calling `.focus()` directly on the contenteditable host first, then asking
// Slate to reapply selection, fixes both cases. Selection is left untouched
// (caller decides whether to collapse / select end).
export function focusEditorReliably(editor: PlateEditor): void {
  const domEditor = editor.api.toDOMNode(editor);
  if (domEditor && document.activeElement !== domEditor) {
    domEditor.focus({ preventScroll: true });
  }
  editor.tf.focus();
}
