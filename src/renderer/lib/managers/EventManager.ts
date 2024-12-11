export class EventManager {
 private static handlers = new Map<string, Set<Function>>();

 static emit(event: string, data?: any) {
  const handlers = this.handlers.get(event);
  handlers?.forEach((handler) => handler(data));
 }

 static on(event: string, handler: Function) {
  if (!EventManager.handlers.has(event)) {
   EventManager.handlers.set(event, new Set());
  }
  EventManager.handlers.get(event)!.add(handler);
 }

 static off(event: string, handler: Function) {
  EventManager.handlers.get(event)?.delete(handler);
 }
}