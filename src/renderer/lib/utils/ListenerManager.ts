class ListenerManager<T> {
	private listeners: Set<(event: T) => void> = new Set();

	public subscribe(listener: (event: T) => void): () => void {
		this.listeners.add(listener);
		return () => this.listeners.delete(listener);
	}

	public notifyListeners(event: T): void {
		this.listeners.forEach((listener) => listener(event));
	}
}

export { ListenerManager };
