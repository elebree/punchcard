import type { IDataRetriever } from "../types/IDataRetriever";

// Wikipedia data retriever
export class WikipediaDataRetriever implements IDataRetriever {
    handleOpen(resource: string): void {
        // Open the Wikipedia user contributions page in a new tab
        const ensuredResource = this.ensureResource(resource);
        if (!ensuredResource) {
            throw new Error("Invalid resource format. Expected 'username@host'");
        }
        const [username, host] = ensuredResource.split("@");
        const url = `https://${host}/wiki/Special:Contributions/${encodeURIComponent(username)}`;
        window.open(url, "_blank");
    }

    ensureResource(url: string): string | null {
        const resourceRegex = /^([^@]+)@([a-z]{2,3}\.wikipedia\.org)$/;
        if (resourceRegex.test(url))
            return url;

        const regex =
            /https?:\/\/([a-z]{2,3}\.wikipedia\.org)\/[a-z]+\/[^:]*:([A-Za-z0-9_%\-\.\_]+)/;
        const match = url.match(regex);
        if (match) {
            const host = match[1];
            const user = decodeURIComponent(match[2]);
            return `${user}@${host}`;
        }
        return null;
    }

    fetchData(resource: string): Promise<number[][]> {
        const ensuredResource = this.ensureResource(resource);
        if (!ensuredResource) {
            throw new Error("Invalid resource format. Expected 'username@host'");
        }
        const [username, host] = ensuredResource.split("@");

        return new Promise((resolve, reject) => {
            const callbackName = `jsonpCallback_${Date.now()}`;
            (window as any)[callbackName] = (data: any) => {
                delete (window as any)[callbackName];
                document.body.removeChild(scriptTag);

                if (!data || !data.query || !data.query.usercontribs) {
                    reject(new Error("Failed to fetch contributions or no data available."));
                    return;
                }

                const contributions = data.query.usercontribs;
                const result: number[][] = [];
                contributions.forEach((contrib: any) => {
                    const timestamp = new Date(contrib.timestamp);
                    const dayOfWeek = timestamp.getDay();
                    const hour = timestamp.getHours();
                    result.push([dayOfWeek, hour, 1]);
                });

                resolve(result);
            };

            const url = `https://${host}/w/api.php?action=query&list=usercontribs&ucuser=${encodeURIComponent(username)}&ucnamespace=0&format=json&ucprop=timestamp&uclimit=500&callback=${callbackName}`;
            const scriptTag = document.createElement("script");
            scriptTag.src = url;
            document.body.appendChild(scriptTag);
        });
    }
}