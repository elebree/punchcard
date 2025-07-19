export interface IDataRetriever {
    ensureResource(resource: string): string | null;
    fetchData(resource: string): Promise<number[][]>;
    handleOpen(resource: string): void;
}