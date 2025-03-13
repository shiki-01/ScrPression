import { proxy, snapshot, subscribe } from 'valtio';
import { BlockStoreEvent, BlockType, BlockStoreState, ReadonlyBlockStoreState } from './type';
import { BlockStoreStateSchema, BlockTypeSchema } from './schema';
import { ListenerManager } from '$lib/utils/ListenerManager.ts';

/**
 * ブロックストアの作成
 * @returns ブロックストア
 */
const createBlockStore = () => {
	// リスナーマネージャーの初期化
	const listenerManager = new ListenerManager<BlockStoreEvent>();

	// ストアの初期化
	const state = proxy<BlockStoreState>({
		blocks: {},
		idList: [],
		output: ''
	});

	// スナップショット作成時の処理を追加
	subscribe(state, () => {
		saveToLocalStorage(snapshot(state) as ReadonlyBlockStoreState);
	});

	// ローカルストレージ関連の処理
	const STORAGE_KEY = 'block-store-state';

	/**
	 * ローカルストレージに保存
	 * @param stateSnapshot ステートのスナップショット
	 */
	const saveToLocalStorage = (stateSnapshot: ReadonlyBlockStoreState) => {
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(stateSnapshot));
		} catch (error) {
			console.error('ローカルストレージへの保存に失敗:', error);
		}
	}

	/**
	 * ローカルストレージから読み込み
	 * @returns ブロックストアの状態
	 * @throws パースエラー
	 * @throws スキーマエラー
	 * @throws その他エラー
	 * @returns ブロックストアの状態
	 **/
	const loadFromLocalStorage = (): BlockStoreState | null => {
		try {
			const serializedState = localStorage.getItem(STORAGE_KEY);
			if (!serializedState) return null;

			const parsedState = JSON.parse(serializedState);
			return BlockStoreStateSchema.parse(parsedState);
		} catch (error) {
			console.error('ローカルストレージからの読み込みに失敗:', error);
			return null;
		}
	}

	// アクションの定義
	const actions = {

		/**
		 * ブロックを追加
		 * @param block 追加するブロック
		 * @returns 追加したブロックのID
		 */
		addBlock(block: Omit<BlockType, 'id'> & { id?: string }): string {
			const id = block.id || crypto.randomUUID();
			const newBlock = { ...block, id };

			// スキーマ検証を行う（valtio-zodが内部で行うが、明示的にエラーハンドリングするため）
			try {
				BlockTypeSchema.parse(newBlock);
			} catch (error) {
				console.error('不正なブロックデータ:', error);
				throw error;
			}

			// 状態更新
			state.blocks[id] = newBlock as unknown as BlockType;
			state.idList.push(id);

			// リスナーに通知
			listenerManager.notifyListeners({
				type: 'add',
				id,
				block: newBlock as unknown as BlockType
			});

			return id;
		},

		/**
		 * ブロックを削除
		 * @param id 削除するブロックのID
		 */
		removeBlock(id: string): void {
			if (!state.blocks[id]) return;

			// 状態更新
			delete state.blocks[id];
			state.idList = state.idList.filter(blockId => blockId !== id);

			// リスナーに通知
			listenerManager.notifyListeners({
				type: 'remove',
				id
			});
		},

		/**
		 * ブロックを更新
		 * @param id 更新するブロックのID
		 * @param partialBlock 部分的なブロックデータ
		 */
		updateBlock(id: string, partialBlock: Partial<BlockType>): void {
			if (!state.blocks[id]) return;

			try {
				// 更新されたブロックを準備
				const updatedBlock = {
					...state.blocks[id],
					...partialBlock
				};

				// スキーマ検証
				BlockTypeSchema.parse(updatedBlock);

				// 検証に成功したら更新
				state.blocks[id] = updatedBlock;

				// リスナーに通知
				listenerManager.notifyListeners({
					type: 'update',
					id,
					block: updatedBlock
				});
			} catch (error) {
				console.error('ブロック更新エラー:', error);
				throw error;
			}
		},

		/**
		 * 値の更新
		 * @param id ブロックID
		 * @param contentId コンテンツID
		 * @param value 更新する値
		 */
		updateValue(id: string, contentId: string, value: string): void {
			if (!state.blocks[id]) return;

			try {
				const block = state.blocks[id];
				const updatedContents = block.contents.map(content => {
					if (content.id === contentId && content.type === 'value') {
						return {
							...content,
							content: {
								...content.content,
								value
							}
						};
					}
					return content;
				});

				// 更新されたブロック
				const updatedBlock = {
					...block,
					contents: updatedContents
				};

				// スキーマ検証
				BlockTypeSchema.parse(updatedBlock);

				// 検証に成功したら更新
				state.blocks[id] = updatedBlock;

				// リスナーに通知
				listenerManager.notifyListeners({
					type: 'update',
					id,
					block: updatedBlock
				});
			} catch (error) {
				console.error('値の更新に失敗:', error);
				throw error;
			}
		},

		/**
		 * ブロックのzIndexを更新
		 * @param id ブロックID
		 */
		updateZIndex(id: string): void {
			const block = state.blocks[id];
			if (!block) return;

			const maxZIndex = state.idList.length;

			// 子ブロックのIDを再帰的に収集
			const collectAllChildIds = (blockId: string): string[] => {
				const currentBlock = state.blocks[blockId];
				if (currentBlock && currentBlock.childId) {
					return [blockId, ...collectAllChildIds(currentBlock.childId)];
				}
				return [blockId];
			};

			const currentZIndex = block.zIndex;
			const targetIds = collectAllChildIds(id);

			// 対象ブロックとその子のzIndexを更新
			targetIds.forEach((blockId, index) => {
				if (state.blocks[blockId]) {
					state.blocks[blockId].zIndex = maxZIndex + index;
				}
			});

			// 他のブロックのzIndexを調整
			state.idList.forEach(blockId => {
				if (!targetIds.includes(blockId)) {
					const otherBlock = state.blocks[blockId];
					if (otherBlock && otherBlock.zIndex > currentZIndex) {
						otherBlock.zIndex -= targetIds.length;
					}
				}
			});

			// リスナーに通知
			listenerManager.notifyListeners({
				type: 'update',
				id,
				block: state.blocks[id]
			});
		},

		// ブロックをクリア
		clearBlocks(): void {
			state.blocks = {};
			state.idList = [];

			// リスナーに通知
			listenerManager.notifyListeners({
				type: 'clear',
				id: ''
			});
		},

		/**
		 * 出力を設定
		 * @param output 出力
		 */
		setOutput(output: string): void {
			state.output = output;

			// リスナーに通知
			listenerManager.notifyListeners({
				type: 'output',
				id: '',
				output
			});
		},

		// 出力をクリア
		clearOutput(): void {
			state.output = '';

			// リスナーに通知
			listenerManager.notifyListeners({
				type: 'output',
				id: '',
				output: ''
			});
		},

		// ローカルストレージからロード
		loadFromStorage(): void {
			const savedState = loadFromLocalStorage();
			if (!savedState) return;

			// ステートの復元
			state.blocks = savedState.blocks;
			state.idList = savedState.idList;
			state.output = savedState.output;

			// リスナーに通知
			listenerManager.notifyListeners({
				type: 'load',
				id: ''
			});
		},

		/**
		 * リスナーの登録
		 * @param listener リスナー
		 */
		subscribe(listener: (event: BlockStoreEvent) => void): () => void {
			return listenerManager.subscribe(listener);
		},

		/**
		 * ブロックの取得
		 * @param id ブロックID
		 */
		getBlock(id: string): BlockType | undefined {
			return state.blocks[id];
		},

		// 全ブロックの取得
		getBlocks(): { blocks: BlockType[]; idList: string[] } {
			return {
				blocks: Object.values(state.blocks),
				idList: [...state.idList]
			};
		},

		// 出力の取得
		getOutput(): string {
			return state.output;
		}
	};

	return {
		state,
		...actions
	};
};

// ブロックストアのシングルトン
export class BlockStore {
	private static instance: ReturnType<typeof createBlockStore>;

	/**
	 * インスタンスの取得
	 * @returns ブロックストアのインスタンス
	 */
	public static getInstance(): ReturnType<typeof createBlockStore> {
		if (!BlockStore.instance) {
			BlockStore.instance = createBlockStore();
		}
		return BlockStore.instance;
	}
}