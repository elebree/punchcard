import type { IDataRetriever } from "../types/IDataRetriever";
import { GithubDataRetriever } from "./GithubDataRetriever";
import { WikipediaDataRetriever } from "./WikipediaDataRetriever";

export class DataRetriever implements IDataRetriever {
    private retrievers: IDataRetriever[] = [
        new GithubDataRetriever(),
        new WikipediaDataRetriever()
    ];

    handleOpen(resource: string): void {
        const retriever = this.getRetrieverForResource(resource);
        retriever.handleOpen(resource);

    }

    ensureResource(resource: string): string | null {
        try {
            const retriever = this.getRetrieverForResource(resource);
            return retriever.ensureResource(resource);
        } catch (error) {
            console.error("Error ensuring resource:", error);
            return null;
        }
    }

    public fetchData(resource: string): Promise<number[][]> {
        const retriever = this.getRetrieverForResource(resource);
        return retriever.fetchData(resource);
    }

    private getRetrieverForResource(resource: string): IDataRetriever {
        if (!resource) {
            throw new Error("Resource cannot be empty");
        }
        for (const retriever of this.retrievers) {
            if (retriever.ensureResource(resource)) {
                return retriever;
            }
        }
        throw new Error("Unknown resource format.");
    }
}