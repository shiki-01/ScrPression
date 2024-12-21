import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import type { BlockContent } from '$lib/block/type';
import BaseDialog from '$lib/dialog/BaseDialog';

interface AddBlockProps {
	onClose: () => void;
}

const AddBlock: React.FC<AddBlockProps> = ({ onClose }) => {
	const [name, setName] = useState('');
	const [type, setType] = useState('works');
	const [output, setOutput] = useState('');
	const [contents, setContents] = useState<BlockContent[]>([]);

	const addContent = () => {
		const newContent = [...contents];
		newContent.push({
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
		console.log(name, type, output, contents);
		onClose();
	};

	return (
		<BaseDialog onClose={onClose} size={{ width: 600, height: 500 }}>
			<div className="flex h-full w-full flex-col">
				<div className="flex items-center justify-end">
					<button
						onClick={onClose}
						className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-50"
					>
						<Icon icon="ic:round-close" className="h-5 w-5" />
					</button>
				</div>
				<div className="flex h-full w-full flex-col gap-2">
					<div className="flex h-full w-full flex-col gap-2 px-4 pb-2">
						<div className="flex w-full flex-row items-center justify-between">
							<p className="text-nowrap">Block Name</p>
							<input
								onInput={(e) => setName(e.currentTarget.value)}
								type="text"
								className="w-[400px] border-b border-slate-800 bg-transparent p-1 focus:outline-none"
							/>
						</div>
						<div className="flex w-full flex-row items-center justify-between">
							<p className="text-nowrap">Block Type</p>
							<select
								value={type}
								onChange={(e) => setType(e.currentTarget.value)}
								className="w-[400px] border-b border-slate-800 bg-transparent p-1 focus:outline-none"
							>
								<option value="move">Move</option>
								<option value="works">Works</option>
								<option value="compo">Compo</option>
								<option value="flag">Flag</option>
							</select>
						</div>
						<div className="flex w-full flex-row items-center justify-between">
							<p className="text-nowrap">Output</p>
							<input
								onInput={(e) => setOutput(e.currentTarget.value)}
								type="text"
								className="w-[400px] border-b border-slate-800 bg-transparent p-1 focus:outline-none"
							/>
						</div>
						<div className="flex h-full w-full flex-col gap-1">
							<p className="text-nowrap">Contents</p>
							<div className="flex h-full max-h-[200px] w-full flex-col gap-2 overflow-y-auto rounded-lg border border-slate-800 p-2">
								<div className="p-2">
									<div className="ml-4 w-full">
										<div className="grid grid-cols-3 gap-2">
											<p className="text-nowrap text-center">Title</p>
											<p className="text-nowrap text-center">Value</p>
											<p className="text-nowrap text-center">Placeholder</p>
										</div>
									</div>
									{contents.map((content, index) => (
										<div
											key={index}
											className="w-fullitems-center flex flex-row justify-between gap-2"
										>
											<button
												onClick={() => {
													const newContents = [...contents];
													newContents.filter((_, i) => i !== index);
													console.log(newContents);
													setContents(newContents);
												}}
												className="rounded-full text-slate-800"
											>
												<Icon icon="ic:round-close" className="h-4 w-4" />
											</button>
											<div className="grid grid-cols-3 gap-2">
												<input
													onInput={(e) => {
														const newContents = [...contents];
														newContents[index].content.title = e.currentTarget.value;
														setContents(newContents);
													}}
													type="text"
													className="border-b border-slate-800 bg-transparent p-1 focus:outline-none"
												/>
												<input
													onInput={(e) => {
														const newContents = [...contents];
														newContents[index].content.value = e.currentTarget.value;
														setContents(newContents);
													}}
													type="text"
													className="border-b border-slate-800 bg-transparent p-1 focus:outline-none"
												/>
												<input
													onInput={(e) => {
														const newContents = [...contents];
														newContents[index].content.placeholder = e.currentTarget.value;
														setContents(newContents);
													}}
													type="text"
													className="border-b border-slate-800 bg-transparent p-1 focus:outline-none"
												/>
											</div>
										</div>
									))}
								</div>
								<div className="flex w-full items-center justify-center">
									<button onClick={addContent} className="rounded-full bg-slate-400 p-2 text-white">
										<Icon icon="ic:round-add" className="h-5 w-5" />
									</button>
								</div>
							</div>
						</div>
					</div>
					<div className="flex w-full justify-end">
						<button
							onClick={handleSubmit}
							className="flex h-10 w-40 items-center justify-center rounded-lg bg-slate-800 text-white"
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
