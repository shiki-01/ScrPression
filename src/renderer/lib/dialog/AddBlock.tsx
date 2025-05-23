import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import { v4 as uuid } from 'uuid';
import type {
	BlockContent,
	BlockType,
	SelectBlockContent,
	ValueBlockContent
} from '$lib/block/type';
import BaseDialog from '$lib/dialog/BaseDialog';
import { ListStore } from '$lib/list/store.ts';

interface AddBlockProps {
	onClose: () => void;
}

type AddBlockContent = BlockContent & {
	selectType: 'value' | 'select' | 'separator';
	selectId: string;
};

/**
 * AddBlock
 * @param onClose 閉じるハンドラ
 * @constructor AddBlock
 */
const AddBlock: React.FC<AddBlockProps> = ({ onClose }) => {
	const [name, setName] = useState('');
	const [type, setType] = useState<'flag' | 'move' | 'composition' | 'works' | 'loop' | 'value'>(
		'works'
	);
	const [output, setOutput] = useState('');
	const [contents, setContents] = useState<AddBlockContent[]>([]);

	const addContent = () => {
		const newContent = [...contents];
		newContent.push({
			selectType: 'value',
			selectId: uuid(),
			id: '',
			type: 'value',
			content: {
				title: '',
				value: '',
				placeholder: ''
			}
		});
		setContents(newContent);
	};

	const handleSubmit = () => {
		if (!name || !type || !output) return;
		const newContents: BlockContent[] = [];

		contents.forEach((content) => {
			if (content.selectType === 'separator') {
				newContents.push({
					id: content.id,
					type: 'separator',
					content: {
						type: 'line'
					}
				});
			} else if (content.selectType === 'value' && content.type === 'value') {
				if (
					'title' in content.content &&
					'value' in content.content &&
					'placeholder' in content.content
				) {
					console.log(content);
					newContents.push({
						id: content.id,
						type: 'value',
						content: {
							title: content.content.title,
							value: content.content.value,
							placeholder: content.content.placeholder
						}
					});
				}
			} else if (content.selectType === 'select' && content.type === 'select') {
				if (
					'title' in content.content &&
					'value' in content.content &&
					'options' in content.content
				) {
					newContents.push({
						id: content.id,
						type: 'select',
						content: {
							title: content.content.title,
							value: content.content.value,
							placeholder: content.content.placeholder,
							options: content.content.options || []
						}
					});
				}
			}
		});

		const newBlock: BlockType = {
			id: '',
			type,
			title: name,
			output,
			contents: newContents,
			connections: {
				input: { x: 16, y: 0 },
				output: { x: 16, y: 0 }
			},
			position: { x: 0, y: 0 },
			size: { width: 0, height: 0 },
			childId: '',
			parentId: '',
			depth: 0,
			zIndex: 0
		};

		const listStore = ListStore.getInstance();
		listStore.addList(newBlock);
		console.log(listStore.getLists().map((list) => listStore.getList(list)));
		onClose();
	};

	/**
	 * handleDelete
	 * @param deleteId 削除するID
	 */
	const handleDelete = (deleteId: string) => {
		setContents((currentContents) => currentContents.filter((content) => content.id !== deleteId));
	};

	/**
	 * isBlockWithTitle
	 * @param content ブロックコンテンツ
	 * @returns ブロックコンテンツがタイトルを持つかどうか
	 * @constructor isBlockWithTitle
	 **/
	const isBlockWithTitle = (
		content: BlockContent
	): content is ValueBlockContent | SelectBlockContent => {
		return (
			(content.type === 'value' &&
				'title' in content.content &&
				'value' in content.content &&
				'placeholder' in content.content) ||
			(content.type === 'select' && 'title' in content.content && 'value' in content.content)
		);
	};

	/**
	 * handleChange
	 * @param index インデックス
	 * @param value 値
	 * @param property プロパティ
	 * @constructor handleChange
	 */
	const handleChange = (
		index: number,
		value: string,
		property: 'id' | 'title' | 'value' | 'placeholder' | 'selectType'
	) => {
		const targetContent = contents[index];
		if (!isBlockWithTitle(targetContent)) return;

		const newContents = contents.map((content, i) => {
			if (i !== index) return content;

			if (!isBlockWithTitle(content)) return content;

			if (property === 'selectType') {
				const newSelectType = value as 'value' | 'select' | 'separator';
				return {
					...content,
					selectType: newSelectType
				} as AddBlockContent;
			}

			if (property === 'id') {
				console.log(value, content);
				return {
					...content,
					id: value
				} as AddBlockContent;
			}

			switch (content.type) {
				case 'value':
					return {
						...content,
						content: {
							...content.content,
							[property]: value
						}
					} as ValueBlockContent & {
						selectType: 'value' | 'select' | 'separator';
						selectId: string;
					};
				case 'select':
					return {
						...content,
						content: {
							...content.content,
							[property]: value,
							options: content.content.options
						}
					} as SelectBlockContent & {
						selectType: 'value' | 'select' | 'separator';
						selectId: string;
					};
				default:
					return content;
			}
		});

		setContents(newContents);
	};

	return (
		<BaseDialog onClose={onClose} size={{ width: 600, height: 500 }}>
			<div className="flex h:full w:full flex:col">
				<div className="flex align-items:center justify-content:end">
					<button
						onClick={onClose}
						className="flex h:40px w:40px align-items:center justify-content:center rounded bg:#f8fafc"
					>
						<Icon icon="ic:round-close" className="h:20px w:20px" />
					</button>
				</div>
				<div className="flex h:full w:full flex:col  gap:8px">
					<div className="flex h:full w:full flex:col  gap:8px px:16px pb:2">
						<div className="flex w:full flex:row align-items:center justify-content:space-between">
							<p className="">Block Name</p>
							<input
								onInput={(e) => setName(e.currentTarget.value)}
								type="text"
								className="w:160px bb:1px|solid|#1e293b bg:transparent p:4px focus:outline-none"
							/>
						</div>
						<div className="flex w:full flex:row align-items:center justify-content:space-between">
							<p className="">Block Type</p>
							<select
								value={type}
								onChange={(e) =>
									setType(
										e.currentTarget.value as
											| 'flag'
											| 'move'
											| 'composition'
											| 'works'
											| 'loop'
											| 'value'
									)
								}
								className="w:160px bb:1px|solid|#1e293b bg:transparent p:4px focus:outline-none"
							>
								<option value="move">Move</option>
								<option value="works">Works</option>
								<option value="compo">Compo</option>
								<option value="flag">Flag</option>
							</select>
						</div>
						<div className="flex w:full flex:row align-items:center justify-content:space-between">
							<p className="">Output</p>
							<input
								onInput={(e) => setOutput(e.currentTarget.value)}
								type="text"
								className="w:160px bb:1px|solid|#1e293b bg:transparent p:4px focus:outline-none"
							/>
						</div>
						<div className="flex h:full w:full flex:col  gap:4px">
							<p className="">Contents</p>
							<div className="flex h:full max-h:200px w:full flex:col gap:8px overflow:y-auto r:8px bb:1px|solid|#1e293b p:8px">
								<div className="flex flex:col  gap:8px p:8px">
									{contents.map((content, index) => (
										<div
											key={content.selectId}
											className="w:full align-items:center flex flex:row justify-content:space-between gap:8px"
										>
											<button
												onClick={() => {
													handleDelete(content.selectId);
												}}
												className="rounded f:#1e293b"
											>
												<Icon icon="ic:round-close" className="h:64px w:16px" />
											</button>
											<select
												value={contents[index].selectType}
												onChange={(e) => handleChange(index, e.currentTarget.value, 'selectType')}
												className="bb:1px|solid|#1e293b bg:transparent p:4px focus:outline-none"
											>
												<option value="value">Value</option>
												<option value="select">Select</option>
												<option value="separator">Separator</option>
											</select>
											<div className="grid grid-cols:4  gap:8px">
												<input
													disabled={contents[index].selectType === 'separator'}
													placeholder="ID"
													onChange={(e) => handleChange(index, e.currentTarget.value, 'id')}
													type="id"
													className="bb:1px|solid|#1e293b bg:transparent p:4px focus:outline-none"
												/>
												<input
													disabled={contents[index].selectType === 'separator'}
													placeholder="Title"
													onChange={(e) => handleChange(index, e.currentTarget.value, 'title')}
													type="text"
													className="bb:1px|solid|#1e293b bg:transparent p:4px focus:outline-none"
												/>
												<input
													disabled={contents[index].selectType === 'separator'}
													placeholder="Value"
													onChange={(e) => handleChange(index, e.currentTarget.value, 'value')}
													type="text"
													className="bb:1px|solid|#1e293b bg:transparent p:4px focus:outline-none"
												/>
												<input
													disabled={contents[index].selectType === 'separator'}
													placeholder="Placeholder"
													onChange={(e) =>
														handleChange(index, e.currentTarget.value, 'placeholder')
													}
													type="text"
													className="bb:1px|solid|#1e293b bg:transparent p:4px focus:outline-none"
												/>
											</div>
										</div>
									))}
								</div>
								<div className="flex w:full align-items:center justify-content:center">
									<button onClick={addContent} className="rounded bg:#94a3b8 p:8px f:white">
										<Icon icon="ic:round-add" className="h:20px w:20px" />
									</button>
								</div>
							</div>
						</div>
					</div>
					<div className="flex w:full justify-content:end">
						<button
							onClick={handleSubmit}
							className="flex h:40px w:160px align-items:center justify-content:center r:8px bg:#1e293b f:white"
						>
							Add Block
						</button>
					</div>
				</div>
			</div>
		</BaseDialog>
	);
};

export default AddBlock;
