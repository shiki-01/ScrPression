export class EventManager {
	private handlers = new Map<string, Set<Function>>();

	emit(event: string, data?: any) {
		const handlers = this.handlers.get(event);
		handlers?.forEach((handler) => handler(data));
	}

	on(event: string, handler: Function) {
		if (!this.handlers.has(event)) {
			this.handlers.set(event, new Set());
		}
		this.handlers.get(event)!.add(handler);
	}

	off(event: string, handler: Function) {
		this.handlers.get(event)?.delete(handler);
	}
}
