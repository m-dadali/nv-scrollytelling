import * as d3 from "d3";
import {importedData} from "./data.ts";
import Scrollama from "scrollama";
import type {ChartSeriesKey, ComparisonValue, CountrySummary, DataRow, StackedSeries} from "./types.ts";

const data = importedData;
const worldData = data.filter(d => d.entity === "World").sort((a, b) => a.year - b.year);
const countryData = data.filter(d => d.code && d.code.length === 3 && d.entity !== "World");
const latestYear = d3.max(countryData, d => d.year) ?? 2023;
let selectedAreaYear = latestYear;
let selectedTreemapYear = latestYear;

const countryAlias: Record<string, string> = {
    USA: "United States",
    BRA: "Brazil",
    CHN: "China",
    AUT: "Austria"
};

const priorityCountries = ["USA", "BRA", "CHN", "AUT"];

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
    const latest = countryData.filter(d => d.year === selectedTreemapYear);
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
const seriesHeight = chartHeight;

const colors = {
    human: "#4db68b",
    animal: "#dfa430",
    processed: "#d55b96"
} as const;

const svg = d3.select("#visualization")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("preserveAspectRatio", "xMidYMid meet");

const mainGroup = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

const chartLayer = mainGroup.append("g").attr("class", "chart-layer");

const xScale = d3.scaleLinear()
    .domain(d3.extent(worldData, d => d.year) as [number, number])
    .range([0, chartWidth]);

const yScale = d3.scaleLinear().range([seriesHeight, 0]);
const scroller = Scrollama();

function bootstrap() {
    svg.style("opacity", 1);
    d3.select("#visualization").selectAll(".bootstrap-message").remove();
    // Loading message removed for cleaner start

    if (d3.select("#area-year-picker").empty()) {
        const yearOptions = Array.from(new Set(worldData.map(d => d.year)))
            .sort((a, b) => b - a)
            .map(y => `<option value="${y}">${y}</option>`).join('');

        d3.select("#visualization")
            .append("div")
            .attr("id", "area-year-picker")
            .style("position", "absolute")
            .style("top", "24px")
            .style("right", "32px")
            .style("display", "none")
            .style("z-index", "20")
            .style("pointer-events", "auto")
            .html(`
                <label for="area-year-select" style="color: var(--text-dark); margin-right: 0.5rem; font-size: 0.9rem; font-weight: 500;">Timeline up to:</label>
                <select id="area-year-select" style="padding: 0.4rem; border-radius: 4px; background: rgba(220,218,211,0.7); color: var(--text-dark); border: 1px solid rgba(0,0,0,0.1);">
                    ${yearOptions}
                </select>
            `);

        document.getElementById("area-year-select")?.addEventListener("change", (e) => {
            selectedAreaYear = Number((e.target as HTMLSelectElement).value);
            const currentStep = document.querySelector(".step.is-active")?.getAttribute("data-step") || "4";
            showFrame(Number(currentStep));
        });
    }

    if (d3.select("#comparison-overlay").empty()) {
        const uniqueCountries = new Map();
        countryData.forEach(d => {
            if (!uniqueCountries.has(d.code)) uniqueCountries.set(d.code, d.entity);
        });
        const allCountries = Array.from(uniqueCountries.entries()).map(([code, entity]) => ({code, entity})).sort((a, b) => a.entity.localeCompare(b.entity));
        const optionsHtml = `<option value="" disabled selected>Select a country</option>` + 
            allCountries.map(c => `<option value="${c.code}">${countryAlias[c.code] ?? c.entity}</option>`).join('');

        const treemapYearOptions = Array.from(new Set(countryData.map(d => d.year)))
            .sort((a, b) => b - a)
            .map(y => `<option value="${y}">${y}</option>`).join('');

        const overlay = d3.select("#visualization")
            .append("div")
            .attr("id", "comparison-overlay")
            .style("position", "absolute")
            .style("top", "0")
            .style("left", "0")
            .style("width", "100%")
            .style("height", "100%")
            .style("display", "none")
            .style("flex-direction", "column")
            .style("align-items", "center")
            .style("justify-content", "space-around")
            .style("padding", "24px 0")
            .style("gap", "1.5rem")
            .style("overflow-y", "auto")
            .style("z-index", "10")
            .style("pointer-events", "none");

        overlay.html(`
            <div class="controls" style="pointer-events: auto; background: rgba(220,218,211,0.6); backdrop-filter: blur(8px); padding: 0.6rem 0.75rem; border-radius: 8px; border: 1px solid rgba(255,255,255,0.25); box-shadow: 0 8px 24px rgba(0,0,0,0.04);">
              <div class="control-group">
                <label class="control-label" for="treemap-year-select">Year</label>
                <select id="treemap-year-select">
                  ${treemapYearOptions}
                </select>
              </div>
              <div class="control-group">
                <label class="control-label" for="country1-select">Country 1</label>
                <select id="country1-select">
                  ${optionsHtml}
                </select>
              </div>
              <div class="control-group">
                <label class="control-label" for="country2-select">Country 2</label>
                <select id="country2-select">
                  ${optionsHtml}
                </select>
              </div>
            </div>
            <div class="comparison-container" id="comparison-container" style="pointer-events: auto; width: 100%; max-width: 900px; padding: 0 2rem;"></div>
        `);

        const bind = () => updateComparison();
        document.getElementById("country1-select")?.addEventListener("change", bind);
        document.getElementById("country2-select")?.addEventListener("change", bind);
        
        document.getElementById("treemap-year-select")?.addEventListener("change", (e) => {
            selectedTreemapYear = Number((e.target as HTMLSelectElement).value);
            drawTreemap(getLatestCountryData(), 1);
            updateComparison();
        });
    }
}

function showFrame(step: number) {
    d3.select("#area-year-picker").style("display", [4, 5, 6, 7].includes(step) ? "block" : "none");
    
    if (step < 13) {
        d3.select("#austria-chart").style("display", "none").style("opacity", 0);
    }
    
    d3.selectAll(".step").classed("is-active", false);
    d3.selectAll(".step-content").style("display", "none");
    d3.select(`.step[data-step='${step}']`).classed("is-active", true);
    d3.select(`.step[data-step='${step}'] .step-content`).style("display", "block");

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
        12: renderFrame12,
        13: renderFrame13,
        14: renderFrame14
    };

    frameMap[step]?.();
}

function renderFrame1() {
    clearViz();
    setVizOpacity(1);
    d3.select(".step[data-step='1'] .step-content").html(`
    <h1>We thought soy was just a health food.</h1>
    <div class="scroll-cue">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10l5 5 5-5" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg>
      <p style="font-size: 0.8rem; margin-top: 0.5rem;">scroll</p>
    </div>
  `);
}

function renderFrame2() {
    clearViz();
    setVizOpacity(1);
    d3.select(".step[data-step='2'] .step-content").html(`
    <h2>It's often seen as the face of plant-based eating.</h2>
    <div class="icon-grid">
      <div class="icon-item"><div class="icon">◻</div><div class="icon-label">tofu</div></div>
      <div class="icon-item"><div class="icon">◠</div><div class="icon-label">soy milk</div></div>
      <div class="icon-item"><div class="icon">●●●</div><div class="icon-label">edamame</div></div>
    </div>
  `);
}

function renderFrame3() {
    clearViz();
    setVizOpacity(1);
    d3.select(".step[data-step='3'] .step-content").html(`
    <h2>But where does all the world's soy actually end up?</h2>
    <p style="margin-top: 1rem; opacity: 0.8;">The data tells a very different story.</p>
  `);
    drawChartAxes();
    drawLegend();
}

function renderFrame4() {
    d3.select("#comparison-overlay").style("display", "none");
    setVizOpacity(1);
    d3.select(".step[data-step='4'] .step-content").html(`<p>A small amount does go straight to our plates.</p>`);
    drawStackedChart({visible: ["human"]});
}

function renderFrame5() {
    d3.select("#comparison-overlay").style("display", "none");
    setVizOpacity(1);
    d3.select(".step[data-step='5'] .step-content").html(`<p>But a much larger portion is fed to farm animals.</p>`);
    drawStackedChart({visible: ["human", "animal"]});
}

function renderFrame6() {
    clearViz();
    setVizOpacity(1);
    const yearData = worldData.find(d => d.year === selectedAreaYear);
    const totalSoy = yearData ? totalFor(yearData) : 0;
    const industrialTotal = yearData ? yearData.processed : 0;
    const percentage = totalSoy === 0 ? 0 : Math.round((industrialTotal / totalSoy) * 100);

    d3.select(".step[data-step='6'] .step-content").html(`
    <div class="wow-stat" style="position: relative; z-index: 2;">
      <p style="opacity: 0.8; font-size: 1rem; margin-bottom: 1rem;">The reality:</p>
      <div class="stat-value" id="percentage-counter">0%</div>
      <p class="stat-label">of global soy is never eaten by humans</p>
      <p style="margin-top: 1.5rem; opacity: 0.8; font-size: 1rem;">Instead, it's used for animal feed, biofuel, and other products.</p>
    </div>
  `);

    animateCounter(document.getElementById("percentage-counter"), percentage);
    drawStackedChart({visible: ["human", "animal", "processed"], background: true, emphasis: true});
}

function renderFrame7() {
    d3.select(".step[data-step='7'] .step-content").html(`
    <h2>This isn't just a global average.</h2>
    <p style="margin-top: 1.5rem; opacity: 0.8;">We see the exact same pattern when we look at individual countries.</p>
  `);
    drawStackedChart({visible: ["human", "animal", "processed"], background: true, emphasis: true});
    setVizOpacity(0.18);
}

function renderFrame8() {
    d3.select("#comparison-overlay").style("display", "none");
    d3.select(".step[data-step='8'] .step-content").html(`
    <h2>Every rectangle is a country.</h2>
    <p style="margin-top: 1rem; opacity: 0.8;">The size shows how much soy they use.</p>
    <p style="margin-top: 0.5rem; opacity: 0.8; font-size: 0.95rem;">The color shows what they use it for.</p>
  `);
    setVizOpacity(1);
    chartLayer.selectAll("path.band").transition().duration(800).style("opacity", 0).remove();
    chartLayer.selectAll("g.axis").transition().duration(800).style("opacity", 0).remove();
    chartLayer.selectAll("g.legend-wrap").transition().duration(800).style("opacity", 0).remove();
    drawTreemap(getLatestCountryData(), 0.4);
}

function renderFrame9() {
    d3.select("#comparison-overlay").style("display", "none");
    d3.select(".step[data-step='9'] .step-content").html(`
    <h2>Even the biggest consumers mostly use soy for feed and industry.</h2>
  `);
    setVizOpacity(1);
    chartLayer.selectAll("path.band").transition().duration(800).style("opacity", 0).remove();
    chartLayer.selectAll("g.axis").transition().duration(800).style("opacity", 0).remove();
    chartLayer.selectAll("g.legend-wrap").transition().duration(800).style("opacity", 0).remove();
    drawTreemap(getLatestCountryData(), 1, priorityCountries);
}

function renderFrame10() {
    d3.select(".step[data-step='10'] .step-content").html(`
    <h2>Take a look for yourself.</h2>
    <p style="opacity: 0.8; font-size: 0.95rem;">Click any country on the map to compare them.</p>
  `);
    setVizOpacity(1);
    chartLayer.selectAll(".treemap-node").transition().duration(400).style("opacity", 1);
    d3.select("#comparison-overlay")
        .style("display", "flex")
        .style("left", "55%")
        .style("width", "45%");
    
    drawTreemap(getLatestCountryData(), 1);
    updateComparison();
}

function renderFrame11() {
    d3.select(".step[data-step='11'] .step-content").html(`<p>Different places, same story.</p>`);
    setVizOpacity(1);
    chartLayer.selectAll(".treemap-node").transition().duration(400).style("opacity", 1);
    d3.select("#comparison-overlay")
        .style("display", "flex")
        .style("left", "55%")
        .style("width", "45%");
    
    drawTreemap(getLatestCountryData(), 1);
    updateComparison();
}

function renderFrame12() {
    setVizOpacity(1);
    clearViz();
    d3.select(".step[data-step='12'] .step-content").html(`
    <h2>Using soy mostly for animal feed is the standard worldwide.</h2>
    <p style="margin-top: 1.5rem; opacity: 0.8; font-size: 1.2rem;">But there's an interesting exception...</p>
  `);
}

function drawAustriaChart() {
    if (d3.select("#austria-chart").empty()) {
        const c = d3.select("#visualization").append("div")
            .attr("id", "austria-chart")
            .style("position", "absolute")
            .style("top", "50%")
            .style("left", "50%")
            .style("transform", "translate(-50%, -50%)")
            .style("width", "80%")
            .style("max-width", "1000px")
            .style("display", "flex")
            .style("flex-direction", "column")
            .style("gap", "2rem")
            .style("opacity", 0)
            .style("transition", "opacity 0.8s ease")
            .style("z-index", "10");

        const buildBar = (label: string, pct1: number, label1: string, c1: string, pct2: number, label2: string, c2: string) => `
            <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                <div style="font-size: 1.2rem; font-weight: 500; color: var(--text-dark);">${label}</div>
                <div style="display: flex; height: 60px; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid rgba(255,255,255,0.3);">
                    <div style="width: ${pct1}%; background: ${c1}; display: flex; align-items: center; justify-content: center; color: white; font-weight: 600;">${pct1}% ${label1}</div>
                    <div style="width: ${pct2}%; background: ${c2}; display: flex; align-items: center; justify-content: center; color: white; font-weight: 600;">${pct2}% ${label2}</div>
                </div>
            </div>
        `;

        c.html(`
            ${buildBar("Global Soy Use", 80, "Feed & Industry", "linear-gradient(90deg, var(--color-animal), var(--color-industrial))", 20, "Human Food", "var(--color-human)")}
            ${buildBar("Austria Soy Use", 50, "Feed", "var(--color-animal)", 50, "Human Food", "var(--color-human)")}
            
            <div style="text-align: center; margin-top: 0.5rem; opacity: 0.6; font-size: 0.9rem;">*Based on 2025 data for Austria</div>

            <div id="austria-badges" style="display: flex; justify-content: space-around; margin-top: 2rem; opacity: 0; transition: opacity 0.8s ease; flex-wrap: wrap; gap: 1.5rem;">
                <div style="background: rgba(220, 218, 211, 0.8); padding: 1.5rem 2rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.4); text-align: center; flex: 1; box-shadow: 0 8px 24px rgba(0,0,0,0.04);">
                    <div style="font-size: 2.2rem; font-weight: 700; color: var(--color-human);">>275k</div>
                    <div style="font-size: 0.95rem; opacity: 0.8; color: var(--text-dark); margin-top: 0.5rem;">Tonnes grown per year (3rd in EU)</div>
                </div>
                <div style="background: rgba(220, 218, 211, 0.8); padding: 1.5rem 2rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.4); text-align: center; flex: 1; box-shadow: 0 8px 24px rgba(0,0,0,0.04);">
                    <div style="font-size: 2.2rem; font-weight: 700; color: var(--color-human);">85,600</div>
                    <div style="font-size: 0.95rem; opacity: 0.8; color: var(--text-dark); margin-top: 0.5rem;">Hectares farmed across the country</div>
                </div>
                <div style="background: rgba(220, 218, 211, 0.8); padding: 1.5rem 2rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.4); text-align: center; flex: 1; box-shadow: 0 8px 24px rgba(0,0,0,0.04);">
                    <div style="font-size: 2.2rem; font-weight: 700; color: var(--color-human);">100%</div>
                    <div style="font-size: 0.95rem; opacity: 0.8; color: var(--text-dark); margin-top: 0.5rem;">GMO-Free and over 33% Organic</div>
                </div>
            </div>

            <div id="austria-restart" style="display: flex; justify-content: center; margin-top: 3rem; opacity: 0; transition: opacity 0.8s ease;">
                <button type="button" onclick="window.scrollTo({top: 0, behavior: 'smooth'})" style="pointer-events: auto; background: var(--color-human); border: none; padding: 0.8rem 1.5rem; border-radius: 6px; color: white; font-weight: 600; cursor: pointer;">↻ Start Over</button>
            </div>
        `);
    }
}

function renderFrame13() {
    clearViz();
    drawAustriaChart();
    d3.select("#austria-chart").style("display", "flex");
    setTimeout(() => d3.select("#austria-chart").style("opacity", 1), 50);
    d3.select("#austria-badges").style("opacity", 0);
    d3.select("#austria-restart").style("opacity", 0).style("pointer-events", "none");
    
    d3.select(".step[data-step='13'] .step-content").html(`
    <h2>A Different Approach</h2>
    <p style="margin-top: 1rem; opacity: 0.8;">Globally, about 80% of soy is used for animal feed and oil. But in Austria, half of the harvest goes directly into human food.</p>
  `);
}

function renderFrame14() {
    clearViz();
    drawAustriaChart();
    d3.select("#austria-chart").style("display", "flex").style("opacity", 1);
    d3.select("#austria-badges").style("opacity", 1);
    d3.select("#austria-restart").style("opacity", 1).style("pointer-events", "auto");
    
    d3.select(".step[data-step='14'] .step-content").html(`
    <h2>Growing Locally</h2>
    <p style="margin-top: 1rem; opacity: 0.8;">This isn't just a small project. Austria grows a massive amount of soy, showing that it's possible to focus on food over feed.</p>
  `);
}

function clearViz() {
    chartLayer.selectAll("path.band, .treemap-node, g.axis, g.legend-wrap")
        .transition().duration(400)
        .style("opacity", 0)
        .remove();
    d3.select("#comparison-overlay").style("display", "none");
}

function setVizOpacity(opacity: number) {
    svg.style("opacity", opacity);
}

function drawChartAxes(domainMax?: number) {
    const minYear = d3.min(worldData, d => d.year) ?? 1961;
    xScale.domain([minYear, selectedAreaYear]);

    const defaultMax = d3.max(worldData, d => d.directHumanFood) ?? 0;
    yScale.domain([0, domainMax ?? defaultMax]);

    const axisY = d3.axisLeft(yScale).tickFormat(d3.format(".0s"));
    const tickCount = width < 600 ? 4 : 8;
    const axisX = d3.axisBottom(xScale).ticks(tickCount).tickFormat(d3.format("d"));

    chartLayer.selectAll("g.chart-frame")
        .data([null])
        .join("g")
        .attr("class", "chart-frame");

    chartLayer.selectAll("g.x-axis")
        .data([null])
        .join("g")
        .attr("class", "axis x-axis active")
        .attr("transform", `translate(0,${seriesHeight})`)
        .transition().duration(800)
        .call(axisX as any);

    chartLayer.selectAll("g.y-axis")
        .data([null])
        .join("g")
        .attr("class", "axis y-axis active")
        .transition().duration(800)
        .call(axisY as any);
}

function drawLegend(activeKeys?: string[]) {
    const items = [
        {label: "Human Food", color: colors.human, key: "human"},
        {label: "Animal Feed", color: colors.animal, key: "animal"},
        {label: "Processed Uses", color: colors.processed, key: "processed"}
    ];

    const legend = chartLayer.selectAll<SVGGElement, null>("g.legend-wrap")
        .data([null])
        .join("g")
        .attr("class", "legend-wrap")
        .attr("transform", `translate(${chartWidth / 2 - 180},${seriesHeight + 54})`);

    legend.style("opacity", 1);

    const itemsJoin = legend.selectAll<SVGGElement, any>("g.legend-item")
        .data(items, d => d.label)
        .join(enter => {
            const g = enter.append("g").attr("class", "legend-item active");
            g.append("rect").attr("width", 12).attr("height", 12).attr("rx", 2);
            g.append("text").attr("x", 18).attr("y", 10).attr("fill", "#f0f0f0").attr("font-size", 12).attr("opacity", 0.72);
            return g;
        });

    itemsJoin
        .attr("transform", (_d, i) => `translate(${i * 180},0)`)
        .transition().duration(800)
        .style("opacity", d => (!activeKeys || activeKeys.includes(d.key)) ? 1 : 0.3)
        .select("rect")
        .attr("fill", d => d.color);

    itemsJoin.select("text").text(d => d.label);
}

function drawStackedChart(options: { visible: ChartSeriesKey[]; background?: boolean; emphasis?: boolean }) {
    chartLayer.selectAll(".treemap-node").transition().duration(400).style("opacity", 0).remove();

    const keys = options.visible;
    const stackData = worldData
        .filter(d => d.year <= selectedAreaYear)
        .map(d => ({
            year: d.year,
            human: d.directHumanFood,
            animal: d.directAnimalFeed,
            processed: d.processed
        }));

    const maxTotal = d3.max(stackData, d => keys.reduce((sum, key) => sum + d[key], 0)) ?? 0;
    
    drawChartAxes(maxTotal);
    drawLegend(keys);

    const seriesConfig: StackedSeries[] = keys.map(key => ({
        key,
        values: stackData.map(d => ({year: d.year, value: d[key]}))
    }));

    const cumulative = (index: number, dataIndex: number) =>
        seriesConfig.slice(0, index).reduce((sum, series) => sum + series.values[dataIndex].value, 0);

    chartLayer.selectAll<SVGPathElement, StackedSeries>("path.band")
        .data(seriesConfig, (d: any) => d.key)
        .join(
            enter => enter.append("path")
                .attr("class", d => `band band-${d.key}`)
                .attr("fill", d => colors[d.key])
                .style("opacity", 0)
                .attr("d", d => {
                    const area = d3.area<{ year: number; value: number }>()
                        .x(p => xScale(p.year))
                        .y0((_, i) => yScale(cumulative(keys.indexOf(d.key), i)))
                        .y1((_, i) => yScale(cumulative(keys.indexOf(d.key), i)));
                    return area(d.values) ?? "";
                })
                .call(enter => enter.transition().duration(800)
                    .style("opacity", d => options.background ? (d.key === "processed" && options.emphasis ? 0.72 : 0.38) : 1)
                    .attr("d", d => {
                        const area = d3.area<{ year: number; value: number }>()
                            .x(p => xScale(p.year))
                            .y0((_, i) => yScale(cumulative(keys.indexOf(d.key), i)))
                            .y1((p, i) => yScale(cumulative(keys.indexOf(d.key), i) + p.value));
                        return area(d.values) ?? "";
                    })
                ),
            update => update.call(update => update.transition().duration(800)
                .style("opacity", d => options.background ? (d.key === "processed" && options.emphasis ? 0.72 : 0.38) : 1)
                .attr("d", d => {
                    const area = d3.area<{ year: number; value: number }>()
                        .x(p => xScale(p.year))
                        .y0((_, i) => yScale(cumulative(keys.indexOf(d.key), i)))
                        .y1((p, i) => yScale(cumulative(keys.indexOf(d.key), i) + p.value));
                    return area(d.values) ?? "";
                })
            ),
            exit => exit.call(exit => exit.transition().duration(800)
                .style("opacity", 0)
                .remove()
            )
        );
}

function drawTreemap(source: CountrySummary[], opacity: number, highlightCountries: string[] = []) {
    const isSideBySide = d3.select("#comparison-overlay").style("display") !== "none";
    const currentTreemapWidth = isSideBySide ? chartWidth * 0.55 : chartWidth;

    const root = d3.hierarchy<{ children: CountrySummary[] }>({children: source})
        .sum((d: any) => (d.total ?? 0))
        .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

    const treemap = d3.treemap<{ children: CountrySummary[] }>()
        .size([currentTreemapWidth, seriesHeight])
        .paddingInner(2)
        .paddingOuter(2);

    treemap(root);

    const nodes = root.leaves() as unknown as d3.HierarchyRectangularNode<CountrySummary>[];
    const color = d3.scaleLinear<string>().domain([0, 1]).range([colors.human, colors.processed]).interpolate(d3.interpolateRgb);

    const node = chartLayer.selectAll<SVGGElement, d3.HierarchyRectangularNode<CountrySummary>>("g.treemap-node")
        .data(nodes, d => d.data.code)
        .join(
            enter => {
                const g = enter.append("g")
                    .attr("class", "treemap-node")
                    .attr("transform", d => `translate(${d.x0},${d.y0})`)
                    .style("opacity", 0);
                g.append("rect");
                g.append("text");
                return g;
            },
            update => update,
            exit => exit.transition().duration(400).style("opacity", 0).remove()
        );

    node.transition().duration(800)
        .attr("transform", d => `translate(${d.x0},${d.y0})`)
        .style("opacity", d => highlightCountries.length ? (highlightCountries.includes(d.data.code) ? 1 : 0.28) : opacity);

    node.select("rect")
        .attr("width", d => Math.max(0, d.x1 - d.x0))
        .attr("height", d => Math.max(0, d.y1 - d.y0))
        .attr("fill", d => color(d.data.processedShare))
        .attr("stroke", "rgba(0,0,0,0.12)")
        .attr("stroke-width", 1);

    node.on("click", (_event, d) => {
        const overlay = d3.select("#comparison-overlay");
        if (overlay.style("display") === "none") return;

        const code = d.data.code;
        const select1 = document.getElementById("country1-select") as HTMLSelectElement;
        const select2 = document.getElementById("country2-select") as HTMLSelectElement;

        if (!select1.value) {
            select1.value = code;
        } else if (!select2.value) {
            if (select1.value !== code) select2.value = code;
        } else {
            if (select1.value !== code && select2.value !== code) {
                select1.value = select2.value;
                select2.value = code;
            }
        }
        updateComparison();
    })
    .style("cursor", "pointer")
    .on("mouseover", function() {
        if (d3.select("#comparison-overlay").style("display") !== "none") {
            d3.select(this).select("rect").attr("stroke", "white").attr("stroke-width", 2);
        }
    })
    .on("mouseout", function() {
        d3.select(this).select("rect").attr("stroke", "rgba(0,0,0,0.12)").attr("stroke-width", 1);
    });

    node.select("text")
        .attr("x", 8)
        .attr("y", 18)
        .attr("fill", d => {
            const c = d3.color(color(d.data.processedShare))?.rgb();
            const lum = c ? (0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b) / 255 : 0;
            return lum > 0.6 ? "#1e1d1b" : "white";
        })
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
        .filter(d => d.year === selectedTreemapYear && d.code === code)
        .map(makeCountrySummary)[0];
    return row ?? null;
}

function updateComparison() {
    const container = d3.select("#comparison-container");
    if (container.empty()) return;

    const country1 = (document.getElementById("country1-select") as HTMLSelectElement | null)?.value || "";
    const country2 = (document.getElementById("country2-select") as HTMLSelectElement | null)?.value || "";
    const rows = [getSelectedCountryValues(country1), getSelectedCountryValues(country2)].filter((d): d is CountrySummary => Boolean(d));

    const cards = container.selectAll<HTMLDivElement, CountrySummary>("div.comparison-card")
        .data(rows, (d, i) => `${d.code}-${i}`)
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
    cards.select(".comparison-meta").text(d => `${selectedTreemapYear} · ${d3.format(",.0f")(d.total)} tonnes`);

    cards.each(function (d) {
        const total = d.total || 1;
        const values: ComparisonValue[] = [
            {key: "human", label: "Human food", value: d.directHumanFood, pct: (d.directHumanFood / total) * 100},
            {key: "animal", label: "Animal feed", value: d.directAnimalFeed, pct: (d.directAnimalFeed / total) * 100},
            {key: "industrial", label: "Industrial", value: d.processed, pct: (d.processed / total) * 100}
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
                    .style("width", `${Math.max(2, v.pct)}%`)
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