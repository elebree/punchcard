import type { IDataRetriever } from "../types/IDataRetriever";

// GitHub data retriever
export class GithubDataRetriever implements IDataRetriever {
    handleOpen(resource: string): void {
        const ensuredResource = this.ensureResource(resource);
        if (!ensuredResource) {
            throw new Error("Invalid resource format. Expected 'username/repo'");
        }
        const url = `https://github.com/${ensuredResource}`;
        window.open(url, "_blank");
    }

    ensureResource(url: string): string | null {
        const resourceRegex = /^([^/]+)\/([^/]+)$/;
        if (resourceRegex.test(url))
            return url;

        const regex = /^https:\/\/github\.com\/([^/]+)\/([^/]+)/;
        const match = url.match(regex);
        if (match) {
            const username = match[1];
            const repoName = match[2];
            return `${username}/${repoName}`;
        }
        return null;
    }

    async fetchData(resource: string): Promise<number[][]> {
        const ensuredResource = this.ensureResource(resource);
        if (!ensuredResource) {
            throw new Error("Invalid resource format. Expected 'username/repo'");
        }

        const res = await fetch(
            `https://api.github.com/repos/${ensuredResource}/stats/punch_card`
        );
        if (!res.ok) throw new Error(`Failed to fetch ${ensuredResource}`);
        return await res.json();
    }
}
