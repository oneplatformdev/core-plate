// Registry of in-flight AbortControllers, one per placeholder being uploaded
// during a Google-Docs paste. Lets the placeholder's upload hook read the
// signal off it, and lets the cancel button abort whichever request is
// currently active.

const controllers = new Map<string, AbortController>();

export const pasteAbortControllers = {
  set(id: string, controller: AbortController) {
    controllers.set(id, controller);
  },
  get(id: string): AbortController | undefined {
    return controllers.get(id);
  },
  delete(id: string) {
    controllers.delete(id);
  },
  abortAll() {
    controllers.forEach((c) => c.abort());
    controllers.clear();
  },
};
