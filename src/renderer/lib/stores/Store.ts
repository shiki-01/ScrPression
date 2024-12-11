export class Store<T> {
	private subscribers = new Set<(value: T) => void>();
	private currentValue: T;

	constructor(initialValue: T) {
		this.currentValue = initialValue;
	}

	update: (fn: (value: T) => T) => void = (fn) => this.set(fn(this.currentValue));

	subscribe(fn: (value: T) => void) {
		this.subscribers.add(fn);
		fn(this.currentValue);
		return () => this.subscribers.delete(fn);
	}

	get() {
		return this.currentValue;
	}

	public set(newValue: T) {
		if (this.currentValue === newValue) return;
		this.currentValue = newValue;
		this.notify();
	}

	protected notify() {
		this.subscribers.forEach((fn) => fn(this.currentValue));
	}
}

export function createStore<T>(initialValue: T) {
	const store = new Store<T>(initialValue);
	return {
		subscribe: store.subscribe.bind(store),
		set: store.set.bind(store),
		update: store.update.bind(store),
		get: store.get.bind(store)
	};
}
