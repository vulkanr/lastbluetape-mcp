export declare function createList(input: {
    title: string;
    description?: string;
    creator_name: string;
    creator_email?: string;
}): Promise<unknown>;
export declare function listMyLists(): Promise<unknown>;
export declare function getList(input: {
    list_id: string;
}): Promise<unknown>;
export declare function listItems(input: {
    list_id: string;
}): Promise<unknown>;
export declare function addItem(input: {
    list_id: string;
    title: string;
    description?: string;
}): Promise<unknown>;
export declare function updateItem(input: {
    list_id: string;
    item_id: string;
    title?: string;
    description?: string;
}): Promise<unknown>;
export declare function setItemStatus(input: {
    list_id: string;
    item_id: string;
    status: "open" | "in_progress" | "done";
}): Promise<unknown>;
export declare function flagItem(input: {
    list_id: string;
    item_id: string;
    flagged: boolean;
}): Promise<unknown>;
export declare function getActivity(input: {
    list_id: string;
    limit?: number;
}): Promise<unknown>;
export declare function upgradeList(input: {
    list_id: string;
}): Promise<unknown>;
//# sourceMappingURL=client.d.ts.map