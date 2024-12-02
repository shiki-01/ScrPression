interface Block {
    title: string;
    type: 'single' | 'multi';
    connect: {
        input: boolean;
        output: boolean;
    };
    contents: (
        | {
                [key: string]: {
                    text: string;
                    type: string;
                };
          }
        | 'space'
    )[];
}

export type { Block };