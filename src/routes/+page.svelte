<script lang="ts">
  import html2canvas from "html2canvas";
  import { onMount } from "svelte";
  import Tags from "svelte-tags-input";
  import PunchCard from "../components/PunchCard.svelte";
  let vertical = false;
  let selectedRepos: string[] = [];
  let punchCardData = new Map<string, number>();
  const repoPunchCardCache = new Map<string, number[][]>();
  let punchCardWrapper: HTMLElement;

  const generatePunchCardData = (randomize: boolean = false) =>
    new Map(
      Array.from({ length: 24 * 7 }, (_, i) => [
        `${Math.floor(i / 24)}-${i % 24}`,
        randomize ? (Math.random() > 0.95 ? Math.random() : 0) : 0,
      ])
    );

  const emptyPunchCardData = () => generatePunchCardData();
  const randomPunchCardData = () => generatePunchCardData(true);

  function normalizeRepoInput(input: string): string | null {
    const trimmed = input.trim().replace(/^https:\/\/github\.com\//, "");
    const parts = trimmed.split("/");
    return parts.length >= 2 ? `${parts[0]}/${parts[1]}` : null;
  }

  function updateQueryString() {
    const params = new URLSearchParams(window.location.search);
    selectedRepos.length
      ? params.set("repo", selectedRepos.join(","))
      : params.delete("repo");
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    history.replaceState(null, "", newUrl);
  }

  async function addRepo() {
    const el = document.getElementsByName(
      "svelte-tags-input"
    )[0] as HTMLInputElement;
    el.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "Enter",
        code: "Enter",
        keyCode: 13,
        which: 13,
        bubbles: true,
      })
    );
  }

  async function exportPNG() {
    if (!punchCardWrapper) return;
    const canvas = await html2canvas(punchCardWrapper);
    const link = document.createElement("a");
    link.download = `punchcard_${selectedRepos.map((v) => v.replaceAll("/", "-")).join("_")}.png`;
    link.href = canvas.toDataURL();
    link.click();
  }
  async function fetchRepoPunchCard(
    owner: string,
    repo: string
  ): Promise<number[][]> {
    const key = `${owner}/${repo}`;
    if (repoPunchCardCache.has(key)) return repoPunchCardCache.get(key)!;

    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/stats/punch_card`
    );
    if (!res.ok) throw new Error(`Failed to fetch ${key}`);

    const data = await res.json();
    repoPunchCardCache.set(key, data);
    return data;
  }

  async function updatePunchCardData() {
    const combinedMap = emptyPunchCardData();

    const fetchPromises = selectedRepos.map(async (repo) => {
      const [owner, name] = repo.split("/");
      if (!owner || !name) return;

      try {
        let rawData: number[][];

        if (repoPunchCardCache.has(`${owner}/${name}`)) {
          rawData = repoPunchCardCache.get(`${owner}/${name}`)!;
        } else {
          rawData = await fetchRepoPunchCard(owner, name);
        }

        for (const [day, hour, commits] of rawData) {
          const mapKey = `${day}-${hour}`;
          const prev = combinedMap.get(mapKey) || 0;
          combinedMap.set(mapKey, prev + commits);
        }
      } catch (err) {
        console.error(`Failed to fetch data for ${repo}`, err);
      }
    });

    await Promise.all(fetchPromises);
    punchCardData = combinedMap;
  }

  function handleResize() {
    vertical = window.innerWidth * 1.5 < window.innerHeight;
  }

  function handleTagAdd(tag: string) {
    const normalized = normalizeRepoInput(tag);
    if (!normalized) return;
    selectedRepos = [...selectedRepos.filter((v) => v !== tag), normalized];
    updateQueryString();
    updatePunchCardData();
  }

  function handleTagRemove() {
    updateQueryString();
    updatePunchCardData();
  }

  function handleTagClick(tag: string) {
    const githubUrl = `https://github.com/${tag}`;
    window.open(githubUrl, "_blank");
  }

  function handleRepoLinkClick(
    e: MouseEvent & {
      currentTarget: EventTarget & HTMLAnchorElement;
    }
  ) {
    e.preventDefault();
    handleTagAdd(e.currentTarget.href);
  }

  onMount(() => {
    handleResize();
    const params = new URLSearchParams(window.location.search);
    const repoParam = params.get("repo") || "";
    const tags = repoParam.split(",").filter(Boolean);
    selectedRepos = Array.from(
      new Set(tags.map(normalizeRepoInput).filter(Boolean) as string[])
    );
    updatePunchCardData();

    const interval = setInterval(() => {
      if (!selectedRepos || selectedRepos.length === 0)
        punchCardData = randomPunchCardData();
    }, 2000);

    // Add drag & drop listener
    window.addEventListener("dragover", (e) => {
      e.preventDefault();
    });

    window.addEventListener("drop", (e) => {
      e.preventDefault();
      const data = e.dataTransfer?.getData("text/plain")?.trim();
      if (!data) return;
      const normalized = normalizeRepoInput(data);
      if (normalized && !selectedRepos.includes(normalized)) {
        selectedRepos = [...selectedRepos, normalized];
        updateQueryString();
        updatePunchCardData();
      }
    });

    return () => {
      clearInterval(interval);
    };
  });
</script>

<svelte:window on:resize={handleResize} />
<div class="main-container">
  <div class="inner-container">
    <h1>GitHub PunchCard</h1>
    <div class="punchcard-container">
      <div class="repo-input">
        <Tags
          class="tags-input"
          bind:tags={selectedRepos}
          placeholder="GitHub owner/repo or full URL"
          onlyUnique
          onTagAdded={handleTagAdd}
          onTagRemoved={handleTagRemove}
          onTagClick={handleTagClick}
        />
        <button class="button-add" on:click={addRepo} aria-label="Add Repo"
          >Add Repo</button
        >
        <button class="button-png" on:click={exportPNG} aria-label="Export PNG">
          <svg
            class="icon"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 -256 1792 1792"
            ><path
              d="M1339 729q17-41-14-70L877 211q-18-19-45-19t-45 19L339 659q-31 29-14 70 17 39 59 39h256v448q0 26 19 45t45 19h256q26 0 45-19t19-45V768h256q42 0 59-39zm293-217q14 0 23-9t9-23V-96q0-14-9-23t-23-9H32q-14 0-23 9T0-96v576q0 14 9 23t23 9h192q14 0 23-9t9-23V128h1152v352q0 14 9 23t23 9h192z"
              style="fill:currentColor"
              transform="matrix(1 0 0 -1 68 1232)"
            /></svg
          >
        </button>
      </div>
      <div
        bind:this={punchCardWrapper}
        class={`punchcard-wrapper ${vertical ? "punchcard-wrapper-v" : "punchcard-wrapper-h"}`}
      >
        <PunchCard data={punchCardData} {vertical} />
      </div>
    </div>
    <p>
      This tool visualizes <b>GitHub</b> commit activity as a punch card — showing
      when work happens across days of the week and hours of the day.
    </p>
    <p>
      Just type a repository name like <a
        href="https://github.com/sveltejs/svelte"
        on:click={handleRepoLinkClick}><b>sveltejs/svelte</b></a
      >, paste a full
      <b>GitHub</b> URL, or simply drag and drop the link onto the page. Add more
      than one repo to see combined activity. The chart can be exported as a PNG
      or you can share the result just by copying the URL.
    </p>
    <p>
      Made with ❤️ by <a href="https://github.com/vnau/punchcard"><b>vnau</b></a
      >.
    </p>
  </div>
</div>

<style>
  .main-container {
    min-height: 100vh;
    display: grid;
    place-items: start center; /* vertically top by default */
    padding: 2rem;
    box-sizing: border-box;
    max-width: 800px;
    margin: auto;
  }

  .inner-container {
    margin: auto 0; /* pushes to center if there's room */
    max-width: 800px;
    width: 100%;
    padding: 15pt;
    border-radius: 16px;
    border: 1px #00000026 solid;
    box-shadow: 0px 24px 24px rgba(0, 0, 0, 0.03);
  }

  a {
    text-decoration: none;
  }
  h1 {
    margin-top: 0;
    color: #de004a;
    font-size: 1.5rem;
  }

  .punchcard-wrapper-h {
    margin: 1em auto auto auto;
  }

  .punchcard-wrapper-v {
    margin: 1em 5% auto 5%;
  }

  button:hover {
    background-color: rgb(229 231 235);
    border: solid 1px #bbb;
  }

  .repo-input {
    display: flex;
    width: 100%;

    :global(.svelte-tags-input-layout:focus-within) {
      outline-color: #de004a;
    }

    :global(.svelte-tags-input-layout) {
      flex: 1;
      border-right: none;
      border-radius: 0.15rem 0 0 0.15rem;
    }

    :global(.svelte-tags-input-layout .svelte-tags-input-tag) {
      cursor: default;
    }
  }

  .button-add {
    border-radius: 0 0.15rem 0.15rem 0;
  }

  .button-png {
    margin-left: 5px;
  }

  button {
    padding: 8px;
    background-color: rgb(243 244 246);
    border-radius: 0.15rem;
    border: solid 1px #ccc;
    cursor: pointer;
  }

  svg.icon {
    width: 1em;
  }

  :global(.svelte-tags-input-tag::before) {
    content: "";
    display: inline-block;
    width: 1.4em;
    height: 1.4em;
    fill: white;
    margin-right: 0.2em;
    background-image: url("github.svg");
    background-size: contain;
    background-repeat: no-repeat;
    vertical-align: middle;
  }
</style>
