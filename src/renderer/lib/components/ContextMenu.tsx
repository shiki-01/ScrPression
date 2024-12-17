import React, { useState } from "react";
import { Icon } from "@iconify/react";

interface ContextMenuProps {
    position: { x: number; y: number };
    onClose: () => void;
};

const ContextMenu: React.FC<ContextMenuProps> = ({ position, onClose }) => {
    return (
        <div className="fixed top-0 left-0 w-full h-full inset-0 z-[998]">
            <button
                aria-label="Close"
                onClick={() => onClose()}
                className="fixed inset-0 opacity-0"
            ></button>
            <div
                className="fixed bg-slate-50 rounded-lg shadow-lg w-48 z-[999]"
                style={{ top: position.y + 1, left: position.x + 1 }}
            >
                <div className="p-2 flex flex-col gap-1 text-sm">
                    <button
                        className="w-full flex flex-row gap-4 px-2 py-1 items-center justify-start bg-slate-50 hover:bg-slate-200 transition-colors duration-300"
                    >
                        <Icon icon="ic:round-undo" className="h-5 w-5" />
                        Undo
                    </button>
                    <button
                        className="w-full flex flex-row gap-4 px-2 py-1 items-center justify-start bg-slate-50 hover:bg-slate-200 transition-colors duration-300"
                    >
                        <Icon icon="ic:round-redo" className="h-5 w-5" />
                        Redo
                    </button>
                    <span className="w-full h-[1px] my-1 bg-slate-200"></span>
                    <button
                        className="w-full flex flex-row gap-4 px-2 py-1 items-center justify-start bg-slate-50 hover:bg-slate-200 transition-colors duration-300">
                        <Icon icon="ic:round-delete" className="h-5 w-5" />
                        Add Comment
                    </button>
                    <span className="w-full h-[1px] my-1 bg-slate-200"></span>
                    <button
                        className="w-full flex flex-row gap-4 px-2 py-1 items-center justify-start bg-slate-50 hover:bg-slate-200 transition-colors duration-300">
                        <Icon icon="ic:round-delete" className="h-5 w-5" />
                        Clear Workspace
                    </button>
                    <button
                        className="w-full flex flex-row gap-4 px-2 py-1 items-center justify-start bg-slate-50 hover:bg-slate-200 transition-colors duration-300">
                        <Icon icon="ic:round-delete" className="h-5 w-5" />
                        Save Workspace
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ContextMenu;