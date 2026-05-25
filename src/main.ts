import * as d3 from "d3";
import {importedData} from "./data.ts";
import Scrollama from "scrollama";
import type {ChartSeriesKey, ComparisonValue, CountrySummary, DataRow, StackedSeries} from "./types.ts";

const data = importedData;
const worldData = data.filter(d => d.entity === "World").sort((a, b) => a.year - b.year);
const countryData = data.filter(d => d.code && d.code.length === 3 && d.entity !== "World");
const latestYear = d3.max(countryData, d => d.year) ?? 2023;

const countryAlias: Record<string, string> = {
    USA: "United States",
    Brazil: "Brazil",
    China: "China",
    Austria: "Austria"
};

const priorityCountries = ["USA", "Brazil", "China", "Austria"];

function totalFor(d: DataRow) {
    return d.directHumanFood + d.directAnimalFeed + d.processed;
}

function makeCountrySummary(d: DataRow): CountrySummary {
    const total = totalFor(d);
    return {
        ...d,
        total,
        processedShare: total === 0 ? 0 : d.processed / total
    };
}

function getLatestCountryData(): CountrySummary[] {
    const latest = countryData.filter(d => d.year === latestYear);
    const summaries = latest.map(makeCountrySummary).filter(d => d.total > 0);

    const byCode = new Map(summaries.map(d => [d.code, d] as const));
    const prioritized = priorityCountries
        .map(code => byCode.get(code))
        .filter((d): d is CountrySummary => Boolean(d));

    const rest = summaries
        .filter(d => !priorityCountries.includes(d.code))
        .sort((a, b) => b.total - a.total)
        .slice(0, 35);

    return [...prioritized, ...rest];
}

const width = window.innerWidth;
const height = window.innerHeight;
const margin = {top: 56, right: 32, bottom: 48, left: 56};
const chartWidth = width - margin.left - margin.right;
const chartHeight = height - margin.top - margin.bottom;
const seriesHeight = Math.min(chartHeight * 0.72, 720);

const colors = {
    human: "#a78bfa",
    animal: "#fb923c",
    processed: "#ef4444"
} as const;

const svg = d3.select("#visualization")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("preserveAspectRatio", "xMidYMid slice");

const mainGroup = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// Create persistent chart layer that survives clearViz()
const chartLayer = mainGroup.append("g").attr("class", "chart-layer");

const xScale = d3.scaleLinear()
    .domain(d3.extent(worldData, d => d.year) as [number, number])
    .range([0, chartWidth]);

const yScale = d3.scaleLinear().range([seriesHeight, 0]);
const scroller = Scrollama();

function bootstrap() {
    svg.style("opacity", 1);
    d3.select("#visualization").selectAll(".bootstrap-message").remove();
    if (svg.selectAll("*").empty()) {
        d3.select("#visualization")
            .append("div")
            .attr("class", "bootstrap-message")
            .style("position", "absolute")
            .style("top", "16px")
            .style("left", "16px")
            .style("color", "#f0f0f0")
            .style("font", "14px/1.4 system-ui, sans-serif")
            .style("opacity", "0.7")
            .text("Loading Soy Paradox…");
    }
}

function showFrame(step: number) {
    const frameMap: Record<number, () => void> = {
        1: renderFrame1,
        2: renderFrame2,
        3: renderFrame3,
        4: renderFrame4,
        5: renderFrame5,
        6: renderFrame6,
        7: renderFrame7,
        8: renderFrame8,
        9: renderFrame9,
        10: renderFrame10,
        11: renderFrame11,
        12: renderFrame12
    };

    frameMap[step]?.();
}

function renderFrame1() {
    clearViz();
    setVizOpacity(1);
    d3.select(".step[data-step='1'] .step-content").html(`
    <h1>You think soy is a health food.</h1>
    <h1 style="opacity: 0.6; margin-top: 0.25rem;">So did we.</h1>
    <div class="scroll-cue">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10l5 5 5-5" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg>
      <p style="font-size: 0.8rem; margin-top: 0.5rem;">scroll</p>
    </div>
  `);
}

function renderFrame2() {
    clearViz();
    d3.select(".step[data-step='2'] .step-content").html(`
    <h2>Soybeans became a symbol of clean eating.</h2>
    <div class="icon-grid">
      <div class="icon-item"><div class="icon">◻</div><div class="icon-label">tofu</div></div>
      <div class="icon-item"><div class="icon">◠</div><div class="icon-label">soy milk</div></div>
      <div class="icon-item"><div class="icon">●●●</div><div class="icon-label">edamame</div></div>
    </div>
    <p style="margin-top: 2rem;">Vegan. Sustainable. Healthy.</p>
  `);
}

function renderFrame3() {
    clearViz();
    setVizOpacity(1);
    d3.select(".step[data-step='3'] .step-content").html(`
    <h2>But where does soy actually go?</h2>
    <p style="margin-top: 1rem; opacity: 0.6;">This is where curiosity transitions into evidence.</p>
  `);
    drawChartAxes();
    drawLegend();
}

function renderFrame4() {
    setVizOpacity(1);
    d3.select(".step[data-step='4'] .step-content").html(`<p>Some of it reaches your plate.</p>`);
    drawStackedChart({visible: ["human"]});
}

function renderFrame5() {
    setVizOpacity(1);
    d3.select(".step[data-step='5'] .step-content").html(`<p>Much more feeds livestock.</p>`);
    drawStackedChart({visible: ["human", "animal"]});
}

function renderFrame6() {
    clearViz();
    setVizOpacity(1);
    const totalSoy = d3.sum(worldData, d => totalFor(d));
    const industrialTotal = d3.sum(worldData, d => d.processed);
    const percentage = totalSoy === 0 ? 0 : Math.round((industrialTotal / totalSoy) * 100);

    d3.select(".step[data-step='6'] .step-content").html(`
    <div class="wow-stat" style="position: relative; z-index: 2;">
      <p style="opacity: 0.7; font-size: 0.95rem; margin-bottom: 1rem;">The shocking reality:</p>
      <div class="stat-value" id="percentage-counter">0%</div>
      <p class="stat-label">of global soy is never eaten directly by humans</p>
      <p style="margin-top: 1.5rem; opacity: 0.6; font-size: 0.95rem;">It becomes feed, fuel, and industrial products.</p>
    </div>
  `);

    animateCounter(document.getElementById("percentage-counter"), percentage);
    drawStackedChart({visible: ["human", "animal", "processed"], background: true, emphasis: true});
}

function renderFrame7() {
    d3.select(".step[data-step='7'] .step-content").html(`
    <h2>The hidden food chain isn’t invisible anymore.</h2>
    <p style="margin-top: 2rem;">And this pattern repeats across the world.</p>
  `);
    setVizOpacity(0.18);
}

function renderFrame8() {
    d3.select(".step[data-step='8'] .step-content").html(`
    <h2>Every rectangle is a country.</h2>
    <p style="margin-top: 1rem; opacity: 0.7;">Size shows total soy consumption.</p>
    <p style="margin-top: 1rem; opacity: 0.6; font-size: 0.95rem;">Color reveals how soy is used.</p>
  `);
    setVizOpacity(1);
    drawTreemap(getLatestCountryData(), 0.4);
}

function renderFrame9() {
    d3.select(".step[data-step='9'] .step-content").html(`
    <h2>Even the world’s biggest consumers follow the same pattern.</h2>
  `);
    setVizOpacity(1);
    drawTreemap(getLatestCountryData(), 1, priorityCountries);
}

function renderFrame10() {
    d3.select(".step[data-step='10'] .step-content").html(`
    <h2>Compare two countries.</h2>
    <div class="controls">
      <div class="control-group">
        <label class="control-label" for="country1-select">Country 1</label>
        <select id="country1-select">
          <option value="Brazil" selected>Brazil</option>
          <option value="Austria">Austria</option>
          <option value="USA">USA</option>
          <option value="China">China</option>
        </select>
      </div>
      <div class="control-group">
        <label class="control-label" for="country2-select">Country 2</label>
        <select id="country2-select">
          <option value="Austria" selected>Austria</option>
          <option value="Brazil">Brazil</option>
          <option value="USA">USA</option>
          <option value="China">China</option>
        </select>
      </div>
    </div>
    <div class="comparison-container" id="comparison-container"></div>
  `);

    setVizOpacity(1);
    const bind = () => updateComparison();
    document.getElementById("country1-select")?.addEventListener("change", bind);
    document.getElementById("country2-select")?.addEventListener("change", bind);
    updateComparison();
}

function renderFrame11() {
    d3.select(".step[data-step='11'] .step-content").html(`<p>Different countries. Same system.</p>`);
    setVizOpacity(1);
    updateComparison();
}

function renderFrame12() {
    clearViz();
    d3.select(".step[data-step='12'] .step-content").html(`
    <h1>The soy paradox isn’t the exception.</h1>
    <h1 style="opacity: 0.6; margin-top: 1rem;">It’s the system.</h1>
    <div class="credits" style="margin-top: 3rem;">
      <p>Data source: Our World in Data</p>
      <p style="margin-top: 0.5rem; font-size: 0.75rem;">Built with D3.js and Scrollama</p>
      <button class="restart-button" type="button" onclick="window.scrollTo({top: 0, behavior: 'smooth'})">↻ Start Over</button>
    </div>
  `);
}

function clearViz() {
    chartLayer.selectAll("*").remove();
}

function setVizOpacity(opacity: number) {
    svg.style("opacity", opacity);
}

function drawChartAxes() {
    const humanMax = d3.max(worldData, d => d.directHumanFood) ?? 0;
    const axisY = d3.axisLeft(yScale).tickFormat(d3.format(".0s"));
    const axisX = d3.axisBottom(xScale).tickValues([1961, 2023]).tickFormat(d3.format("d"));

    yScale.domain([0, humanMax]);
    chartLayer.selectAll("g.axis").remove();

    chartLayer.append("g")
        .attr("class", "axis x-axis active")
        .attr("transform", `translate(0,${seriesHeight})`)
        .call(axisX as any);

    chartLayer.append("g")
        .attr("class", "axis y-axis active")
        .call(axisY as any);
}

function drawLegend() {
    const items = [
        {label: "Human Food", color: colors.human},
        {label: "Animal Feed", color: colors.animal},
        {label: "Processed Uses", color: colors.processed}
    ];

    const legend = chartLayer.selectAll<SVGGElement, null>("g.legend-wrap")
        .data([null])
        .join("g")
        .attr("class", "legend-wrap")
        .attr("transform", `translate(${chartWidth / 2 - 180},${seriesHeight + 54})`);

    const itemsJoin = legend.selectAll<SVGGElement, { label: string; color: string }>("g.legend-item")
        .data(items, d => d.label)
        .join(enter => {
            const g = enter.append("g").attr("class", "legend-item active");
            g.append("rect").attr("width", 12).attr("height", 12).attr("rx", 2);
            g.append("text").attr("x", 18).attr("y", 10).attr("fill", "#f0f0f0").attr("font-size", 12).attr("opacity", 0.72);
            return g;
        });

    itemsJoin
        .attr("transform", (_d, i) => `translate(${i * 180},0)`)
        .select("rect")
        .attr("fill", d => d.color);

    itemsJoin.select("text").text(d => d.label);
}

function drawStackedChart(options: { visible: ChartSeriesKey[]; background?: boolean; emphasis?: boolean }) {
    clearViz();
    drawChartAxes();
    drawLegend();

    const keys = options.visible;
    const stackData = worldData.map(d => ({
        year: d.year,
        human: d.directHumanFood,
        animal: d.directAnimalFeed,
        processed: d.processed
    }));

    const seriesConfig: StackedSeries[] = keys.map(key => ({
        key,
        values: stackData.map(d => ({year: d.year, value: d[key]}))
    }));
    const maxTotal = d3.max(stackData, d => keys.reduce((sum, key) => sum + d[key], 0)) ?? 0;
    yScale.domain([0, maxTotal]);

    chartLayer.selectAll<SVGGElement, null>("g.y-axis")
        .call(d3.axisLeft(yScale).tickFormat(d3.format(".0s")) as any);

    const cumulative = (index: number, dataIndex: number) =>
        seriesConfig.slice(0, index).reduce((sum, series) => sum + series.values[dataIndex].value, 0);

    chartLayer.selectAll<SVGPathElement, StackedSeries>("path.band")
        .data(seriesConfig, (d: any) => d.key)
        .join("path")
        .attr("class", d => `band band-${d.key}`)
        .attr("fill", d => colors[d.key])
        .attr("opacity", d => options.background ? (d.key === "processed" && options.emphasis ? 0.72 : 0.38) : 1)
        .attr("d", d => {
            const area = d3.area<{ year: number; value: number }>()
                .x(p => xScale(p.year))
                .y0((_, i) => yScale(cumulative(keys.indexOf(d.key), i)))
                .y1((p, i) => yScale(cumulative(keys.indexOf(d.key), i) + p.value));
            return area(d.values) ?? "";
        });
}

function drawTreemap(source: CountrySummary[], opacity: number, highlightCountries: string[] = []) {
    clearViz();

    const root = d3.hierarchy<{ children: CountrySummary[] }>({children: source})
        .sum((d: any) => (d.total ?? 0))
        .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

    const treemap = d3.treemap<{ children: CountrySummary[] }>()
        .size([chartWidth, seriesHeight])
        .paddingInner(2)
        .paddingOuter(2);

    treemap(root);

    const nodes = root.leaves() as unknown as d3.HierarchyRectangularNode<CountrySummary>[];
    const color = d3.scaleLinear<string>().domain([0, 1]).range([colors.human, colors.processed]).interpolate(d3.interpolateRgb);

    const node = chartLayer.selectAll<SVGGElement, d3.HierarchyRectangularNode<CountrySummary>>("g.treemap-node")
        .data(nodes, d => d.data.code)
        .join(enter => {
            const g = enter.append("g").attr("class", "treemap-node");
            g.append("rect");
            g.append("text");
            return g;
        });

    node.attr("transform", d => `translate(${d.x0},${d.y0})`)
        .attr("opacity", d => highlightCountries.length ? (highlightCountries.includes(d.data.code) ? 1 : 0.28) : opacity);

    node.select("rect")
        .attr("width", d => Math.max(0, d.x1 - d.x0))
        .attr("height", d => Math.max(0, d.y1 - d.y0))
        .attr("fill", d => color(d.data.processedShare))
        .attr("stroke", "rgba(0,0,0,0.12)")
        .attr("stroke-width", 1);

    node.select("text")
        .attr("x", 8)
        .attr("y", 18)
        .attr("fill", "white")
        .attr("font-size", 11)
        .attr("font-weight", 600)
        .text(d => {
            const label = countryAlias[d.data.code] ?? d.data.entity;
            return (d.x1 - d.x0) > 48 && (d.y1 - d.y0) > 22 ? label : "";
        });
}

function animateCounter(element: HTMLElement | null, finalValue: number) {
    if (!element) return;
    const duration = 1800;
    const start = performance.now();
    const tick = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        element.textContent = `${Math.round(finalValue * (1 - Math.pow(1 - t, 3)))}%`;
        if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
}

function getSelectedCountryValues(code: string) {
    const row = countryData
        .filter(d => d.year === latestYear && d.code === code)
        .map(makeCountrySummary)[0];
    return row ?? null;
}

function updateComparison() {
    const container = d3.select("#comparison-container");
    if (container.empty()) return;

    const country1 = (document.getElementById("country1-select") as HTMLSelectElement | null)?.value ?? "Brazil";
    const country2 = (document.getElementById("country2-select") as HTMLSelectElement | null)?.value ?? "Austria";
    const rows = [getSelectedCountryValues(country1), getSelectedCountryValues(country2)].filter((d): d is CountrySummary => Boolean(d));

    const cards = container.selectAll<HTMLDivElement, CountrySummary>("div.comparison-card")
        .data(rows, d => d.code)
        .join(enter => {
            const card = enter.append("div").attr("class", "comparison-card");
            card.append("h3");
            card.append("div").attr("class", "comparison-meta");
            const bars = card.append("div").attr("class", "comparison-bars");
            ["human", "animal", "industrial"].forEach(key => {
                const bar = bars.append("div").attr("class", "comparison-bar");
                bar.append("div").attr("class", "comparison-bar-label");
                bar.append("div").attr("class", `comparison-bar-fill fill-${key}`);
            });
            return card;
        });

    cards.select("h3").text(d => countryAlias[d.code] ?? d.entity);
    cards.select(".comparison-meta").text(d => `${latestYear} · ${d3.format(",.0f")(d.total)} tonnes`);

    cards.each(function (d) {
        const total = d.total || 1;
        const values: ComparisonValue[] = [
            {key: "human", label: "Human food", value: d.directHumanFood, pct: (d.directHumanFood / total) * 100},
            {key: "animal", label: "Animal feed", value: d.directAnimalFeed, pct: (d.directAnimalFeed / total) * 100},
            {key: "processed", label: "Industrial", value: d.processed, pct: (d.processed / total) * 100}
        ];

        d3.select(this)
            .selectAll<HTMLDivElement, ComparisonValue>(".comparison-bar")
            .data(values, (v: ComparisonValue) => v.key)
            .join("div")
            .attr("class", "comparison-bar")
            .each(function (v) {
                const row = d3.select(this);
                row.selectAll<HTMLDivElement, ComparisonValue>(".comparison-bar-label")
                    .data([v])
                    .join("div")
                    .attr("class", "comparison-bar-label")
                    .text(v.label);

                row.selectAll<HTMLDivElement, ComparisonValue>(".comparison-bar-fill")
                    .data([v])
                    .join("div")
                    .attr("class", `comparison-bar-fill fill-${v.key}`)
                    .style("width", `${Math.max(8, v.pct)}%`)
                    .text(`${v.pct.toFixed(0)}%`);
            });
    });
}

scroller
    .setup({step: ".step", offset: 0.5, progress: true})
    .onStepEnter((response: any) => {
        const stepNum = Number(response.element.dataset.step);
        showFrame(stepNum);
    });

window.addEventListener("resize", () => {
    scroller.resize();
});

bootstrap();
showFrame(1);
