<script lang="ts">
  export let data: Map<string, number>;
  export let vertical: boolean = false;

  const maxRadius = 12;
  const minRadius = 2;
  const gridMax = "7-24";

  const days = new Array(7).fill(0).map((x, i) =>
    new Date(1, 3, i).toLocaleString("en", {
      weekday: "short",
    })
  );

  $: svgWidth = netX(vertical, gridMax);
  $: svgHeight = netY(vertical, gridMax);
  $: maxCommits = data?.values
    ? Math.max(...Array.from(data.values()), 0)
    : 100;
  $: commitRatio = maxCommits > 0 ? 1 / maxCommits : 0;

  const radius = (commits: number) =>
    commits === 0 || maxCommits === 0
      ? 0
      : minRadius + commits * commitRatio * (maxRadius - minRadius);

  const color = (commits: number) => {
    const lightness = 90 - commits * commitRatio * 60;
    return `hsl(340, 100%, ${lightness}%)`;
  };

  function parseEntry(entry: string): [number, number] {
    const [v0, v1] = entry.split("-").map((v) => (isNaN(+v) ? 0 : +v + 1));
    return [v0, v1];
  }

  function netX(vert: boolean, entry: string) {
    const [v0, v1] = parseEntry(entry);
    return vert ? v0 * 40 : v1 * 30;
  }

  function netY(vert: boolean, entry: string) {
    const [v0, v1] = parseEntry(entry);
    return vert ? v1 * 30 : v0 * 30;
  }
</script>

<svg
  width={svgWidth}
  height={svgHeight}
  viewBox={`0 0 ${svgWidth} ${svgHeight}`}
>
  {#each days as label, d}
    {#key `v-${d}`}
      <text
        x={netX(vertical, `${d}-x`)}
        y={netY(vertical, `${d}-x`) + (vertical ? 15 : 5)}>{label}</text
      >
      <line
        x1={netX(vertical, `${d}-0`)}
        y1={netY(vertical, `${d}-0`)}
        x2={netX(vertical, `${d}-24`)}
        y2={netY(vertical, `${d}-24`)}
      />
    {/key}
  {/each}

  {#each Array(24) as _, h}
    {#key `h-${h}`}
      <text
        x={netX(vertical, `x-${h}`)}
        y={netY(vertical, `x-${h}`) + (vertical ? 5 : 15)}>{h}</text
      >
      <line
        x1={netX(vertical, `0-${h}`)}
        y1={netY(vertical, `0-${h}`)}
        x2={netX(vertical, `7-${h}`)}
        y2={netY(vertical, `7-${h}`)}
      />
    {/key}
  {/each}

  {#each data as entry}
    {#key entry[0]}
      <circle
        cx={netX(vertical, entry[0])}
        cy={netY(vertical, entry[0])}
        r={radius(entry[1])}
        fill={color(entry[1])}
      />
    {/key}
  {/each}
</svg>

<style>
  circle {
    transform-box: fill-box;
    transform-origin: center;

    -webkit-transition: ease 0.7s all;
    -moz-transition: ease 0.7s all;
    -ms-transition: ease 0.7s all;
    -o-transition: ease 0.7s all;
    transition: ease 0.7s all;
  }

  text {
    font-weight: 400;
    font-size: 10pt;
    fill: var(--label);
  }

  line {
    stroke: lightgray;
    stroke-width: 1;
  }

  svg {
    width: 100%;
    height: auto;
  }
</style>
