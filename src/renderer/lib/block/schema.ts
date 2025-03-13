import { z } from 'zod';
import type {
	BlockContent, BlockStoreState,
	BlockType,
	Connections,
	Enclose,
	Position,
	SelectContent,
	SeparatorContent,
	Size,
	ValueContent
} from './type';

// ブロックの位置情報のスキーマ
const PositionSchema: z.ZodType<Position> = z.object({
	x: z.number(),
	y: z.number()
});

// ブロックの値の内容のスキーマ
const ValueContentSchema: z.ZodType<ValueContent> = z.object({
	title: z.string(),
	value: z.string(),
	placeholder: z.string()
});

// ブロックの区切りの種類のスキーマ
const SeparatorContentSchema: z.ZodType<SeparatorContent> = z.object({
	type: z.union([z.literal('line'), z.literal('space')])
});

// ブロックの選択肢の内容のスキーマ
const SelectContentSchema: z.ZodType<SelectContent> = z.object({
	title: z.string(),
	value: z.string(),
	placeholder: z.string(),
	options: z.array(z.object({
		id: z.string(),
		title: z.string()
	}))
});

// 判別共用体を使用してコンテンツタイプを定義
const BlockContentSchema = z.discriminatedUnion('type', [
	z.object({
		type: z.literal('value'),
		id: z.string(),
		content: ValueContentSchema
	}),
	z.object({
		type: z.literal('separator'),
		id: z.string(),
		content: SeparatorContentSchema
	}),
	z.object({
		type: z.literal('select'),
		id: z.string(),
		content: SelectContentSchema
	})
]);

// ブロックの接続情報のスキーマ
const ConnectionsSchema: z.ZodType<Connections> = z.object({
	input: PositionSchema.nullable(),
	output: PositionSchema.nullable()
});

// ブロックのサイズのスキーマ
const SizeSchema: z.ZodType<Size> = z.object({
	width: z.number(),
	height: z.number()
});

// ブロックの囲み情報のスキーマ
const EncloseSchema: z.ZodType<Enclose> = z.object({
	offset: PositionSchema,
	connections: z.object({
		output: PositionSchema
	}),
	contents: z.lazy(() => z.array(BlockTypeSchema))
});

// 読み取り専用のBlockTypeスキーマ
const ReadonlyBlockTypeSchema = z.object({
	id: z.string(),
	type: z.union([
		z.literal('flag'),
		z.union([z.literal('move'), z.literal('composition'), z.literal('works')]),
		z.literal('loop'),
		z.literal('value')
	]),
	title: z.string(),
	output: z.string(),
	connections: ConnectionsSchema
});

// 完全なBlockTypeスキーマ
const BlockTypeSchema: z.ZodType<BlockType> = ReadonlyBlockTypeSchema.extend({
	contents: z.array(BlockContentSchema),
	position: PositionSchema,
	size: SizeSchema,
	childId: z.string().optional(),
	parentId: z.string().optional(),
	depth: z.number(),
	zIndex: z.number(),
	enclose: EncloseSchema.optional()
});

// イベント型のスキーマ
const BlockStoreEventSchema = z.object({
	type: z.union([
		z.literal('add'),
		z.literal('remove'),
		z.literal('update'),
		z.literal('clear'),
		z.literal('output'),
		z.literal('load')
	]),
	id: z.string().optional(),
	block: BlockTypeSchema.optional(),
	output: z.string().optional()
});

// ストア全体のスキーマ
const BlockStoreStateSchema: z.ZodType<BlockStoreState> = z.object({
	blocks: z.record(z.string(), BlockTypeSchema),
	idList: z.array(z.string()),
	output: z.string()
});

export {
	PositionSchema,
	ValueContentSchema,
	SeparatorContentSchema,
	SelectContentSchema,
	BlockContentSchema,
	ConnectionsSchema,
	SizeSchema,
	EncloseSchema,
	ReadonlyBlockTypeSchema,
	BlockTypeSchema,
	BlockStoreEventSchema,
	BlockStoreStateSchema
}

export type {
	Position,
	ValueContent,
	SeparatorContent,
	SelectContent,
	BlockContent,
	BlockType,
}