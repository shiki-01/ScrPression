
/**
 * イベントが発生した際に、登録されたリスナーに通知するクラス
 */
class ListenerManager<T> {

	// リスナーのリスト
	private listeners: ((event: T) => void)[] = [];

	/**
	 * リスナーを登録する
	 * @param listener リスナー
	 * @returns リスナーの解除関数
	 */
	public subscribe(listener: (event: T) => void): () => void {
		this.listeners.push(listener);
		return () => {
			this.listeners = this.listeners.filter(l => l !== listener);
		};
	}

	/**
	 * リスナーに通知する
	 * @param event イベント
	 */
	public notifyListeners(event: T): void {
		this.listeners.forEach(listener => listener(event));
	}
}

export { ListenerManager };
